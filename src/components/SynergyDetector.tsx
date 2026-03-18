import { useMemo } from 'react'
import { detectSynergies } from '../lib/synergies'
import type { DetectedSynergy } from '../lib/synergies'

interface Props {
  data: Record<string, unknown>
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

export function SynergyDetector({ data }: Props) {
  const synergies = useMemo(() => {
    try {
      return detectSynergies(data as any) as DetectedSynergy[]
    } catch { return [] }
  }, [data])

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
        <span className="text-xs text-poe-muted/60">{synergies.length} detected</span>
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
                <SynergyCard key={s.rule.id} synergy={s} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SynergyCard({ synergy }: { synergy: DetectedSynergy }) {
  const { rule } = synergy
  return (
    <div className="px-3 py-2.5 rounded bg-black/20 border border-poe-border/20 hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: SEV_COLORS[rule.severity] + '20', color: SEV_COLORS[rule.severity] }}>
          {rule.severity.toUpperCase()}
        </span>
        <span className="text-sm font-medium text-poe-text">{rule.name}</span>
      </div>
      <div className="text-xs text-poe-muted/70 mb-1">{rule.description}</div>
      <div className="text-xs text-poe-gold/50 leading-relaxed">{rule.explanation}</div>
    </div>
  )
}
