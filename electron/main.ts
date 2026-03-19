import { app, BrowserWindow, ipcMain, shell, protocol, net } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { pathToFileURL } from 'url'
import { LuaBridge } from './luaBridge'
import { decodePobCode } from './pobDecoder'

// ── Settings ─────────────────────────────────────────────────────────────────

const SETTINGS_PATH = join(app.getPath('userData'), 'settings.json')

interface Settings {
  luajitPath: string
  pobSourcePath: string
}

function loadSettings(): Settings {
  const defaults: Settings = {
    luajitPath: '',
    pobSourcePath: ''
  }
  try {
    if (existsSync(SETTINGS_PATH)) {
      return { ...defaults, ...JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8')) }
    }
  } catch {
    // ignore
  }
  return defaults
}

function saveSettings(s: Settings): void {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2))
}

// ── Window ────────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null
let luaBridge: LuaBridge | null = null
let lastBuildXml: string = ''  // stored for worker pool
let lastLuajitPath: string = ''
let lastPobSrcPath: string = ''
let activeWorkers: LuaBridge[] = []  // track workers to kill on new build
let buildGeneration = 0  // increments on each new build
const mainProcessLog: string[] = []  // capture logs for debug panel
const origLog = console.log
const origErr = console.error
console.log = (...args: unknown[]) => { origLog(...args); mainProcessLog.push(args.map(String).join(' ')); if (mainProcessLog.length > 500) mainProcessLog.shift() }
console.error = (...args: unknown[]) => { origErr(...args); mainProcessLog.push('[ERROR] ' + args.map(String).join(' ')); if (mainProcessLog.length > 500) mainProcessLog.shift() }

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0D0D0D',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow file:// URLs for local asset icons
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('settings:load', () => loadSettings())

ipcMain.handle('settings:save', (_e, settings: Settings) => {
  saveSettings(settings)
  return { ok: true }
})

ipcMain.handle('settings:resourcePath', () => {
  // Path to bundled resources (luajit, pob-src)
  return process.env.NODE_ENV === 'development'
    ? join(app.getAppPath(), 'resources')
    : process.resourcesPath
})

ipcMain.handle('pob:loadBuild', async (_e, pobCode: string) => {
  const settings = loadSettings()

  // Decode build code → XML
  let xml: string
  try {
    xml = await decodePobCode(pobCode)
  } catch (err) {
    return { ok: false, error: `Failed to decode build code: ${(err as Error).message}` }
  }

  // Determine LuaJIT path
  const resourcesPath = process.env.NODE_ENV === 'development'
    ? join(app.getAppPath(), 'resources')
    : process.resourcesPath

  const luajitPath = settings.luajitPath || getBundledLuaJitPath(resourcesPath)
  // pobSrcPath should point to the directory containing HeadlessWrapper.lua
  const pobSrcPath = settings.pobSourcePath || join(resourcesPath, 'pob-src')

  if (!existsSync(pobSrcPath)) {
    return {
      ok: false,
      error: 'PoB source not found. Please configure the PoB source path in Settings.'
    }
  }

  // Store for worker pool
  lastBuildXml = xml
  lastLuajitPath = luajitPath
  lastPobSrcPath = pobSrcPath

  // Kill EVERYTHING from previous build — main bridge + all parallel workers
  if (luaBridge) { luaBridge.kill() }
  for (const w of activeWorkers) { try { w.kill() } catch {} }
  activeWorkers = []
  buildGeneration++
  luaBridge = new LuaBridge(luajitPath, pobSrcPath)

  try {
    await luaBridge.ensureReady()
    const result = await luaBridge.send('load_build_xml', { xml, name: 'Analysis' })
    if (!result.ok) return result

    // Fetch baseline stats
    const stats = await luaBridge.send('get_stats', {
      fields: [
        'FullDPS', 'TotalDPS', 'CombinedDPS', 'TotalDot', 'TotalDotDPS',
        'Life', 'EnergyShield', 'Mana',
        'Armour', 'Evasion', 'BlockChance',
        'CritChance', 'CritMultiplier', 'HitChance',
        'Speed', 'SkillName', 'SkillPartName'
      ]
    })
    const skills = await luaBridge.send('get_skills', {})
    const items = await luaBridge.send('get_items', {})
    const tree = await luaBridge.send('get_tree', {})
    const info = await luaBridge.send('get_build_info', {})

    return { ok: true, decodedXml: xml, stats: stats, skills, items, tree, info }
  } catch (err) {
    return { ok: false, decodedXml: xml, error: (err as Error).message }
  }
})

