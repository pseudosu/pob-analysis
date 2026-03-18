interface Props {
  breakdownData: Record<string, any> | null
  dangerData: Record<string, any> | null
}

const ELEM_COLORS: Record<string, string> = {
  Fire: '#E8623A', Cold: '#5C9AE8', Lightning: '#E8D23A', Chaos: '#9B59B6',
}

export function DefenseBreakdown({ breakdownData, dangerData }: Props) {
  const defences = breakdownData?.defences || {}
  const d = dangerData || {} as any
  const resists = d.resists || {}
  const maxHit = d.maxHitTaken || {}
  const ailments = d.ailments || {}

  return (
    <div className="panel p-6 space-y-5">
      <h2 className="text-poe-gold font-semibold text-lg">Defence Breakdown</h2>

      {/* Defence Pipelines */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Defence Pipelines</div>
        <div className="grid grid-cols-2 gap-2">
          {['Life', 'EnergyShield', 'Armour', 'Evasion'].map(def => {
            const info = defences[def]
            if (!info) return null
            const label = def === 'EnergyShield' ? 'Energy Shield' : def
            return (
              <div key={def} className="bg-black/20 rounded p-3 border border-poe-border/20">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-poe-muted font-medium">{label}</span>
                  <span className="font-bold text-poe-text tabular-nums">{fmt(info.total)}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Step label="Base" value={fmt(info.base)} />
                  <Arrow />
                  <Step label="INC" value={`+${(info.inc || 0).toFixed(0)}%`} highlight={info.inc > 100} />
                  <Arrow />
                  {info.more !== 1 && <><Step label="MORE" value={`x${(info.more || 1).toFixed(2)}`} highlight /><Arrow /></>}
                  <Step label="Total" value={fmt(info.total)} final />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Max Hit Survivable */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Maximum Hit Survivable</div>
        <div className="space-y-2">
          {['Physical', 'Fire', 'Cold', 'Lightning', 'Chaos'].map(dt => {
            const val = maxHit[dt] || 0
            const maxRef = 60000
            const pct = Math.min(100, (val / maxRef) * 100)
            const color = val < 5000 ? '#E55' : val < 10000 ? '#E89B3A' : val < 20000 ? '#6B8' : '#4A9'
            const dtColors: Record<string, string> = { Physical: '#AAA', Fire: '#E8623A', Cold: '#5C9AE8', Lightning: '#E8D23A', Chaos: '#9B59B6' }
            return (
              <div key={dt} className="flex items-center gap-2">
                <span className="w-16 text-xs text-right" style={{ color: dtColors[dt] }}>{dt}</span>
                <div className="flex-1 h-3 bg-poe-border/20 rounded overflow-hidden relative">
                  <div className="h-full rounded transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  {/* Reference lines */}
                  <div className="absolute top-0 h-full border-l border-dashed border-red-500/30" style={{ left: `${(5000/maxRef)*100}%` }} title="5K" />
                  <div className="absolute top-0 h-full border-l border-dashed border-yellow-500/30" style={{ left: `${(10000/maxRef)*100}%` }} title="10K" />
                  <div className="absolute top-0 h-full border-l border-dashed border-green-500/30" style={{ left: `${(20000/maxRef)*100}%` }} title="20K" />
                </div>
                <span className="w-14 text-xs text-right tabular-nums font-bold" style={{ color }}>{fmt(val)}</span>
              </div>
            )
          })}
          <div className="flex gap-4 text-[9px] text-poe-muted/60 justify-center pt-1">
            <span><span className="text-red-500">|</span> 5K danger</span>
            <span><span className="text-yellow-500">|</span> 10K moderate</span>
            <span><span className="text-green-500">|</span> 20K safe</span>
          </div>
        </div>
      </div>

      {/* Resistance Detail */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Resistance Details</div>
        <div className="grid grid-cols-2 gap-2">
          {['Fire', 'Cold', 'Lightning', 'Chaos'].map(elem => {
            const r = resists[elem] || { current: 0, max: 75, overcap: 0 }
            const isCapped = r.current >= r.max
            return (
              <div key={elem} className="bg-black/20 rounded p-2.5 border border-poe-border/20">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium" style={{ color: ELEM_COLORS[elem] }}>{elem}</span>
                  <span className={`text-sm font-bold tabular-nums ${isCapped ? 'text-green-400' : 'text-red-400'}`}>
                    {r.current}%
                  </span>
                </div>
                <div className="h-2 bg-poe-border/20 rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.max(0, Math.min(100, ((r.current + 30) / (r.max + 30)) * 100))}%`,
                    backgroundColor: isCapped ? '#6B8' : ELEM_COLORS[elem]
                  }} />
                </div>
                <div className="flex justify-between text-[10px] text-poe-muted/70">
                  <span>Max: {r.max}%</span>
                  {r.overcap > 0 && <span className="text-green-400/60">+{r.overcap} overcap</span>}
                  {!isCapped && <span className="text-red-400/60">{r.current - r.max} missing</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ailment Protection */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Ailment Protection</div>
        <div className="grid grid-cols-3 gap-1.5">
          {['Freeze', 'Stun', 'Shock', 'Ignite', 'Bleed', 'Poison', 'CorruptingBlood', 'Chill', 'Sap'].map(a => {
            const info = ailments[a] || { avoidChance: 0 }
            const immune = info.avoidChance >= 100
            const partial = info.avoidChance > 0 && info.avoidChance < 100
            return (
              <div key={a} className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs border ${
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
    </div>
  )
}

function Step({ label, value, highlight, final }: { label: string; value: string; highlight?: boolean; final?: boolean }) {
  return (
    <div className={`px-1.5 py-0.5 rounded text-center ${final ? 'bg-blue-400/10 border border-blue-400/30' : 'bg-poe-border/10'}`}>
      <div className={`font-mono tabular-nums text-[11px] ${highlight ? 'text-blue-400' : final ? 'text-blue-400 font-bold' : 'text-poe-text'}`}>
        {value}
      </div>
      <div className="text-[8px] text-poe-muted/60 uppercase">{label}</div>
    </div>
  )
}

function Arrow() {
  return <span className="text-poe-muted/50 text-[10px]">{'\u2192'}</span>
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}
