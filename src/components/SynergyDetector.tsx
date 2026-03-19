import { useMemo, useState, useEffect, useCallback } from 'react'
import { detectSynergies } from '../lib/synergies'
import { quantifySynergies } from '../lib/synergyQuantifier'
import type { DetectedSynergy, SynergyData } from '../lib/synergies'

interface Props {
  data: Record<string, unknown>
  baselineDps?: number
  baselineEhp?: number
}

const CAT_COLORS: Record<string, string> = {
  offensive: '#E55', defensive: '#5C9AE8', conversion: '#E8D23A', utility: '#6B8',
}
const CAT_ICONS: Record<string, string> = {
  offensive: '\u2694', defensive: '\u26E8', conversion: '\u21C4', utility: '\u2699',
}
const SEV_COLORS: Record<string, string> = {
  critical: '#E55', notable: '#E89B3A', info: '#888',
}

function fmtDps(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toFixed(0)
}

export function SynergyDetector({ data, baselineDps, baselineEhp }: Props) {
  const rawSynergies = useMemo(() => {
    try {
      return detectSynergies(data as any) as DetectedSynergy[]
    } catch { return [] }
  }, [data])

  const [synergies, setSynergies] = useState<DetectedSynergy[]>(rawSynergies)
  const [quantifying, setQuantifying] = useState(false)
  const [quantified, setQuantified] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  // Reset when raw synergies change
  useEffect(() => {
    setSynergies(rawSynergies)
    setQuantified(false)
  }, [rawSynergies])

  const handleQuantify = useCallback(async () => {
    if (!baselineDps || quantifying) return
    setQuantifying(true)
    setProgress({ done: 0, total: 0 })
    try {
      const result = await quantifySynergies(
        rawSynergies,
        data as SynergyData,
        baselineDps,
        baselineEhp ?? 0,
        (done, total) => setProgress({ done, total })
      )
      // Sort: quantified with high impact first, then by severity
      result.sort((a, b) => {
        const aImpact = Math.abs(a.dpsImpact ?? 0)
        const bImpact = Math.abs(b.dpsImpact ?? 0)
        if (aImpact !== bImpact) return bImpact - aImpact
        const sevW: Record<string, number> = { critical: 0, notable: 1, info: 2 }
        return (sevW[a.rule.severity] ?? 9) - (sevW[b.rule.severity] ?? 9)
      })
      setSynergies(result)
      setQuantified(true)
    } catch {
      // Keep unquantified
    } finally {
      setQuantifying(false)
    }
  }, [rawSynergies, data, baselineDps, baselineEhp, quantifying])

  const byCategory = useMemo(() => {
    const groups: Record<string, DetectedSynergy[]> = {}
    for (const s of synergies) {
      const cat = s.rule.category
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(s)
    }
    return Object.entries(groups).sort(([a], [b]) => {
      const order: Record<string, number> = { offensive: 0, conversion: 1, defensive: 2, utility: 3 }
      return (order[a] ?? 9) - (order[b] ?? 9)
    })
  }, [synergies])

  return (
    <div className="panel p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-poe-gold font-semibold text-lg">Build Synergies</h2>
        <div className="flex items-center gap-3">
          {baselineDps != null && baselineDps > 0 && !quantified && (
            <button
              onClick={handleQuantify}
              disabled={quantifying}
              className="text-xs px-3 py-1 rounded bg-poe-gold/10 text-poe-gold border border-poe-gold/30 hover:bg-poe-gold/20 transition-colors disabled:opacity-50"
            >
              {quantifying
                ? `Quantifying... ${progress.done}/${progress.total}`
                : 'Quantify Impact'}
            </button>
          )}
          {quantified && (
            <span className="text-xs text-green-400">{'\u2713'} Quantified</span>
          )}
          <span className="text-xs text-poe-muted/60">{synergies.length} detected</span>
        </div>
      </div>

      {synergies.length === 0 && (
        <div className="text-poe-muted text-sm text-center py-8">
          No notable synergies detected. This may update after switching specs/gear.
        </div>
      )}

      <div className="space-y-4">
        {byCategory.map(([category, items]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-xs" style={{ color: CAT_COLORS[category] }}>
                {CAT_ICONS[category] || ''} {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
              <div className="flex-1 border-b border-poe-border/20" />
            </div>
            <div className="space-y-1.5">
              {items.map(s => (
                <SynergyCard key={s.rule.id} synergy={s} baselineDps={baselineDps} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SynergyCard({ synergy, baselineDps }: { synergy: DetectedSynergy; baselineDps?: number }) {
  const { rule, dpsImpact, dpsImpactPct } = synergy
  const hasImpact = dpsImpact != null && dpsImpact !== 0
  const maxBarWidth = baselineDps ? Math.min(Math.abs(dpsImpactPct ?? 0) / 30 * 100, 100) : 0

  return (
    <div className="px-3 py-2.5 rounded bg-black/20 border border-poe-border/20 hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: SEV_COLORS[rule.severity] + '20', color: SEV_COLORS[rule.severity] }}>
          {rule.severity.toUpperCase()}
        </span>
        <span className="text-sm font-medium text-poe-text">{rule.name}</span>
        {hasImpact && (
          <span className="ml-auto text-xs font-mono font-bold" style={{
            color: (dpsImpact ?? 0) > 0 ? '#4ADE80' : '#F87171'
          }}>
            {(dpsImpact ?? 0) > 0 ? '+' : ''}{fmtDps(dpsImpact!)} DPS
            <span className="text-poe-muted/50 ml-1">
              ({(dpsImpactPct ?? 0) > 0 ? '+' : ''}{(dpsImpactPct ?? 0).toFixed(1)}%)
            </span>
          </span>
        )}
      </div>

      {hasImpact && (
        <div className="h-1 rounded-full bg-poe-border/10 mb-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${maxBarWidth}%`,
              backgroundColor: (dpsImpact ?? 0) > 0 ? '#4ADE80' : '#F87171',
            }}
          />
        </div>
      )}

      <div className="text-xs text-poe-muted/70 mb-1">{rule.description}</div>
      <div className="text-xs text-poe-gold/50 leading-relaxed">{rule.explanation}</div>
    </div>
  )
}