ipcMain.handle('pob:runSensitivity', async (_e, request: SensitivityRequest) => {
  if (!luaBridge || luaBridge.isDead()) {
    return { ok: false, error: 'No build loaded' }
  }
  try {
    const result = await luaBridge.send('run_sensitivity', request)
    return result
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
})

ipcMain.handle('pob:calcWith', async (_e, params: object) => {
  if (!luaBridge || luaBridge.isDead()) {
    return { ok: false, error: 'No build loaded' }
  }
  try {
    return await luaBridge.send('calc_with', params)
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
})

// Debug log retrieval
ipcMain.handle('pob:getMainProcessLog', () => mainProcessLog.join('\n'))

// Parallel batch calc — spawns N workers, splits jobs, collects results
ipcMain.handle('pob:parallelBatchCalc', async (_e, jobs: object[]) => {
  if (!lastBuildXml || !lastLuajitPath || !lastPobSrcPath) {
    return { ok: false, error: 'No build loaded' }
  }

  const cpuCount = require('os').cpus().length
  const workerCount = Math.min(Math.max(2, Math.floor(cpuCount / 2)), 6)

  // Split jobs evenly across workers
  const chunks: object[][] = Array.from({ length: workerCount }, () => [])
  jobs.forEach((job, i) => chunks[i % workerCount].push(job))

  // Spawn workers, load build, run batch, collect results
  const workerPromises = chunks.map(async (chunk) => {
    if (chunk.length === 0) return []
    const worker = new LuaBridge(lastLuajitPath, lastPobSrcPath)
    try {
      await worker.ensureReady()
      // Load the same build
      const loadResult = await worker.send('load_build_xml', { xml: lastBuildXml, name: 'Analysis' })
      if (!loadResult.ok) return chunk.map(() => ({ ok: false, error: 'Worker failed to load build' }))
      // Run batch
      const batchResult = await worker.send('batch_calc', { jobs: chunk }) as { ok: boolean; results?: any[] }
      return batchResult.results || []
    } catch (e) {
      return chunk.map(() => ({ ok: false, error: (e as Error).message }))
    } finally {
      worker.kill()
    }
  })

  try {
    const workerResults = await Promise.all(workerPromises)

    // Reassemble results in original job order
    const results: any[] = new Array(jobs.length)
    let workerIdx = 0
    const counters = new Array(workerCount).fill(0)
    for (let i = 0; i < jobs.length; i++) {
      const w = i % workerCount
      results[i] = workerResults[w][counters[w]++]
    }

    return { ok: true, results, workerCount }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
})

// Tooltip data
ipcMain.handle('pob:getTooltip', async (_e, params: object) => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false }
  try { return await luaBridge.send('get_tooltip', params) } catch { return { ok: false } }
})

// Batch sensitivity calc (all jobs in one IPC call)
ipcMain.handle('pob:batchCalc', async (_e, jobs: object[]) => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false, error: 'No build loaded' }
  try { return await luaBridge.send('batch_calc', { jobs }) } catch (e) { return { ok: false, error: (e as Error).message } }
})

// Spec/skill set switching
ipcMain.handle('pob:getSpecList', async () => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false, error: 'No build loaded' }
  try { return await luaBridge.send('get_spec_list', {}) } catch (e) { return { ok: false, error: (e as Error).message } }
})

ipcMain.handle('pob:setActiveSpec', async (_e, index: number) => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false, error: 'No build loaded' }
  try { return await luaBridge.send('set_active_spec', { index }) } catch (e) { return { ok: false, error: (e as Error).message } }
})

ipcMain.handle('pob:getSkillSetList', async () => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false, error: 'No build loaded' }
  try { return await luaBridge.send('get_skill_set_list', {}) } catch (e) { return { ok: false, error: (e as Error).message } }
})

ipcMain.handle('pob:setActiveSkillSet', async (_e, index: number) => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false, error: 'No build loaded' }
  try { return await luaBridge.send('set_active_skill_set', { index }) } catch (e) { return { ok: false, error: (e as Error).message } }
})

ipcMain.handle('pob:getItemSetList', async () => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false, error: 'No build loaded' }
  try { return await luaBridge.send('get_item_set_list', {}) } catch (e) { return { ok: false, error: (e as Error).message } }
})

ipcMain.handle('pob:setActiveItemSet', async (_e, id: number) => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false, error: 'No build loaded' }
  try { return await luaBridge.send('set_active_item_set', { id }) } catch (e) { return { ok: false, error: (e as Error).message } }
})

// Asset path resolver
ipcMain.handle('pob:getAssetPath', (_e, subpath: string) => {
  const resourcesPath = process.env.NODE_ENV === 'development'
    ? join(app.getAppPath(), 'resources')
    : process.resourcesPath
  return join(resourcesPath, 'pob-src', subpath)
})

