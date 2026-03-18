import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { join } from 'path'
import { createInterface } from 'readline'
import { EventEmitter } from 'events'

const READY_TIMEOUT_MS = 180_000  // 3 min — Windows cold start from temp dir is slow
const COMMAND_TIMEOUT_MS = 300_000  // 5 min for batch calcs

interface PendingRequest {
  resolve: (value: LuaResponse) => void
  reject: (reason: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export interface LuaResponse {
  ok: boolean
  error?: string
  [key: string]: unknown
}

/**
 * Manages a LuaJIT subprocess running PoB's HeadlessWrapper.lua.
 * Communicates via newline-delimited JSON over stdin/stdout.
 */
export class LuaBridge extends EventEmitter {
  private proc: ChildProcessWithoutNullStreams | null = null
  private ready = false
  private dead = false
  private queue: PendingRequest[] = []
  private active: PendingRequest | null = null
  private luajitPath: string
  private pobSrcPath: string
  private readyPromise: Promise<void> | null = null

  constructor(luajitPath: string, pobSrcPath: string) {
    super()
    this.luajitPath = luajitPath
    this.pobSrcPath = pobSrcPath
  }

  isDead(): boolean {
    return this.dead
  }

  async ensureReady(): Promise<void> {
    if (this.ready) return
    if (this.dead || !this.proc) {
      this.start()
    }
    return this.readyPromise!
  }

  private start(): void {
    this.dead = false
    this.ready = false

    const bridgePath = join(this.pobSrcPath, 'pobBridge.lua')
    const runtimeLuaPath = join(this.pobSrcPath, '..', 'pob-runtime', 'lua')

    // On Windows, lua51.dll must be findable - add luajit dir to PATH
    const luajitDir = require('path').dirname(this.luajitPath)
    const pathSep = process.platform === 'win32' ? ';' : ':'
    const envPath = (process.env.PATH || '') + pathSep + luajitDir

    const luaPath = join(this.pobSrcPath, '?.lua') + ';' +
                    join(this.pobSrcPath, '?', 'init.lua') + ';' +
                    join(runtimeLuaPath, '?.lua') + ';./?.lua'
    // On Windows, .dll must come before .so to avoid loading Mac binaries
    const luaCpath = process.platform === 'win32'
      ? join(runtimeLuaPath, '?.dll') + ';./?.dll'
      : join(runtimeLuaPath, '?.so') + ';' +
        join(runtimeLuaPath, '?.dylib') + ';./?.so'

    // Verbose logging for debug
    console.log('[LuaBridge] Starting LuaJIT:')
    console.log('[LuaBridge]   luajitPath:', this.luajitPath)
    console.log('[LuaBridge]   bridgePath:', bridgePath)
    console.log('[LuaBridge]   pobSrcPath:', this.pobSrcPath)
    console.log('[LuaBridge]   runtimeLuaPath:', runtimeLuaPath)
    console.log('[LuaBridge]   luajitDir:', luajitDir)
    console.log('[LuaBridge]   platform:', process.platform)
    console.log('[LuaBridge]   LUA_PATH:', luaPath)
    console.log('[LuaBridge]   LUA_CPATH:', luaCpath)
    console.log('[LuaBridge]   exists luajit:', require('fs').existsSync(this.luajitPath))
    console.log('[LuaBridge]   exists bridge:', require('fs').existsSync(bridgePath))
    console.log('[LuaBridge]   exists pobSrc:', require('fs').existsSync(this.pobSrcPath))
    console.log('[LuaBridge]   exists runtimeLua:', require('fs').existsSync(runtimeLuaPath))

    this.proc = spawn(this.luajitPath, [bridgePath], {
      env: {
        ...process.env,
        CI: '1',
        PATH: envPath,
        LUA_PATH: luaPath,
        LUA_CPATH: luaCpath
      },
      cwd: this.pobSrcPath
    })

    this.proc.on('error', (err) => {
      console.error('[LuaBridge] Spawn error:', err.message)
    })

    const rl = createInterface({ input: this.proc.stdout })

    let readyResolve!: () => void
    let readyReject!: (e: Error) => void
    this.readyPromise = new Promise<void>((res, rej) => {
      readyResolve = res
      readyReject = rej
    })

    const readyTimer = setTimeout(() => {
      console.error('[LuaBridge] TIMEOUT - LuaJIT did not become ready in', READY_TIMEOUT_MS, 'ms')
      console.error('[LuaBridge] Check stderr output above for errors')
      readyReject(new Error('LuaJIT HeadlessWrapper did not become ready within timeout'))
    }, READY_TIMEOUT_MS)

    rl.on('line', (line: string) => {
      const trimmed = line.trim()
      if (!trimmed) return

      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(trimmed)
      } catch {
        // Non-JSON debug output from PoB — ignore
        console.log('[Lua]', trimmed)
        return
      }

      if (!this.ready) {
        if (msg.ready === true) {
          clearTimeout(readyTimer)
          this.ready = true
          readyResolve()
        } else if (msg.ok === false) {
          clearTimeout(readyTimer)
          readyReject(new Error((msg.error as string) || 'Lua init failed'))
        }
        return
      }

      // Deliver to active request
      if (this.active) {
        clearTimeout(this.active.timer)
        const req = this.active
        this.active = null
        req.resolve(msg as LuaResponse)
        this.processQueue()
      }
    })

    this.proc.stderr.on('data', (data: Buffer) => {
      const msg = data.toString().trim()
      if (msg) console.error('[LuaBridge stderr]', msg)
    })

    this.proc.on('close', (code) => {
      console.log('[LuaBridge] Process exited with code', code)
      this.dead = true
      this.ready = false
      const err = new Error(`LuaJIT process exited with code ${code}`)
      if (this.active) {
        clearTimeout(this.active.timer)
        this.active.reject(err)
        this.active = null
      }
      for (const req of this.queue) {
        clearTimeout(req.timer)
        req.reject(err)
      }
      this.queue = []
      this.emit('died', err)
    })
  }

  /**
   * Send a command to the Lua bridge. Commands are serialized.
   */
  send(action: string, params: object = {}): Promise<LuaResponse> {
    return new Promise((resolve, reject) => {
      const raw = JSON.stringify({ action, params }) + '\n'
      const timer = setTimeout(() => {
        if (this.active?.resolve === resolve) {
          this.active = null
          this.processQueue()
        }
        reject(new Error(`Command '${action}' timed out after ${COMMAND_TIMEOUT_MS}ms`))
      }, COMMAND_TIMEOUT_MS)

      const req = { resolve, reject, timer, _raw: raw } as PendingRequest & { _raw: string }

      if (this.active) {
        this.queue.push(req)
      } else {
        this.active = req
        this.writeRaw(raw)
      }
    })
  }

  private processQueue(): void {
    if (this.queue.length === 0) return
    const next = this.queue.shift()!
    this.active = next
    this.writeRaw((next as PendingRequest & { _raw: string })._raw)
  }

  private writeRaw(raw: string): void {
    this.proc?.stdin.write(raw)
  }

  kill(): void {
    this.proc?.kill()
    this.dead = true
  }
}
