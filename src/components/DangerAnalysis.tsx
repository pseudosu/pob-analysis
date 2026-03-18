import { useMemo } from 'react'
import { analyzeDangers } from '../lib/dangers'
import type { Danger } from '../lib/dangers'

interface Props {
  data: Record<string, unknown>
}

const SEV_COLORS = { critical: '#E55', warning: '#E89B3A', info: '#6B8' }
const SEV_LABELS = { critical: 'CRIT', warning: 'WARN', info: 'OK' }

const ELEM_COLORS: Record<string, string> = {
  Fire: '#E8623A', Cold: '#5C9AE8', Lightning: '#E8D23A', Chaos: '#9B59B6', Physical: '#AAA',
}

export function DangerAnalysis({ data }: Props) {
  const dangers = useMemo(() => {
    try {
      return analyzeDangers(data as any) as Danger[]
    } catch { return [] }
  }, [data])

  const d = data as Record<string, any>
  const resists = d.resists || {}
  const maxHit = d.maxHitTaken || {}
  const ailments = d.ailments || {}
  const pools = d.pools || {}
  const avoidance = d.avoidance || {}

  const critCount = dangers.filter(d => d.severity === 'critical').length
  const warnCount = dangers.filter(d => d.severity === 'warning').length
  const overallColor = critCount > 0 ? '#E55' : warnCount > 0 ? '#E89B3A' : '#6B8'

  return (
    <div className="panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-poe-gold font-semibold text-lg">Danger Analysis</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: overallColor + '20', color: overallColor, border: `1px solid ${overallColor}40` }}>
          {critCount > 0 ? `${critCount} Critical` : warnCount > 0 ? `${warnCount} Warnings` : 'Looking Good'}
        </div>
      </div>

      {/* Resistance Bars */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Resistances</div>
        <div className="grid grid-cols-2 gap-2">
          {['Fire', 'Cold', 'Lightning', 'Chaos'].map(elem => {
            const r = resists[elem] || { current: 0, max: 75, overcap: 0 }
            const pct = Math.max(0, Math.min(100, ((r.current + 30) / (r.max + 30)) * 100))
            const isCapped = r.current >= r.max
            return (
              <div key={elem} className="bg-black/30 rounded p-2 border border-poe-border/30">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: ELEM_COLORS[elem] }}>{elem}</span>
                  <span className={isCapped ? 'text-green-400' : 'text-red-400'}>
                    {r.current}% / {r.max}%
                    {r.overcap > 0 && <span className="text-poe-muted/70"> (+{r.overcap})</span>}
                  </span>
                </div>
                <div className="h-1.5 bg-poe-border/20 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isCapped ? '#6B8' : ELEM_COLORS[elem] }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Max Hit Survivable */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Max Hit Survivable</div>
        <div className="space-y-1.5">
          {['Physical', 'Fire', 'Cold', 'Lightning', 'Chaos'].map(dt => {
            const val = maxHit[dt] || 0
            const maxRef = 50000
            const pct = Math.min(100, (val / maxRef) * 100)
            const color = val < 5000 ? '#E55' : val < 10000 ? '#E89B3A' : '#6B8'
            return (
              <div key={dt} className="flex items-center gap-2">
                <span className="w-16 text-xs text-right" style={{ color: ELEM_COLORS[dt] }}>{dt.slice(0, 4)}</span>
                <div className="flex-1 h-2 bg-poe-border/20 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <span className="w-14 text-xs text-right tabular-nums" style={{ color }}>{fmt(val)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ailment Immunity Grid */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Ailment Protection</div>
        <div className="grid grid-cols-3 gap-1.5">
          {['Freeze', 'Stun', 'Shock', 'Ignite', 'Bleed', 'Poison', 'CorruptingBlood', 'Chill', 'Sap'].map(a => {
            const info = ailments[a] || { avoidChance: 0 }
            const immune = info.avoidChance >= 100
            const partial = info.avoidChance > 0 && info.avoidChance < 100
            return (
              <div key={a} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border ${
                immune ? 'border-green-800/40 bg-green-900/20 text-green-400'
                : partial ? 'border-yellow-800/40 bg-yellow-900/10 text-yellow-400'
                : 'border-red-900/40 bg-red-900/10 text-red-400'
              }`}>
                <span>{immune ? '\u2713' : partial ? '\u25CB' : '\u2717'}</span>
                <span className="truncate">{a === 'CorruptingBlood' ? 'CB' : a}</span>
                {!immune && <span className="ml-auto text-[10px] opacity-60">{info.avoidChance}%</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Danger Alerts */}
      {dangers.length > 0 && (
        <div>
          <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Alerts</div>
          <div className="space-y-1.5">
            {dangers.map(d => (
              <div key={d.id} className="flex items-start gap-2 px-3 py-2 rounded bg-black/20 border border-poe-border/20">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ backgroundColor: SEV_COLORS[d.severity] + '20', color: SEV_COLORS[d.severity] }}>
                  {SEV_LABELS[d.severity]}
                </span>
                <div className="min-w-0">
                  <div className="text-sm text-poe-text font-medium">{d.title}</div>
                  <div className="text-xs text-poe-muted/60">{d.description}</div>
                  {d.suggestion && (
                    <div className="text-xs text-poe-gold/60 mt-0.5">{d.suggestion}</div>
                  )}
                </div>
                {d.value && (
                  <span className="ml-auto text-sm font-bold tabular-nums shrink-0" style={{ color: SEV_COLORS[d.severity] }}>
                    {d.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-poe-border/20">
        <MiniStat label="EHP" value={fmt(d.ehp?.total || 0)} />
        <MiniStat label="Block" value={`${(avoidance.blockChance || 0).toFixed(0)}%`} />
        <MiniStat label="Suppress" value={`${(avoidance.suppressionChance || 0).toFixed(0)}%`} />
        <MiniStat label="Evade" value={`${(avoidance.meleeEvadeChance || 0).toFixed(0)}%`} />
        <MiniStat label="Phys DR" value={`${(d.physicalReduction || 0).toFixed(0)}%`} />
        <MiniStat label="Life Regen" value={fmt(d.recovery?.Life?.regen || 0)} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-semibold text-poe-text tabular-nums">{value}</div>
      <div className="text-[10px] text-poe-muted/70">{label}</div>
    </div>
  )
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}
