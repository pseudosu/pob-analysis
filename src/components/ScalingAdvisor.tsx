import { useState, useCallback } from 'react'
import { runScalingTests } from '../lib/scaling'
import type { ScalingResult } from '../lib/scaling'

interface Props {
  baselineDps: number
  baselineEhp: number
}

function fmtNum(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toFixed(0)
}

export function ScalingAdvisor({ baselineDps, baselineEhp }: Props) {
  const [category, setCategory] = useState<'offensive' | 'defensive'>('offensive')
  const [results, setResults] = useState<ScalingResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRun = useCallback(async () => {
    setLoading(true)
    setResults(null)
    try {
      const r = await runScalingTests(category, baselineDps, baselineEhp)
      setResults(r)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [category, baselineDps, baselineEhp])

  const maxGainPct = results
    ? Math.max(...results.map(r => Math.abs(category === 'offensive' ? r.dpsGainPct : r.ehpGainPct)), 1)
    : 1

  // Derive insight text
  const topResult = results && results.length > 0 ? results[0] : null
  const insight = topResult
    ? category === 'offensive'
      ? `Best scaling: ${topResult.test.name} (+${topResult.dpsGainPct.toFixed(1)}% DPS). ${getOffenseInsight(results!)}`
      : `Best scaling: ${topResult.test.name} (+${topResult.ehpGainPct.toFixed(1)}% EHP). ${getDefenseInsight(results!)}`
    : null

  return (
    <div className="panel p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-poe-gold font-semibold text-lg">Scaling Advisor</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCategory('offensive'); setResults(null) }}
            className={`text-xs px-3 py-1 rounded border transition-colors ${category === 'offensive' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-black/20 border-poe-border/20 text-poe-muted'}`}
          >
            Offensive
          </button>
          <button
            onClick={() => { setCategory('defensive'); setResults(null) }}
            className={`text-xs px-3 py-1 rounded border transition-colors ${category === 'defensive' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-black/20 border-poe-border/20 text-poe-muted'}`}
          >
            Defensive
          </button>
        </div>
      </div>

      <div className="text-xs text-poe-muted/70">
        Tests how much DPS/EHP each stat type would add. Shows the best investments for your build.
      </div>

      {!results && (
        <div className="text-center py-8">
          <button
            onClick={handleRun}
            disabled={loading}
            className="px-6 py-2 rounded bg-poe-gold/10 text-poe-gold border border-poe-gold/30 hover:bg-poe-gold/20 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Analyzing...' : `Analyze ${category === 'offensive' ? 'Offensive' : 'Defensive'} Scaling`}
          </button>
        </div>
      )}

      {results && results.length > 0 && (
        <>
          {insight && (
            <div className="text-xs text-poe-gold/70 bg-poe-gold/5 border border-poe-gold/10 rounded px-3 py-2">
              {insight}
            </div>
          )}

          <div className="space-y-1.5">
            {results.map((r, i) => {
              const gain = category === 'offensive' ? r.dpsGain : r.ehpGain
              const gainPct = category === 'offensive' ? r.dpsGainPct : r.ehpGainPct
              const barWidth = Math.max((Math.abs(gainPct) / maxGainPct) * 100, 2)
              const isPositive = gain >= 0
              const barColor = isPositive
                ? category === 'offensive' ? '#EF4444' : '#3B82F6'
                : '#6B7280'

              return (
                <div key={r.test.id} className="flex items-center gap-3 px-3 py-2 rounded bg-black/20 border border-poe-border/10 hover:bg-white/[0.02]">
                  <span className="text-xs text-poe-muted/50 w-5 text-right font-mono">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm text-poe-text font-medium truncate">{r.test.name}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-poe-border/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <div className="text-[10px] text-poe-muted/40 mt-0.5">{r.test.description}</div>
                  </div>
                  <div className="text-right shrink-0 w-28">
                    <div className="text-sm font-mono font-bold" style={{ color: isPositive ? (category === 'offensive' ? '#F87171' : '#60A5FA') : '#6B7280' }}>
                      {isPositive ? '+' : ''}{fmtNum(gain)} {category === 'offensive' ? 'DPS' : 'EHP'}
                    </div>
                    <div className="text-[10px] text-poe-muted/50 font-mono">
                      {isPositive ? '+' : ''}{gainPct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleRun}
              disabled={loading}
              className="text-xs text-poe-muted/50 hover:text-poe-gold transition-colors"
            >
              {loading ? 'Recalculating...' : 'Re-run Analysis'}
            </button>
          </div>
        </>
      )}

      {results && results.length === 0 && (
        <div className="text-poe-muted text-sm text-center py-8">
          No scaling results. The build may not support the tested mod types.
        </div>
      )}
    </div>
  )
}

function getOffenseInsight(results: ScalingResult[]): string {
  const moreDmg = results.find(r => r.test.id === 'more-damage-10')
  const incDmg = results.find(r => r.test.id === 'inc-damage-10')
  if (moreDmg && incDmg && moreDmg.dpsGainPct > incDmg.dpsGainPct * 1.5) {
    return '"More" multipliers are significantly better than "increased" — prioritize support gems and unique modifiers.'
  }
  const critMulti = results.find(r => r.test.id === 'crit-multi-10')
  const speed = results.find(r => r.test.id === 'attack-speed-10')
  if (critMulti && speed && critMulti.dpsGainPct > speed.dpsGainPct * 1.3) {
    return 'Crit multiplier scales better than speed — invest in crit multi on gear.'
  }
  if (speed && critMulti && speed.dpsGainPct > critMulti.dpsGainPct * 1.3) {
    return 'Speed scaling is strong — look for attack/cast speed on gear and jewels.'
  }
  return 'Consider investing in the top-ranked stat types for the best DPS returns.'
}

function getDefenseInsight(results: ScalingResult[]): string {
  const flatLife = results.find(r => r.test.id === 'flat-life-100')
  const incLife = results.find(r => r.test.id === 'inc-life-10')
  if (flatLife && incLife && flatLife.ehpGainPct > incLife.ehpGainPct) {
    return 'Flat life provides better returns than % life — prioritize flat life on gear.'
  }
  const maxRes = results.find(r => r.test.id === 'max-res-1')
  if (maxRes && maxRes.ehpGainPct > 2) {
    return '+Max resistance provides excellent EHP scaling — consider gear or passives with +max res.'
  }
  return 'Invest in the top-ranked defensive stats for the best survivability gains.'
}
