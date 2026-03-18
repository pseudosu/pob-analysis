import { useState, useMemo } from 'react'
import type { Factor } from '../types/pob'
import { getImpactTier, TIER_COLORS } from '../lib/sensitivity'
import { PoeTooltip } from './PoeTooltip'

interface Props {
  factors: Factor[]
  baselineDps: number
  progress?: { pct: number; label: string }
  onRecalculate?: () => void
  analyzing?: boolean
}

type FilterCategory = 'all' | 'gem' | 'notable' | 'item'

const CATEGORY_ICONS: Record<string, string> = {
  gem: '\u25C6',
  notable: '\u2726',
  item: '\u25A0',
}

const CATEGORY_COLORS: Record<string, string> = {
  gem: '#5C9AE8',
  notable: '#C7A44B',
  item: '#6FB870',
}

type GroupedFactors = { label: string; category: string; factors: Factor[]; totalContrib: number }[]

function groupFactors(factors: Factor[]): GroupedFactors {
  const groups: Record<string, { label: string; category: string; factors: Factor[]; totalContrib: number }> = {}

  for (const f of factors) {
    // Group gems by their skill group, items + notables each get their own group
    const key = f.category === 'gem' ? (f.groupLabel || 'Gems') : f.category === 'item' ? 'Equipment' : 'Passive Tree'
    if (!groups[key]) {
      groups[key] = { label: key, category: f.category, factors: [], totalContrib: 0 }
    }
    groups[key].factors.push(f)
    groups[key].totalContrib += f.impactAbs
  }

  // Sort groups by total contribution, then sort factors within each group
  const sorted = Object.values(groups).sort((a, b) => b.totalContrib - a.totalContrib)
  for (const g of sorted) {
    g.factors.sort((a, b) => b.impactAbs - a.impactAbs)
  }
  return sorted
}

