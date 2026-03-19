import { useState, useEffect, useMemo, useCallback } from 'react'

const api = (window as any).api

interface GemEntry {
  name: string
  tags?: string[]
  isSupport?: boolean
}

interface SwapStats {
  CombinedDPS?: number
  Life?: number
  EnergyShield?: number
  CritChance?: number
  CritMultiplier?: number
  Speed?: number
  [key: string]: number | undefined
}

interface SwapResult {
  baseline: SwapStats
  hypothetical: SwapStats
}

interface Props {
  skills: any
}

const COMPARE_STATS: Array<{ key: string; label: string; suffix?: string; higherIsBetter: boolean }> = [
  { key: 'CombinedDPS', label: 'Combined DPS', higherIsBetter: true },
  { key: 'Life', label: 'Life', higherIsBetter: true },
  { key: 'EnergyShield', label: 'Energy Shield', higherIsBetter: true },
  { key: 'CritChance', label: 'Crit Chance', suffix: '%', higherIsBetter: true },
  { key: 'CritMultiplier', label: 'Crit Multi', suffix: '%', higherIsBetter: true },
  { key: 'Speed', label: 'Speed', higherIsBetter: true },
]

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function fmtStat(n: number, suffix?: string): string {
  if (suffix === '%') return `${n.toFixed(2)}${suffix}`
  return fmt(n)
}

