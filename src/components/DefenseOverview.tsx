import { useState, useEffect } from 'react'
import type { BuildData } from '../types/pob'

interface SpecInfo { index: number; title: string; nodeCount: number; active: boolean }
interface SkillSetInfo { index: number; title: string; groupCount: number; gemCount: number }
interface ItemSetInfo { index: number; id: number; title: string }

interface Props {
  build: BuildData
  dangerData: Record<string, any> | null
  sensitivityRunning: boolean
  onSpecChange?: () => void
  onSkillSetChange?: () => void
  onItemSetChange?: () => void
}

function fmt(n: number | undefined): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

const ELEM_COLORS: Record<string, string> = {
  Fire: '#E8623A', Cold: '#5C9AE8', Lightning: '#E8D23A', Chaos: '#9B59B6',
}

export function DefenseOverview({ build, dangerData, sensitivityRunning, onSpecChange, onSkillSetChange, onItemSetChange }: Props) {
  const { stats, info } = build
  const d = dangerData || {} as any
  const resists = d.resists || {}
  const pools = d.pools || {}
  const avoidance = d.avoidance || {}
  const recovery = d.recovery || {}
  const ehp = d.ehp?.total || (stats as any).TotalEHP || 0

  const [specs, setSpecs] = useState<SpecInfo[]>([])
  const [activeSpec, setActiveSpec] = useState(1)
  const [skillSets, setSkillSets] = useState<SkillSetInfo[]>([])
  const [activeSkillSet, setActiveSkillSet] = useState(1)
  const [itemSets, setItemSets] = useState<ItemSetInfo[]>([])
  const [activeItemSetId, setActiveItemSetId] = useState(1)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const specRes = await window.api.pob.getSpecList() as any
        if (specRes.ok && specRes.specs) { setSpecs(specRes.specs); setActiveSpec(specRes.activeSpec) }
        const ssRes = await window.api.pob.getSkillSetList() as any
        if (ssRes.ok && ssRes.skillSets) { setSkillSets(ssRes.skillSets); setActiveSkillSet(ssRes.activeSkillSet) }
        const isRes = await window.api.pob.getItemSetList() as any
        if (isRes.ok && isRes.itemSets) { setItemSets(isRes.itemSets); setActiveItemSetId(isRes.activeItemSetId) }
      } catch {}
    }
    load()
  }, [build])

  const switchSpec = async (idx: number) => {
    if (switching || sensitivityRunning) return
    setSwitching(true)
    try { await window.api.pob.setActiveSpec(idx); setActiveSpec(idx); onSpecChange?.() } finally { setSwitching(false) }
  }
  const switchSkillSet = async (idx: number) => {
    if (switching || sensitivityRunning) return
    setSwitching(true)
    try { await window.api.pob.setActiveSkillSet(idx); setActiveSkillSet(idx); onSkillSetChange?.() } finally { setSwitching(false) }
  }
  const switchItemSet = async (id: number) => {
    if (switching || sensitivityRunning) return
    setSwitching(true)
    try { await window.api.pob.setActiveItemSet(id); setActiveItemSetId(id); onItemSetChange?.() } finally { setSwitching(false) }
  }

  return (
    <div className="panel p-6 space-y-5">
      {/* Header */}
      <div>
        <div className="text-poe-muted text-xs uppercase tracking-widest mb-1">
          {info?.className}{info?.ascendClassName ? ` · ${info.ascendClassName}` : ''}
          {info?.level ? ` · Level ${info.level}` : ''}
        </div>
        <h2 className="text-poe-gold font-bold text-xl">{info?.name || 'Build'}</h2>
      </div>

      {/* Switchers */}
      {(specs.length > 1 || skillSets.length > 1 || itemSets.length > 1) && (
        <div className="flex flex-wrap gap-3">
          {specs.length > 1 && (
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-1">Tree Spec</div>
              <div className="flex flex-wrap gap-1">
                {specs.map(s => (
                  <button key={s.index} onClick={() => switchSpec(s.index)} disabled={switching || sensitivityRunning}
                    className={`px-2 py-1 rounded text-xs transition-all truncate max-w-[140px] ${
                      s.index === activeSpec ? 'bg-poe-gold/20 text-poe-gold border border-poe-gold/40 font-medium'
                      : 'border border-poe-border/30 text-poe-muted/70 hover:text-poe-gold hover:border-poe-gold/30 disabled:opacity-40'
                    }`} title={`${s.title} (${s.nodeCount} nodes)`}>{s.title}</button>
                ))}
              </div>
            </div>
          )}
          {itemSets.length > 1 && (
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-1">Gear Set</div>
              <div className="flex flex-wrap gap-1">
                {itemSets.map(is => (
                  <button key={is.id} onClick={() => switchItemSet(is.id)} disabled={switching || sensitivityRunning}
                    className={`px-2 py-1 rounded text-xs transition-all truncate max-w-[140px] ${
                      is.id === activeItemSetId ? 'bg-poe-gold/20 text-poe-gold border border-poe-gold/40 font-medium'
                      : 'border border-poe-border/30 text-poe-muted/70 hover:text-poe-gold hover:border-poe-gold/30 disabled:opacity-40'
                    }`} title={is.title}>{is.title}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EHP Big Number */}
      <div className="bg-black/30 rounded-lg p-5 border border-poe-border/50 text-center">
        <div className="stat-label mb-2">Effective Hit Pool</div>
        <div className="text-5xl font-bold text-blue-400 tabular-nums">{fmt(ehp)}</div>
      </div>

      {/* Health Pools */}
      <div className="grid grid-cols-3 gap-3">
        <PoolCard label="Life" value={pools.life || stats.Life || 0} regen={recovery.Life?.regen} color="text-red-400" />
        <PoolCard label="Energy Shield" value={pools.energyShield || stats.EnergyShield || 0} regen={recovery.EnergyShield?.regen} color="text-blue-300" />
        <PoolCard label="Mana" value={pools.mana || stats.Mana || 0} regen={recovery.Mana?.regen} color="text-blue-400" />
      </div>

      {/* Resistances */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Resistances</div>
        <div className="space-y-2">
          {['Fire', 'Cold', 'Lightning', 'Chaos'].map(elem => {
            const r = resists[elem] || { current: 0, max: 75, overcap: 0 }
            const pct = Math.max(0, Math.min(100, ((r.current + 30) / (r.max + 30)) * 100))
            const isCapped = r.current >= r.max
            return (
              <div key={elem} className="flex items-center gap-2">
                <span className="w-14 text-xs text-right" style={{ color: ELEM_COLORS[elem] }}>{elem}</span>
                <div className="flex-1 h-2 bg-poe-border/20 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isCapped ? '#6B8' : ELEM_COLORS[elem] }} />
                </div>
                <span className={`w-16 text-xs text-right tabular-nums ${isCapped ? 'text-green-400' : 'text-red-400'}`}>
                  {r.current}% / {r.max}%
                </span>
                {r.overcap > 0 && <span className="text-[10px] text-poe-muted/60">+{r.overcap}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mitigation Layers */}
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Armour" value={fmt(d.armour || stats.Armour || 0)} />
        <MiniStat label="Phys DR" value={`${(d.physicalReduction || 0).toFixed(0)}%`} />
        <MiniStat label="Evasion" value={fmt(stats.Evasion || 0)} />
        <MiniStat label="Evade" value={`${(avoidance.meleeEvadeChance || 0).toFixed(0)}%`} />
        <MiniStat label="Block" value={`${(avoidance.blockChance || 0).toFixed(0)}%`} />
        <MiniStat label="Spell Block" value={`${(avoidance.spellBlockChance || 0).toFixed(0)}%`} />
        <MiniStat label="Suppression" value={`${(avoidance.suppressionChance || 0).toFixed(0)}%`} />
        <MiniStat label="Ward" value={fmt(pools.ward || 0)} />
      </div>
    </div>
  )
}

function PoolCard({ label, value, regen, color }: { label: string; value: number; regen?: number; color: string }) {
  return (
    <div className="bg-black/30 rounded p-3 border border-poe-border/40 text-center">
      <div className={`text-lg font-semibold tabular-nums ${color}`}>{fmt(value)}</div>
      <div className="text-xs text-poe-muted mt-0.5">{label}</div>
      {regen != null && regen > 0 && <div className="text-[10px] text-poe-muted/60 mt-0.5">+{regen.toFixed(1)}/s</div>}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/30 rounded p-2 border border-poe-border/30 text-center">
      <div className="text-sm font-semibold text-poe-text tabular-nums">{value}</div>
      <div className="text-[10px] text-poe-muted/70">{label}</div>
    </div>
  )
}
