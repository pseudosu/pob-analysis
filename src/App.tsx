import { useState, useRef } from 'react'
import { BuildInput } from './components/BuildInput'
import { DpsOverview } from './components/DpsOverview'
import { FactorList } from './components/FactorList'
import { SkillsPanel } from './components/SkillsPanel'
import { GemLinks } from './components/GemLinks'
import { GearDisplay } from './components/GearDisplay'
import { SettingsModal } from './components/SettingsModal'
import { DangerAnalysis } from './components/DangerAnalysis'
import { SynergyDetector } from './components/SynergyDetector'
import { DamageBreakdown } from './components/DamageBreakdown'
import { DefenseOverview } from './components/DefenseOverview'
import { DefenseBreakdown } from './components/DefenseBreakdown'
import { EhpFactorList } from './components/EhpFactorList'
import { BuildGuide } from './components/BuildGuide'
import { clearTooltipCache } from './components/PoeTooltip'
import { runSensitivityAnalysis } from './lib/sensitivity'
import type { BuildData, Factor } from './types/pob'

type AppState = 'idle' | 'loading' | 'analyzing' | 'done' | 'error'
type Section = 'offense' | 'defense' | 'guide'
type OffenseTab = 'factors' | 'gear' | 'breakdown' | 'synergies'
type DefenseTab = 'ehp' | 'dangers' | 'def-breakdown'