export function WhatIfSwapper({ skills }: Props) {
  const [allGems, setAllGems] = useState<GemEntry[]>([])
  const [loadingGems, setLoadingGems] = useState(true)

  // Selection state
  const [selectedSource, setSelectedSource] = useState('')   // "groupIdx:gemIdx"
  const [selectedTarget, setSelectedTarget] = useState('')    // gem name
  const [searchFilter, setSearchFilter] = useState('')

  // Comparison state
  const [result, setResult] = useState<SwapResult | null>(null)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch available gems on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingGems(true)
      try {
        const gems = await api.pob.listGems()
        if (!cancelled && Array.isArray(gems)) setAllGems(gems)
      } catch {
        // Ignore — dropdown stays empty
      } finally {
        if (!cancelled) setLoadingGems(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Build current gem list from skills prop
  const currentGems = useMemo(() => {
    const entries: Array<{ groupIdx: number; gemIdx: number; groupLabel: string; gem: any }> = []

    // Handle both array-of-groups and nested skillSets
    const groups: any[] = []
    if (skills?.skillSets && Array.isArray(skills.skillSets)) {
      // Flatten all skill sets
      for (const set of skills.skillSets) {
        if (Array.isArray(set)) groups.push(...set)
      }
    } else if (Array.isArray(skills)) {
      groups.push(...skills)
    }

    groups.forEach((group: any, gi: number) => {
      const label = group.label || group.slot || `Group ${gi + 1}`
      const gemList = group.gems || group.gemList || []
      gemList.forEach((gem: any, gj: number) => {
        if (gem.nameSpec || gem.name) {
          entries.push({ groupIdx: gi, gemIdx: gj, groupLabel: label, gem })
        }
      })
    })

    return entries
  }, [skills])

  // Split available gems into active/support optgroups
  const { activeSkills, supportGems } = useMemo(() => {
    const filter = searchFilter.toLowerCase()
    const filtered = filter
      ? allGems.filter(g => g.name.toLowerCase().includes(filter))
      : allGems

    return {
      activeSkills: filtered.filter(g => !g.isSupport),
      supportGems: filtered.filter(g => g.isSupport),
    }
  }, [allGems, searchFilter])

  const handleCompare = useCallback(async () => {
    if (!selectedSource || !selectedTarget) return

    const [gi, gj] = selectedSource.split(':').map(Number)
    setComparing(true)
    setError(null)
    setResult(null)

    try {
      const res = await api.pob.swapGem({ groupIdx: gi, gemIdx: gj, newGemName: selectedTarget })
      setResult(res)
    } catch (e: any) {
      setError(e?.message || 'Swap comparison failed')
    } finally {
      setComparing(false)
    }
  }, [selectedSource, selectedTarget])

  // Find max absolute DPS delta for bar scaling
  const maxDpsDelta = result
    ? Math.max(1, Math.abs((result.hypothetical.CombinedDPS || 0) - (result.baseline.CombinedDPS || 0)))
    : 1

  return (
    <div className="panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-poe-gold font-semibold text-lg">What-If Gem Swap</h2>
        {loadingGems && <span className="text-xs text-poe-muted/50">Loading gems...</span>}
      </div>

      <div className="text-xs text-poe-muted/70">
        Compare your current gem against an alternative to see how it affects your build.
      </div>

      {/* Selectors */}
      <div className="space-y-3">
        {/* Current Gem */}
        <div>
          <label className="text-[10px] text-poe-muted/70 uppercase tracking-wider block mb-1">
            Current Gem
          </label>
          <select
            value={selectedSource}
            onChange={e => { setSelectedSource(e.target.value); setResult(null) }}
            className="w-full bg-black/30 border border-poe-border/40 rounded px-3 py-2 text-sm text-poe-text focus:border-poe-gold/50 focus:outline-none"
          >
            <option value="" className="bg-[#1A1612]">-- Select a gem --</option>
            {currentGems.map(entry => {
              const gem = entry.gem
              const name = gem.nameSpec || gem.name || 'Unknown'
              const lvl = gem.level || 20
              const qual = gem.quality || 20
              return (
                <option
                  key={`${entry.groupIdx}:${entry.gemIdx}`}
                  value={`${entry.groupIdx}:${entry.gemIdx}`}
                  className="bg-[#1A1612]"
                >
                  {entry.groupLabel}: {name} (L{lvl}/Q{qual})
                </option>
              )
            })}
          </select>
        </div>

        {/* Swap To */}
        <div>
          <label className="text-[10px] text-poe-muted/70 uppercase tracking-wider block mb-1">
            Swap To
          </label>
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Search gems..."
            className="w-full bg-black/30 border border-poe-border/40 rounded px-3 py-1.5 text-xs text-poe-text placeholder-poe-muted/40 focus:border-poe-gold/50 focus:outline-none mb-1.5"
          />
          <select
            value={selectedTarget}
            onChange={e => { setSelectedTarget(e.target.value); setResult(null) }}
            size={8}
            className="w-full bg-black/30 border border-poe-border/40 rounded px-3 py-1 text-sm text-poe-text focus:border-poe-gold/50 focus:outline-none"
          >
            {activeSkills.length > 0 && (
              <optgroup label="Active Skills">
                {activeSkills.map(g => (
                  <option key={`active-${g.name}`} value={g.name} className="bg-[#1A1612] py-0.5">
                    {g.name}
                  </option>
                ))}
              </optgroup>
            )}
            {supportGems.length > 0 && (
              <optgroup label="Support Gems">
                {supportGems.map(g => (
                  <option key={`support-${g.name}`} value={g.name} className="bg-[#1A1612] py-0.5">
                    {g.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Compare Button */}
        <div className="text-center pt-1">
          <button
            onClick={handleCompare}
            disabled={!selectedSource || !selectedTarget || comparing}
            className="px-6 py-2 rounded bg-poe-gold/10 text-poe-gold border border-poe-gold/30 hover:bg-poe-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {comparing ? 'Comparing...' : 'Compare'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm text-center py-3">{error}</div>
      )}

      {/* Results Table */}
      {result && (
        <div>
          <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Comparison Results</div>
          <div className="bg-black/20 rounded border border-poe-border/20 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-poe-border/20 text-[10px] text-poe-muted/50 uppercase tracking-wider">
              <span>Stat</span>
              <span className="text-right">Current</span>
              <span className="text-right">After Swap</span>
              <span className="text-right">Delta</span>
            </div>

            {/* Stat rows */}
            {COMPARE_STATS.map(stat => {
              const current = result.baseline[stat.key] || 0
              const after = result.hypothetical[stat.key] || 0
              const delta = after - current
              const isBetter = stat.higherIsBetter ? delta > 0 : delta < 0
              const isWorse = stat.higherIsBetter ? delta < 0 : delta > 0
              const deltaColor = delta === 0 ? '#9CA3AF' : isBetter ? '#4ADE80' : '#F87171'

              // DPS bar for CombinedDPS row
              const isDpsRow = stat.key === 'CombinedDPS'
              const dpsBarWidth = isDpsRow && delta !== 0
                ? Math.min((Math.abs(delta) / Math.max(current, 1)) * 100, 100)
                : 0

              return (
                <div key={stat.key}>
                  <div className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-poe-border/10 hover:bg-white/[0.02] transition-colors">
                    <span className="text-sm text-poe-muted">{stat.label}</span>
                    <span className="text-sm text-poe-text text-right tabular-nums">
                      {fmtStat(current, stat.suffix)}
                    </span>
                    <span className="text-sm text-poe-text text-right tabular-nums">
                      {fmtStat(after, stat.suffix)}
                    </span>
                    <span className="text-sm text-right tabular-nums font-medium" style={{ color: deltaColor }}>
                      {delta === 0 ? '\u2014' : `${delta > 0 ? '+' : ''}${fmtStat(delta, stat.suffix)}`}
                    </span>
                  </div>
                  {/* DPS delta bar */}
                  {isDpsRow && delta !== 0 && (
                    <div className="px-3 pb-2">
                      <div className="h-1.5 bg-poe-border/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(dpsBarWidth, 2)}%`,
                            backgroundColor: isBetter ? '#4ADE80' : '#F87171',
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-right mt-0.5" style={{ color: deltaColor }}>
                        {delta > 0 ? '+' : ''}{((delta / Math.max(current, 1)) * 100).toFixed(1)}% DPS
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