export function FactorList({ factors, baselineDps, progress, onRecalculate, analyzing }: Props) {
  const [filter, setFilter] = useState<FilterCategory>('all')

  const visible = filter === 'all' ? factors : factors.filter(f => f.category === filter)
  const maxContrib = factors[0]?.impactAbs || 1
  const grouped = useMemo(() => groupFactors(visible), [visible])

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
          DPS Contributions
        </h2>
        <div className="flex gap-1.5">
          {(['all', 'gem', 'notable', 'item'] as FilterCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                filter === cat
                  ? 'bg-poe-gold text-poe-dark'
                  : 'border border-poe-border text-poe-muted hover:border-poe-gold hover:text-poe-gold'
              }`}
            >
              {cat === 'all' ? `All (${counts.all})` : `${cap(cat)}s (${counts[cat]})`}
            </button>
          ))}
        </div>
      </div>

      {/* Recalculate button when factors are empty or stale */}
      {onRecalculate && factors.length === 0 && !analyzing && (
        <button
          onClick={onRecalculate}
          className="w-full py-3 rounded border border-poe-gold/40 text-poe-gold hover:bg-poe-gold/10 transition-colors text-sm font-medium"
        >
          Analyze DPS Contributions
        </button>
      )}

      {progress && progress.pct < 100 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-poe-muted">
            <span>{progress.label}</span>
            <span>{progress.pct.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-poe-border/30 rounded-full h-1.5">
            <div
              className="bg-poe-gold rounded-full h-1.5 transition-all duration-300"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
        </div>
      )}

      {visible.length === 0 && (!progress || progress.pct >= 100) && (
        <div className="text-poe-muted text-sm text-center py-8">
          No factors found in this category.
        </div>
      )}

      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.label}>
            {/* Group header */}
            <div className="flex items-center gap-2 mb-1.5 px-3">
              <span className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: CATEGORY_COLORS[group.category] || '#888' }}>
                {CATEGORY_ICONS[group.category] || ''} {group.label}
              </span>
              <span className="text-[10px] text-poe-muted/60">
                +{fmtDps(group.totalContrib)} total
              </span>
              <div className="flex-1 border-b border-poe-border/20" />
            </div>
            {/* Factors in group */}
            <div className="space-y-0.5">
              {group.factors.map((factor) => (
                <PoeTooltip
                  key={factor.id}
                  factorId={factor.id}
                  category={factor.category}
                  tooltipParams={getTooltipParams(factor)}
                >
                  <FactorRow
                    factor={factor}
                    rank={factors.indexOf(factor) + 1}
                    maxContrib={maxContrib}
                  />
                </PoeTooltip>
              ))}
            </div>
          </div>
        ))}
      </div>

      {factors.length > 0 && (
        <div className="text-xs text-poe-muted/60 text-center pt-2 border-t border-poe-border/30">
          Shows estimated DPS each factor contributes to the build.
        </div>
      )}
    </div>
  )
}

const GEM_COLORS: Record<number, string> = { 1: '#E55', 2: '#6B8', 3: '#5C9AE8', 0: '#AAA' }

function FactorRow({ factor, rank, maxContrib }: {
  factor: Factor
  rank: number
  maxContrib: number
}) {
  const tier = getImpactTier(factor.impactPct)
  const tierColor = TIER_COLORS[tier]
  const barWidth = maxContrib > 0 ? (factor.impactAbs / maxContrib) * 100 : 0

  return (
    <div className="group flex items-center gap-2.5 py-1.5 px-3 rounded
                    hover:bg-white/[0.04] transition-colors">
      <span className="w-5 text-right text-poe-muted/60 text-xs tabular-nums shrink-0 font-mono">
        {rank}
      </span>

      {/* Icon */}
      <div className="w-6 h-6 shrink-0 flex items-center justify-center">
        {factor.sprite ? (
          <div className="w-6 h-6 rounded-full overflow-hidden bg-black/40"
            style={{
              backgroundImage: `url("${toFileUrl((window as any).__pobTreeBase || '')}/skills-3.jpg")`,
              backgroundPosition: `-${factor.sprite.x}px -${factor.sprite.y}px`,
            }} />
        ) : factor.slotIcon ? (
          <img src={`${toFileUrl((window as any).__pobAssetsBase || '')}/${factor.slotIcon}`} alt="" className="w-5 h-5 opacity-80" loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : factor.gemColor != null ? (
          <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: GEM_COLORS[factor.gemColor] || '#AAA', backgroundColor: (GEM_COLORS[factor.gemColor] || '#AAA') + '30' }} />
        ) : (
          <span className="text-xs" style={{ color: CATEGORY_COLORS[factor.category] }}>
            {CATEGORY_ICONS[factor.category]}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-poe-text text-sm font-medium truncate">{factor.name}</div>
        {factor.detail && (
          <div className="text-poe-muted/70 text-[11px] truncate">{factor.detail}</div>
        )}
      </div>

      <div className="flex items-center gap-2 w-56 shrink-0">
        <div className="flex-1 bg-poe-border/20 rounded h-2.5 overflow-hidden">
          <div
            className="h-full rounded transition-all duration-500"
            style={{ width: `${barWidth}%`, backgroundColor: tierColor }}
          />
        </div>
        <div className="text-sm font-bold tabular-nums w-20 text-right"
             style={{ color: tierColor }}>
          +{fmtDps(factor.impactAbs)}
        </div>
      </div>

      <div className="text-xs tabular-nums w-12 text-right shrink-0 text-poe-muted/60">
        {factor.impactPct.toFixed(1)}%
      </div>
    </div>
  )
}

function getTooltipParams(factor: Factor): object {
  if (factor.category === 'gem') {
    // Parse groupIdx from id like "gem-0-2"
    const parts = factor.id.split('-')
    return { type: 'gem', groupIdx: parseInt(parts[1] || '0'), gemName: factor.name, skillId: (factor as any).skillId }
  }
  if (factor.category === 'item') {
    return { type: 'item', slot: factor.slot || factor.id.replace('item-', '') }
  }
  if (factor.category === 'notable') {
    return { type: 'notable', nodeId: parseInt(factor.id.replace('node-', '')) }
  }
  return {}
}

function fmtDps(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Convert a local filesystem path to a file:// URL (handles Windows backslashes + spaces)
function toFileUrl(path: string): string {
  if (!path) return ''
  // Normalize backslashes to forward slashes
  let p = path.replace(/\\/g, '/')
  // Ensure file:/// prefix (Windows paths need 3 slashes: file:///C:/...)
  if (p.startsWith('/')) return 'file://' + encodeURI(p)
  return 'file:///' + encodeURI(p)
}
