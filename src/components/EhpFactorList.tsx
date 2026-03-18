import { useState, useMemo } from 'react'
import type { Factor } from '../types/pob'
import { getImpactTier, TIER_COLORS } from '../lib/sensitivity'
import { PoeTooltip } from './PoeTooltip'

interface EhpFactor extends Omit<Factor, 'baselineDps' | 'withoutDps'> {
  baselineEhp: number
  withoutEhp: number
  lifeDiff: number
  esDiff: number
  armourDiff: number
}

interface Props {
  factors: EhpFactor[]
  baselineEhp: number
  progress?: { pct: number; label: string }
  onRecalculate?: () => void
  analyzing?: boolean
}

type FilterCategory = 'all' | 'gem' | 'notable' | 'item'

const CATEGORY_ICONS: Record<string, string> = {
  gem: '\u25C6', notable: '\u2726', item: '\u25A0',
}
const CATEGORY_COLORS: Record<string, string> = {
  gem: '#5C9AE8', notable: '#C7A44B', item: '#6FB870',
}

export function EhpFactorList({ factors, baselineEhp, progress, onRecalculate, analyzing }: Props) {
  const [filter, setFilter] = useState<FilterCategory>('all')
  const visible = filter === 'all' ? factors : factors.filter(f => f.category === filter)
  const maxContrib = factors[0]?.impactAbs || 1

  const counts = {
    all: factors.length,
    gem: factors.filter(f => f.category === 'gem').length,
    notable: factors.filter(f => f.category === 'notable').length,
    item: factors.filter(f => f.category === 'item').length,
  }

  return (
    <div className="panel p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-poe-gold font-semibold text-lg">
          EHP Contributions
          <span className="text-poe-muted text-xs font-normal ml-2">Baseline: {fmtEhp(baselineEhp)}</span>
        </h2>
        <div className="flex gap-1.5">
          {(['all', 'gem', 'notable', 'item'] as FilterCategory[]).map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                filter === cat ? 'bg-poe-gold text-poe-dark' : 'border border-poe-border text-poe-muted hover:border-poe-gold hover:text-poe-gold'
              }`}>
              {cat === 'all' ? `All (${counts.all})` : `${cat.charAt(0).toUpperCase() + cat.slice(1)}s (${counts[cat]})`}
            </button>
          ))}
        </div>
      </div>

      {onRecalculate && factors.length === 0 && !analyzing && (
        <button onClick={onRecalculate}
          className="w-full py-3 rounded border border-poe-gold/40 text-poe-gold hover:bg-poe-gold/10 transition-colors text-sm font-medium">
          Analyze EHP Contributions
        </button>
      )}

      {progress && progress.pct < 100 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-poe-muted">
            <span>{progress.label}</span>
            <span>{progress.pct.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-poe-border/30 rounded-full h-1.5">
            <div className="bg-blue-400 rounded-full h-1.5 transition-all duration-300" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
      )}

      {visible.length === 0 && (!progress || progress.pct >= 100) && factors.length > 0 && (
        <div className="text-poe-muted text-sm text-center py-8">No factors in this category.</div>
      )}

      <div className="space-y-1">
        {visible.map((factor, idx) => {
          const tier = getImpactTier(factor.impactPct)
          const tierColor = TIER_COLORS[tier]
          const catColor = CATEGORY_COLORS[factor.category] || '#888'
          const catIcon = CATEGORY_ICONS[factor.category] || ''
          const barWidth = maxContrib > 0 ? (factor.impactAbs / maxContrib) * 100 : 0

          return (
            <PoeTooltip key={factor.id} factorId={`ehp-${factor.id}`} category={factor.category as any}
              tooltipParams={factor.category === 'gem' ? { type: 'gem', groupIdx: parseInt(factor.id.split('-')[1] || '0'), gemName: factor.name }
                : factor.category === 'item' ? { type: 'item', slot: factor.slot || factor.id.replace('item-', '') }
                : { type: 'notable', nodeId: parseInt(factor.id.replace('node-', '')) }}>
            <div className="group flex items-center gap-3 py-1.5 px-3 rounded hover:bg-white/[0.04] transition-colors">
              <span className="w-5 text-right text-poe-muted/60 text-xs tabular-nums shrink-0 font-mono">{idx + 1}</span>
              <span className="w-4 text-center shrink-0 text-xs" style={{ color: catColor }}>{catIcon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-poe-text text-sm font-medium truncate">{factor.name}</div>
                {factor.detail && <div className="text-poe-muted/70 text-[11px] truncate">{factor.detail}</div>}
              </div>
              <div className="flex items-center gap-2 w-48 shrink-0">
                <div className="flex-1 bg-poe-border/20 rounded h-2.5 overflow-hidden">
                  <div className="h-full rounded transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: '#5C9AE8' }} />
                </div>
                <div className="text-sm font-bold tabular-nums w-16 text-right" style={{ color: tierColor }}>
                  +{fmtEhp(factor.impactAbs)}
                </div>
              </div>
              <div className="text-xs tabular-nums w-12 text-right shrink-0 text-poe-muted/60">
                {factor.impactPct.toFixed(1)}%
              </div>
              {/* Mini breakdown */}
              <div className="text-[10px] text-poe-muted/60 w-24 text-right shrink-0">
                {factor.lifeDiff > 0 && <span className="text-red-400/60">+{factor.lifeDiff.toFixed(0)} life </span>}
                {factor.esDiff > 0 && <span className="text-blue-300/60">+{factor.esDiff.toFixed(0)} ES </span>}
                {factor.armourDiff > 0 && <span className="text-poe-muted/60">+{factor.armourDiff.toFixed(0)} arm</span>}
              </div>
            </div>
            </PoeTooltip>
          )
        })}
      </div>

      {factors.length > 0 && (
        <div className="text-xs text-poe-muted/60 text-center pt-2 border-t border-poe-border/30">
          Shows estimated EHP each factor contributes to survivability.
        </div>
      )}
    </div>
  )
}

function fmtEhp(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}