// Analysis pages
const analysisHandler = (action: string) => async () => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false, error: 'No build loaded' }
  try { return await luaBridge.send(action, {}) } catch (e) { return { ok: false, error: (e as Error).message } }
}
ipcMain.handle('pob:getDangerAnalysis', analysisHandler('get_danger_analysis'))
ipcMain.handle('pob:getSynergies', analysisHandler('get_synergies'))
ipcMain.handle('pob:getDamageBreakdown', analysisHandler('get_damage_breakdown'))
ipcMain.handle('pob:getRecoveryAnalysis', analysisHandler('get_recovery_analysis'))
ipcMain.handle('pob:calcRampTimeline', analysisHandler('calc_ramp_timeline'))
ipcMain.handle('pob:listGems', analysisHandler('list_gems'))
ipcMain.handle('pob:swapGem', async (_e, params) => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false, error: 'No build loaded' }
  try { return await luaBridge.send('swap_gem', params) } catch (e) { return { ok: false, error: (e as Error).message } }
})

// Reload all build data after switching spec/skills
ipcMain.handle('pob:reloadBuildData', async () => {
  if (!luaBridge || luaBridge.isDead()) return { ok: false, error: 'No build loaded' }
  try {
    const stats = await luaBridge.send('get_stats', {})
    const skills = await luaBridge.send('get_skills', {})
    const items = await luaBridge.send('get_items', {})
    const tree = await luaBridge.send('get_tree', {})
    const info = await luaBridge.send('get_build_info', {})
    return { ok: true, stats, skills, items, tree, info }
  } catch (e) { return { ok: false, error: (e as Error).message } }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

interface SensitivityRequest {
  type: 'gem' | 'notable' | 'item'
  groupIdx?: number
  gemIdx?: number
  nodeId?: number
  slot?: string
}

function getBundledLuaJitPath(resourcesPath: string): string {
  const platform = process.platform
  const arch = process.arch
  if (platform === 'darwin') {
    return join(resourcesPath, 'luajit', arch === 'arm64' ? 'luajit-mac-arm64' : 'luajit-mac-x64')
  }
  if (platform === 'win32') {
    return join(resourcesPath, 'luajit', 'luajit-win-x64.exe')
  }
  return join(resourcesPath, 'luajit', 'luajit-linux-x64')
}

// ── Custom protocol for local PoB assets ─────────────────────────────────────
protocol.registerSchemesAsPrivileged([
  { scheme: 'pob-assets', privileges: { standard: true, secure: true, supportFetchAPI: true } }
])

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Clean up old portable extraction folders on Windows
  if (process.platform === 'win32') {
    try {
      const tmpDir = require('os').tmpdir()
      const fs = require('fs')
      const entries = fs.readdirSync(tmpDir)
      const myDir = require('path').basename(require('path').dirname(app.getAppPath()))
      for (const entry of entries) {
        // Portable exe extracts to random-named dirs in %TEMP% - clean dirs older than 1 day
        // that look like electron-builder portable extractions (contain 'resources' subfolder)
        if (entry === myDir) continue // don't clean current
        const fullPath = require('path').join(tmpDir, entry)
        try {
          const stat = fs.statSync(fullPath)
          if (!stat.isDirectory()) continue
          const age = Date.now() - stat.mtimeMs
          if (age < 86400000) continue // less than 1 day old
          // Check if it looks like our portable extraction
          if (fs.existsSync(require('path').join(fullPath, 'resources', 'pob-src'))) {
            console.log('[Cleanup] Removing old portable extraction:', entry)
            fs.rmSync(fullPath, { recursive: true, force: true })
          }
        } catch { /* skip */ }
      }
    } catch { /* ignore cleanup errors */ }
  }

  // Register protocol to serve PoB asset files (Assets/ and TreeData/)
  protocol.handle('pob-assets', (request) => {
    const path = decodeURIComponent(request.url.replace('pob-assets://', ''))
    const resourcesPath = process.env.NODE_ENV === 'development'
      ? join(app.getAppPath(), 'resources')
      : process.resourcesPath
    let filePath: string
    if (path.startsWith('TreeData/')) {
      filePath = join(resourcesPath, 'pob-src', path)
    } else {
      filePath = join(resourcesPath, 'pob-src', 'Assets', path)
    }
    return net.fetch(pathToFileURL(filePath).href)
  })
  createWindow()
})

app.on('window-all-closed', () => {
  // Kill all LuaJIT processes
  luaBridge?.kill()
  for (const w of activeWorkers) { try { w.kill() } catch {} }
  activeWorkers = []

  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  // Final cleanup of any lingering processes
  luaBridge?.kill()
  for (const w of activeWorkers) { try { w.kill() } catch {} }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
