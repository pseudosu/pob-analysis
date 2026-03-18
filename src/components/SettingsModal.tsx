import { useState, useEffect } from 'react'
import type { Settings } from '../types/pob'

interface Props {
  open: boolean
  onClose: () => void
}

declare global {
  interface Window {
    api: {
      settings: {
        load: () => Promise<Settings>
        save: (s: Settings) => Promise<{ ok: boolean }>
        resourcePath: () => Promise<string>
      }
      pob: {
        loadBuild: (code: string) => Promise<unknown>
        runSensitivity: (req: object) => Promise<unknown>
        calcWith: (params: object) => Promise<unknown>
      }
    }
  }
}

export function SettingsModal({ open, onClose }: Props) {
  const [settings, setSettings] = useState<Settings>({ luajitPath: '', pobSourcePath: '' })
  const [resourcePath, setResourcePath] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    window.api.settings.load().then(s => setSettings(s))
    window.api.settings.resourcePath().then(p => setResourcePath(p))
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    await window.api.settings.save(settings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel p-6 w-[560px] max-w-full space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-poe-gold font-semibold text-lg">Settings</h2>
          <button onClick={onClose} className="text-poe-muted hover:text-poe-gold transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        {/* LuaJIT path */}
        <div className="space-y-2">
          <label className="stat-label block">LuaJIT Binary Path</label>
          <input
            type="text"
            value={settings.luajitPath}
            onChange={e => setSettings(s => ({ ...s, luajitPath: e.target.value }))}
            placeholder="e.g. /opt/homebrew/bin/luajit  (leave blank to use bundled)"
            className="w-full bg-black/40 border border-poe-border rounded px-3 py-2
                       text-poe-text text-sm font-mono
                       focus:outline-none focus:border-poe-gold/60 transition-colors
                       placeholder-poe-muted/40"
          />
          <p className="text-poe-muted/60 text-xs">
            Leave blank to use the bundled LuaJIT binary.
          </p>
        </div>

        {/* PoB source path */}
        <div className="space-y-2">
          <label className="stat-label block">PoB Community Source Path</label>
          <input
            type="text"
            value={settings.pobSourcePath}
            onChange={e => setSettings(s => ({ ...s, pobSourcePath: e.target.value }))}
            placeholder="e.g. /Users/you/PathOfBuilding/src  (leave blank to use bundled)"
            className="w-full bg-black/40 border border-poe-border rounded px-3 py-2
                       text-poe-text text-sm font-mono
                       focus:outline-none focus:border-poe-gold/60 transition-colors
                       placeholder-poe-muted/40"
          />
          <p className="text-poe-muted/60 text-xs">
            Path to the <code className="text-poe-text">src/</code> folder of PathOfBuildingCommunity/PathOfBuilding.{' '}
            Leave blank to use the bundled copy.
          </p>
        </div>

        {resourcePath && (
          <div className="bg-black/20 rounded p-3 border border-poe-border/30">
            <div className="stat-label mb-1">Bundled Resources Path</div>
            <div className="text-poe-muted font-mono text-xs break-all">{resourcePath}</div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-poe-border/30">
          <a
            href="https://github.com/PathOfBuildingCommunity/PathOfBuilding"
            className="text-poe-gold/70 text-xs hover:text-poe-gold transition-colors"
            onClick={e => { e.preventDefault(); window.open('https://github.com/PathOfBuildingCommunity/PathOfBuilding') }}
          >
            Get PoB Community source →
          </a>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