export default function App() {
  const [state, setState] = useState<AppState>('idle')
  const [error, setError] = useState<string>()
  const [build, setBuild] = useState<BuildData | null>(null)
  const [factors, setFactors] = useState<Factor[]>([])
  const [progress, setProgress] = useState({ pct: 0, label: '' })
  const [showSettings, setShowSettings] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [debugData, setDebugData] = useState<unknown>(null)
  const [lastPobCode, setLastPobCode] = useState('')
  const [buildKey, setBuildKey] = useState(0)
  const analysisVersionRef = useRef(0) // ref so closures always see latest value
  const factorCacheRef = useRef<Record<string, Factor[]>>({})
  const ehpCacheRef = useRef<Record<string, any[]>>({})
  const [configKey, setConfigKey] = useState('')
  const [section, setSection] = useState<Section>('offense')
  const [offenseTab, setOffenseTab] = useState<OffenseTab>('factors')
  const [defenseTab, setDefenseTab] = useState<DefenseTab>('ehp')
  const [dangerData, setDangerData] = useState<Record<string, unknown> | null>(null)
  const [synergyData, setSynergyData] = useState<Record<string, unknown> | null>(null)
  const [breakdownData, setBreakdownData] = useState<Record<string, unknown> | null>(null)
  const [ehpFactors, setEhpFactors] = useState<any[]>([])
  const [ehpProgress, setEhpProgress] = useState({ pct: 0, label: '' })
  const [ehpAnalyzing, setEhpAnalyzing] = useState(false)
  // ehpCache is in ehpCacheRef above

  const runAnalysis = async (buildData: BuildData, cacheKey: string) => {
    const myVersion = analysisVersionRef.current
    // Check cache first
    if (factorCacheRef.current[cacheKey]) {
      setFactors(factorCacheRef.current[cacheKey])
      setState('done')
      return
    }

    setState('analyzing')
    const baselineDps = buildData.stats.CombinedDPS || buildData.stats.FullDPS || buildData.stats.TotalDPS || 0

    const accumulated: Factor[] = []
    await runSensitivityAnalysis(
      buildData,
      baselineDps,
      (params) => window.api.pob.calcWith(params) as Promise<{
        ok: boolean; FullDPS?: number; CombinedDPS?: number; TotalDPS?: number; [k: string]: unknown
      }>,
      (factor) => {
        if (myVersion !== analysisVersionRef.current) return
        accumulated.push(factor)
        setFactors([...accumulated].sort((a, b) => b.impactPct - a.impactPct))
      },
      (pct, label) => { if (myVersion === analysisVersionRef.current) setProgress({ pct, label }) }
    )

    // Only write final results if this analysis is still current
    if (myVersion !== analysisVersionRef.current) return
    const final = [...accumulated].sort((a, b) => b.impactPct - a.impactPct)
    setFactors(final)
    factorCacheRef.current[cacheKey] = final
    setState('done')

    // Auto-run EHP analysis in background after DPS completes
    runEhpAnalysis(buildData, cacheKey)
  }

  const handleAnalyze = async (code: string) => {
    // Clean slate — clear ALL state
    setState('loading')
    setError(undefined)
    setFactors([])
    setEhpFactors([])
    setBuild(null)
    setDebugData(null)
    factorCacheRef.current = {}
    ehpCacheRef.current = {}
    setDangerData(null)
    setSynergyData(null)
    setBreakdownData(null)
    setSection('offense')
    setOffenseTab('factors')
    setDefenseTab('ehp')
    setConfigKey('')
    setProgress({ pct: 0, label: '' })
    setEhpProgress({ pct: 0, label: '' })
    setEhpAnalyzing(false)
    setConfigDirty(false)
    setLastPobCode(code)
    const newVersion = Date.now()
    setBuildKey(newVersion)
    analysisVersionRef.current = newVersion // Abort any in-flight analysis
    // Clear global caches
    ;(window as any).__sensitivityLog = ''
    ;(window as any).__ehpSensitivityLog = ''
    ;(window as any).__pobAssetsBase = ''
    ;(window as any).__pobTreeBase = ''
    clearTooltipCache()

    // Force React to flush all state clears and unmount old components
    await new Promise(r => setTimeout(r, 100))

    try {
      const res = await window.api.pob.loadBuild(code) as {
        ok: boolean; error?: string
        stats: BuildData['stats']
        info: BuildData['info']
        skills: BuildData['skills']
        items: BuildData['items']
        tree: BuildData['tree']
      }
      setDebugData(res)

      if (!res.ok) {
        setState('error')
        setError(res.error || 'Failed to load build')
        return
      }

      const buildData: BuildData = {
        stats: res.stats,
        info: res.info,
        skills: res.skills,
        items: res.items,
        tree: res.tree
      }
      setBuild(buildData)
      // Resolve asset base path for icons
      try {
        const assetsBase = await window.api.pob.getAssetPath('Assets')
        const treeBase = await window.api.pob.getAssetPath('TreeData/3_27')
        ;(window as any).__pobAssetsBase = assetsBase
        ;(window as any).__pobTreeBase = treeBase
      } catch { /* ignore */ }
      // Fetch analysis data in parallel (non-blocking)
      fetchAnalysisData()
      const key = 'initial'
      setConfigKey(key)
      await runAnalysis(buildData, key)
    } catch (err) {
      setState('error')
      setError((err as Error).message)
    }
  }

  const fetchAnalysisData = async () => {
    try {
      const [dangerRes, synergyRes, breakdownRes] = await Promise.all([
        window.api.pob.getDangerAnalysis() as Promise<Record<string, unknown>>,
        window.api.pob.getSynergies() as Promise<Record<string, unknown>>,
        window.api.pob.getDamageBreakdown() as Promise<Record<string, unknown>>,
      ])
      if (dangerRes.ok) setDangerData(dangerRes)
      if (synergyRes.ok) setSynergyData(synergyRes)
      if (breakdownRes.ok) setBreakdownData(breakdownRes)
    } catch { /* ignore */ }
  }

  const [configDirty, setConfigDirty] = useState(false) // true when config changed but not recalculated

  const handleConfigChange = async () => {
    const res = await window.api.pob.reloadBuildData() as {
      ok: boolean; stats: BuildData['stats']; info: BuildData['info']
      skills: BuildData['skills']; items: BuildData['items']; tree: BuildData['tree']
    }
    if (!res.ok) return
    const newBuild = { stats: res.stats, info: res.info, skills: res.skills, items: res.items, tree: res.tree }
    setBuild(newBuild)
    fetchAnalysisData()
    // Generate a cache key from the current config
    const specRes = await window.api.pob.getSpecList() as { ok: boolean; activeSpec: number }
    const ssRes = await window.api.pob.getSkillSetList() as { ok: boolean; activeSkillSet: number }
    const isRes = await window.api.pob.getItemSetList() as { ok: boolean; activeItemSetId: number }
    const key = `${specRes.activeSpec || 0}:${ssRes.activeSkillSet || 0}:${isRes.activeItemSetId || 0}`
    setConfigKey(key)
    // Use cached results if available, otherwise mark as dirty
    if (factorCacheRef.current[key]) {
      setFactors(factorCacheRef.current[key])
      setState('done')
      setConfigDirty(false)
    } else {
      setFactors([])
      setState('done')
      setConfigDirty(true) // user needs to click Recalculate
    }
    const ehpKey = key + ':ehp'
    if (ehpCacheRef.current[ehpKey]) {
      setEhpFactors(ehpCacheRef.current[ehpKey])
    } else {
      setEhpFactors([])
    }
  }

  const handleRecalcAll = async () => {
    if (!build) return
    setConfigDirty(false)
    await runAnalysis(build, configKey)
  }

  const handleRecalculate = async () => {
    if (!build || state === 'analyzing') return
    setConfigDirty(false)
    await runAnalysis(build, configKey)
  }

  const runEhpAnalysis = async (buildData?: BuildData, baseKey?: string) => {
    const bd = buildData || build
    if (!bd || ehpAnalyzing) return
    const myVersion = analysisVersionRef.current
    const ck = (baseKey || configKey) + ':ehp'
    if (ehpCacheRef.current[ck]) { setEhpFactors(ehpCacheRef.current[ck]); return }
    setEhpAnalyzing(true)
    setEhpFactors([])

    // Fetch real baseline EHP with a no-op calcWith (TotalEHP may not be in initial stats)
    const baselineResult = await (window as any).api.pob.calcWith({}) as any
    const baselineEhp = baselineResult?.TotalEHP || 0
    const baselineLife = baselineResult?.Life || bd.stats.Life || 0
    const baselineES = baselineResult?.EnergyShield || bd.stats.EnergyShield || 0
    const baselineArmour = baselineResult?.Armour || bd.stats.Armour || 0
    const baselineEvade = baselineResult?.MeleeEvadeChance || 0
    const baseVal = baselineEhp || baselineLife

    if (baseVal <= 0) { setEhpAnalyzing(false); return }

    const skillSets = bd.skills?.skillSets
    const jobs: { params: object; name: string; category: string; detail: string; groupLabel?: string; id: string }[] = []

    // Test ALL gems, items, notables — but only KEEP results that actually change EHP
    // (the filtering happens at result time, not job time, so we don't miss defensive auras etc.)
    const seenGems = new Set<string>()
    if (skillSets?.[0]) {
      for (let gi = 0; gi < skillSets[0].length; gi++) {
        const g = skillSets[0][gi]
        if (!g?.enabled || !g.gems) continue
        for (let gemI = 0; gemI < g.gems.length; gemI++) {
          const gem = g.gems[gemI]
          if (!gem.enabled) continue
          const key = `${gem.skillId || gem.nameSpec}-${gi}`
          if (gem.skillId && seenGems.has(gem.skillId) && gi > 0) continue
          if (gem.skillId) seenGems.add(gem.skillId)
          jobs.push({
            params: { disableGem: { groupIdx: gi, gemName: gem.nameSpec, skillId: gem.skillId, gemIdx: gemI } },
            name: gem.nameSpec, category: 'gem', detail: `L${gem.level}`,
            groupLabel: g.slot || g.label || `Group ${gi+1}`,
            id: `gem-${gi}-${gemI}`,
          })
        }
      }
    }
    // All item slots
    const slots = (bd.items?.slots || []) as any[]
    for (const slot of slots) {
      if (!slot.itemId || slot.itemId === 0) continue
      jobs.push({
        params: { unequipSlot: slot.name },
        name: slot.itemName || slot.name, category: 'item', detail: slot.name,
        id: `item-${slot.name}`,
      })
    }
    // All notables
    const notables = (bd.tree as any)?.notables as any[] | undefined
    if (notables) {
      for (const n of notables) {
        jobs.push({
          params: { removeNode: n.id },
          name: n.name, category: 'notable', detail: n.type === 'keystone' ? 'Keystone' : 'Notable',
          id: `node-${n.id}`,
        })
      }
    }

    const accumulated: any[] = []
    const parallelFn = (window as any).api?.pob?.parallelBatchCalc
    const batchFn = (window as any).api?.pob?.batchCalc
    const ehpLog: string[] = [`[${new Date().toISOString()}] EHP Sensitivity starting, baselineEHP=${baseVal}, baselineLife=${baselineLife}, baselineES=${baselineES}, baselineArmour=${baselineArmour}`]

    const stale = () => myVersion !== analysisVersionRef.current

    // Try parallel first
    if (parallelFn && jobs.length > 10) {
      if (stale()) { setEhpAnalyzing(false); return }
      setEhpProgress({ pct: 5, label: `Spawning workers for ${jobs.length} EHP jobs...` })
      try {
        const res = await parallelFn(jobs.map(j => j.params)) as { ok: boolean; results?: any[]; workerCount?: number }
        if (stale()) { setEhpAnalyzing(false); return }
        if (res.ok && res.results) {
          ehpLog.push(`  Parallel mode: ${res.workerCount} workers`)
          for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i]
            const r = res.results[i]
            if (!r?.ok) continue
            const withoutEhp = r.TotalEHP || 0
            const withoutLife = r.Life || 0
            const withoutES = r.EnergyShield || 0
            const withoutArmour = r.Armour || 0
            const ehpDiff = baseVal - withoutEhp
            const impactPct = baseVal > 0 ? (ehpDiff / baseVal) * 100 : 0
            // Only include if EHP actually changes (skip pure DPS gems with 0 EHP impact)
            const hasEhpImpact = Math.abs(ehpDiff) > 1
            ehpLog.push(`  ${job.name} [${job.category}]: EHP=${withoutEhp.toFixed(0)} diff=${ehpDiff.toFixed(0)} (${impactPct.toFixed(1)}%) ${hasEhpImpact ? 'DEF' : 'skip'}`)
            if (hasEhpImpact) {
              accumulated.push({
                id: job.id, category: job.category, name: job.name, detail: job.detail,
                groupLabel: job.groupLabel,
                baselineEhp: baseVal, withoutEhp, baselineDps: baseVal, withoutDps: withoutEhp,
                impactPct, impactAbs: ehpDiff,
                lifeDiff: baselineLife - withoutLife, esDiff: baselineES - withoutES, armourDiff: baselineArmour - withoutArmour,
              })
            }
          }
          const final = [...accumulated].sort((a, b) => b.impactPct - a.impactPct)
          setEhpFactors(final)
          ehpCacheRef.current[ck] = final
          setEhpAnalyzing(false)
          setEhpProgress({ pct: 100, label: 'Done' })
          ehpLog.push(`\nDone (parallel). ${jobs.length} jobs, ${accumulated.length} factors.`)
          ;(window as any).__ehpSensitivityLog = ehpLog.join('\n')
          return
        }
      } catch { /* fall through */ }
    }

    // Fallback: chunked serial
    const CHUNK = 5
    for (let cs = 0; cs < jobs.length; cs += CHUNK) {
      if (stale()) { setEhpAnalyzing(false); return }
      const chunk = jobs.slice(cs, cs + CHUNK)
      setEhpProgress({ pct: Math.min((cs / jobs.length) * 100, 99), label: `${chunk[0].name}...` })

      try {
        const res = batchFn
          ? await batchFn(chunk.map(j => j.params)) as { ok: boolean; results?: any[] }
          : null

        const results = res?.results || []
        for (let i = 0; i < chunk.length; i++) {
          const job = chunk[i]
          const r = results[i]
          if (!r?.ok) continue

          const withoutEhp = r.TotalEHP || 0
          const withoutLife = r.Life || 0
          const withoutES = r.EnergyShield || 0
          const withoutArmour = r.Armour || 0
          const withoutEvade = r.MeleeEvadeChance || 0

          const ehpDiff = baseVal - withoutEhp
          const lifeDiff = baselineLife - withoutLife
          const esDiff = baselineES - withoutES
          const armourDiff = baselineArmour - withoutArmour

          const impactPct = baseVal > 0 ? (ehpDiff / baseVal) * 100 : 0

          const hasEhpImpact = Math.abs(ehpDiff) > 1
          ehpLog.push(`  ${job.name} [${job.category}]: EHP=${withoutEhp.toFixed(0)} diff=${ehpDiff.toFixed(0)} (${impactPct.toFixed(1)}%) ${hasEhpImpact ? 'DEF' : 'skip'}`)

          if (hasEhpImpact) {
            const f = {
              id: job.id, category: job.category, name: job.name, detail: job.detail,
              groupLabel: job.groupLabel,
              baselineEhp: baseVal, withoutEhp,
              baselineDps: baseVal, withoutDps: withoutEhp,
              impactPct, impactAbs: ehpDiff,
              lifeDiff, esDiff, armourDiff,
            }
            accumulated.push(f)
            setEhpFactors([...accumulated].sort((a, b) => b.impactPct - a.impactPct))
          }
        }
      } catch { /* skip */ }
    }

    ehpLog.push(`\nDone. ${jobs.length} jobs, ${accumulated.length} defensive factors found.`)
    ;(window as any).__ehpSensitivityLog = ehpLog.join('\n')

    const final = [...accumulated].sort((a, b) => b.impactPct - a.impactPct)
    setEhpFactors(final)
    ehpCacheRef.current[ck] = final
    setEhpAnalyzing(false)
    setEhpProgress({ pct: 100, label: 'Done' })
  }

  return (
    <div className="min-h-screen bg-poe-dark flex flex-col">
      {/* Titlebar */}
      <header className="flex items-center justify-between px-5 py-3
                          border-b border-poe-border/50 bg-poe-panel/80 backdrop-blur"
              style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <PoeIcon />
          <span className="text-poe-gold font-bold tracking-wide">PoB Analysis</span>
          <span className="text-poe-muted/50 text-xs">Path of Building Build Analyzer</span>
        </div>
        <div className="flex gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => setShowDebug(v => !v)}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              showDebug
                ? 'border-poe-gold/50 text-poe-gold bg-poe-gold/10'
                : 'border-poe-border/40 text-poe-muted hover:text-poe-gold hover:border-poe-gold/30'
            }`}
            title="Toggle debug panel"
          >
            DEBUG
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-poe-muted hover:text-poe-gold transition-colors p-1.5 rounded
                       hover:bg-poe-border/30"
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-5 space-y-5 overflow-auto">
        {/* Build input always visible */}
        <BuildInput
          onAnalyze={handleAnalyze}
          loading={state === 'loading' || state === 'analyzing'}
          error={state === 'error' ? error : undefined}
        />

        {/* All results keyed to force remount on new build */}
        {build && (<div key={buildKey} className="space-y-5">
        {/* Section switcher */}
        {(
          <div className="flex gap-1 bg-poe-panel border border-poe-border rounded-lg p-1 w-fit">
            {([
              { key: 'offense' as Section, label: 'Offense', icon: '\u2694' },
              { key: 'defense' as Section, label: 'Defense', icon: '\u26E8' },
              { key: 'guide' as Section, label: 'Guide', icon: '\uD83D\uDCD6' },
            ]).map(s => (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  section === s.key
                    ? 'bg-poe-gold/20 text-poe-gold border border-poe-gold/30'
                    : 'text-poe-muted/60 hover:text-poe-gold border border-transparent'
                }`}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Recalculate banner when config changed */}
        {configDirty && (
          <div className="flex items-center gap-3 bg-poe-gold/10 border border-poe-gold/30 rounded-lg px-4 py-3">
            <span className="text-poe-gold text-sm">Config changed — recalculate to update DPS & EHP analysis</span>
            <button onClick={handleRecalcAll} disabled={state === 'analyzing' || ehpAnalyzing}
              className="ml-auto px-4 py-1.5 rounded bg-poe-gold/20 border border-poe-gold/40 text-poe-gold text-sm font-medium hover:bg-poe-gold/30 transition-colors disabled:opacity-40">
              {state === 'analyzing' || ehpAnalyzing ? 'Analyzing...' : 'Recalculate All'}
            </button>
          </div>
        )}

        {/* OFFENSE SECTION */}
        {section === 'offense' && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
            <div className="space-y-5">
              <DpsOverview
                build={build}
                sensitivityRunning={state === 'analyzing'}
                onSpecChange={() => handleConfigChange()}
                onSkillSetChange={() => handleConfigChange()}
                onItemSetChange={() => handleConfigChange()}
              />
              <GemLinks skillSets={build.skills?.skillSets} mainSkillName={build.stats.SkillName} />
            </div>
            <div className="space-y-3">
              <div className="flex gap-1 bg-poe-panel border border-poe-border rounded-lg p-1">
                {([
                  { key: 'factors' as OffenseTab, label: 'DPS' },
                  { key: 'gear' as OffenseTab, label: 'Gear' },
                  { key: 'breakdown' as OffenseTab, label: 'Breakdown' },
                  { key: 'synergies' as OffenseTab, label: 'Synergies' },
                ]).map(tab => (
                  <button key={tab.key} onClick={() => setOffenseTab(tab.key)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                      offenseTab === tab.key
                        ? 'bg-poe-gold/20 text-poe-gold border border-poe-gold/30'
                        : 'text-poe-muted/60 hover:text-poe-gold border border-transparent'
                    }`}>{tab.label}</button>
                ))}
              </div>
              {offenseTab === 'factors' && (
                <FactorList
                  factors={factors}
                  baselineDps={build.stats.CombinedDPS || build.stats.FullDPS || build.stats.TotalDPS || 0}
                  progress={state === 'analyzing' ? progress : undefined}
                  onRecalculate={handleRecalculate}
                  analyzing={state === 'analyzing'}
                />
              )}
              {offenseTab === 'gear' && (
                <GearDisplay slots={(build.items?.slots || []) as any} factors={factors} mode="full" />
              )}
              {offenseTab === 'breakdown' && breakdownData && <DamageBreakdown data={breakdownData} />}
              {offenseTab === 'synergies' && synergyData && <SynergyDetector data={synergyData} />}
            </div>
          </div>
        )}

        {/* DEFENSE SECTION */}
        {section === 'defense' && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
            <div className="space-y-5">
              <DefenseOverview
                build={build}
                dangerData={dangerData}
                sensitivityRunning={ehpAnalyzing}
                onSpecChange={() => handleConfigChange()}
                onSkillSetChange={() => handleConfigChange()}
                onItemSetChange={() => handleConfigChange()}
              />
            </div>
            <div className="space-y-3">
              <div className="flex gap-1 bg-poe-panel border border-poe-border rounded-lg p-1">
                {([
                  { key: 'ehp' as DefenseTab, label: 'EHP Contributions' },
                  { key: 'dangers' as DefenseTab, label: 'Dangers' },
                  { key: 'def-breakdown' as DefenseTab, label: 'Breakdown' },
                ]).map(tab => (
                  <button key={tab.key} onClick={() => setDefenseTab(tab.key)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                      defenseTab === tab.key
                        ? 'bg-blue-400/20 text-blue-400 border border-blue-400/30'
                        : 'text-poe-muted/60 hover:text-blue-400 border border-transparent'
                    }`}>{tab.label}</button>
                ))}
              </div>
              {defenseTab === 'ehp' && (
                <EhpFactorList
                  factors={ehpFactors}
                  baselineEhp={(dangerData as any)?.ehp?.total || build.stats.Life || 0}
                  progress={ehpAnalyzing ? ehpProgress : undefined}
                  onRecalculate={() => runEhpAnalysis()}
                  analyzing={ehpAnalyzing}
                />
              )}
              {defenseTab === 'dangers' && dangerData && <DangerAnalysis data={dangerData} />}
              {defenseTab === 'def-breakdown' && <DefenseBreakdown breakdownData={breakdownData} dangerData={dangerData} />}
            </div>
          </div>
        )}

        {/* GUIDE SECTION */}
        {section === 'guide' && (
          <BuildGuide build={build} synergyData={synergyData} breakdownData={breakdownData} />
        )}
        </div>)}
      </main>

      {showDebug && (
        <DebugPanel
          data={debugData}
          onClose={() => setShowDebug(false)}
        />
      )}
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

