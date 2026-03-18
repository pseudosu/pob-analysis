interface Props {
  data: Record<string, unknown>
}

const DMG_COLORS: Record<string, string> = {
  Physical: '#AAA', Lightning: '#E8D23A', Cold: '#5C9AE8', Fire: '#E8623A', Chaos: '#9B59B6',
}
const DMG_ORDER = ['Physical', 'Lightning', 'Cold', 'Fire', 'Chaos']

export function DamageBreakdown({ data }: Props) {
  const d = data as Record<string, any>
  const damageTypes = d.damageTypes || {}
  const defences = d.defences || {}
  const skillName = d.skillName || 'Unknown'

  // Find max hit average for bar scaling
  const maxHit = Math.max(1, ...DMG_ORDER.map(dt => damageTypes[dt]?.hitAverage || 0))

  // Total damage composition for pie-like bar
  const totalHit = DMG_ORDER.reduce((sum, dt) => sum + (damageTypes[dt]?.hitAverage || 0), 0)

  return (
    <div className="panel p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-poe-gold font-semibold text-lg">Damage Breakdown</h2>
        <span className="text-xs text-poe-muted/60">{skillName}</span>
      </div>

      {/* Damage Composition Bar */}
      {totalHit > 0 && (
        <div>
          <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-1.5">Damage Composition</div>
          <div className="h-4 rounded-full overflow-hidden flex">
            {DMG_ORDER.map(dt => {
              const avg = damageTypes[dt]?.hitAverage || 0
              if (avg <= 0) return null
              const pct = (avg / totalHit) * 100
              return (
                <div key={dt} className="h-full relative group" style={{ width: `${pct}%`, backgroundColor: DMG_COLORS[dt] }}
                     title={`${dt}: ${fmt(avg)} (${pct.toFixed(1)}%)`} />
              )
            })}
          </div>
          <div className="flex justify-center gap-3 mt-1.5">
            {DMG_ORDER.map(dt => {
              const avg = damageTypes[dt]?.hitAverage || 0
              if (avg <= 0) return null
              return (
                <span key={dt} className="flex items-center gap-1 text-[10px] text-poe-muted/60">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: DMG_COLORS[dt] }} />
                  {dt}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-Type Breakdown */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Per-Type Pipeline</div>
        <div className="space-y-2">
          {DMG_ORDER.map(dt => {
            const info = damageTypes[dt]
            if (!info || (info.hitAverage <= 0 && info.baseMin <= 0)) return null
            return (
              <div key={dt} className="bg-black/20 rounded p-3 border border-poe-border/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: DMG_COLORS[dt] }}>{dt}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: DMG_COLORS[dt] }}>
                    {fmt(info.hitAverage)} avg
                  </span>
                </div>
                {/* Pipeline: Base → INC → MORE → Final */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <PipelineStep label="Base" value={`${fmt(info.baseMin)}-${fmt(info.baseMax)}`} />
                  <Arrow />
                  <PipelineStep label="INC" value={`+${(info.incTotal || 0).toFixed(0)}%`}
                    highlight={info.incTotal > 100} />
                  <Arrow />
                  <PipelineStep label="MORE" value={`x${(info.moreTotal || 1).toFixed(2)}`}
                    highlight={(info.moreTotal || 1) > 1.5} />
                  <Arrow />
                  <PipelineStep label="Hit" value={fmt(info.hitAverage)} final />
                </div>
                {/* Conversion info */}
                {info.conversion && Object.keys(info.conversion).length > 0 && (
                  <div className="mt-1.5 text-[10px] text-poe-muted/70">
                    Converts: {Object.entries(info.conversion).map(([to, pct]: [string, any]) =>
                      `${(pct * 100).toFixed(0)}% → ${to}`
                    ).join(', ')}
                    {info.multRemaining != null && info.multRemaining < 1 &&
                      ` (${((info.multRemaining) * 100).toFixed(0)}% remains)`}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* DPS Summary */}
      <div className="flex gap-3">
        <div className="flex-1 bg-black/30 rounded p-3 border border-poe-border/40 text-center">
          <div className="text-lg font-bold text-poe-gold tabular-nums">{fmt(d.totalDps || 0)}</div>
          <div className="text-[10px] text-poe-muted/70">Total DPS</div>
        </div>
        <div className="flex-1 bg-black/30 rounded p-3 border border-poe-border/40 text-center">
          <div className="text-lg font-bold text-poe-gold tabular-nums">{fmt(d.combinedDps || 0)}</div>
          <div className="text-[10px] text-poe-muted/70">Combined DPS</div>
        </div>
      </div>

      {/* Defence Pipeline */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Defence Pipeline</div>
        <div className="grid grid-cols-2 gap-2">
          {['Life', 'EnergyShield', 'Armour', 'Evasion'].map(def => {
            const info = defences[def]
            if (!info) return null
            const label = def === 'EnergyShield' ? 'Energy Shield' : def
            return (
              <div key={def} className="bg-black/20 rounded p-2.5 border border-poe-border/20">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-poe-muted">{label}</span>
                  <span className="font-bold text-poe-text">{fmt(info.total)}</span>
                </div>
                <div className="text-[10px] text-poe-muted/70 space-x-2">
                  <span>Base: {fmt(info.base)}</span>
                  <span>INC: +{(info.inc || 0).toFixed(0)}%</span>
                  {info.more !== 1 && <span>MORE: x{(info.more || 1).toFixed(2)}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PipelineStep({ label, value, highlight, final }: { label: string; value: string; highlight?: boolean; final?: boolean }) {
  return (
    <div className={`px-2 py-1 rounded text-center ${final ? 'bg-poe-gold/10 border border-poe-gold/30' : 'bg-poe-border/10'}`}>
      <div className={`font-mono tabular-nums ${highlight ? 'text-poe-gold' : final ? 'text-poe-gold font-bold' : 'text-poe-text'}`}>
        {value}
      </div>
      <div className="text-[9px] text-poe-muted/60 uppercase">{label}</div>
    </div>
  )
}

function Arrow() {
  return <span className="text-poe-muted/50">{'\u2192'}</span>
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}