function DebugPanel({ data, onClose }: { data: unknown; onClose: () => void }) {
  const [tab, setTab] = useState<'json' | 'xml' | 'log' | 'ehplog' | 'main'>('json')
  const [mainLog, setMainLog] = useState('')
  const raw = data as Record<string, unknown> | null
  const xmlText = raw?.decodedXml as string | undefined
  const jsonWithoutXml = raw ? (() => { const { decodedXml: _, ...rest } = raw; return rest })() : null
  const sensLog = (window as unknown as Record<string, string>).__sensitivityLog || 'No sensitivity log yet.'
  const ehpLog = (window as unknown as Record<string, string>).__ehpSensitivityLog || 'No EHP log yet. Click EHP tab → Analyze.'
  // Fetch main process log when tab is selected
  if (tab === 'main' && !mainLog) {
    (window as any).api?.pob?.getMainProcessLog?.().then((log: string) => setMainLog(log || 'No log available'))
  }
  const text = tab === 'xml'
    ? (xmlText || 'No XML decoded yet.')
    : tab === 'log'
    ? sensLog
    : tab === 'ehplog'
    ? ehpLog
    : tab === 'main'
    ? mainLog || 'Loading main process log...'
    : (jsonWithoutXml ? JSON.stringify(jsonWithoutXml, null, 2) : 'No data yet — paste a PoB code and click Analyze.')
  const copy = () => navigator.clipboard.writeText(text)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-poe-panel border border-poe-border rounded-lg shadow-2xl w-[90vw] h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-poe-border">
          <div className="flex items-center gap-3">
            <span className="text-poe-gold font-bold text-sm tracking-wide">Debug</span>
            <div className="flex gap-1">
              {(['json', 'xml', 'log', 'ehplog', 'main'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${
                    tab === t
                      ? 'bg-poe-gold/20 text-poe-gold border border-poe-gold/40'
                      : 'text-poe-muted hover:text-poe-gold border border-transparent'
                  }`}
                >
                  {t === 'json' ? 'Lua Response' : t === 'xml' ? 'Decoded XML' : t === 'log' ? 'DPS Log' : t === 'ehplog' ? 'EHP Log' : 'Main Process'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {tab === 'main' && (
              <button
                onClick={() => { setMainLog(''); (window as any).api?.pob?.getMainProcessLog?.().then((log: string) => setMainLog(log || 'No log')) }}
                className="text-xs px-3 py-1 rounded border border-poe-border/50 text-poe-muted hover:text-poe-gold hover:border-poe-gold/40 transition-colors"
              >Refresh</button>
            )}
            <button
              onClick={copy}
              className="text-xs px-3 py-1 rounded border border-poe-border/50 text-poe-muted hover:text-poe-gold hover:border-poe-gold/40 transition-colors"
            >
              Copy
            </button>
            <button
              onClick={onClose}
              className="text-xs px-3 py-1 rounded border border-poe-border/50 text-poe-muted hover:text-poe-gold hover:border-poe-gold/40 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        <pre className="flex-1 overflow-auto p-4 text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
          {text}
        </pre>
      </div>
    </div>
  )
}

function PoeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-poe-gold">
      <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" fill="currentColor" opacity="0.3"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
