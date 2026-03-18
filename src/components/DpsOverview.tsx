import { useState, useEffect } from 'react'
import type { BuildData } from '../types/pob'

interface SpecInfo { index: number; title: string; nodeCount: number; active: boolean }
interface SkillSetInfo { index: number; title: string; groupCount: number; gemCount: number }
interface ItemSetInfo { index: number; id: number; title: string }

interface Props {
  build: BuildData
  sensitivityRunning: boolean
  onSpecChange?: (index: number) => void
  onSkillSetChange?: (index: number) => void
  onItemSetChange?: (id: number) => void
}

function fmt(n: number | undefined): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

function fmtPct(n: number | undefined): string {
  if (n == null) return '—'
  return `${n.toFixed(1)}%`
}

export function DpsOverview({ build, sensitivityRunning, onSpecChange, onSkillSetChange, onItemSetChange }: Props) {
  const { stats, info } = build
  const mainDps = stats.CombinedDPS || stats.FullDPS || stats.TotalDPS || 0

  const [specs, setSpecs] = useState<SpecInfo[]>([])
  const [activeSpec, setActiveSpec] = useState(1)
  const [skillSets, setSkillSets] = useState<SkillSetInfo[]>([])
  const [activeSkillSet, setActiveSkillSet] = useState(1)
  const [itemSets, setItemSets] = useState<ItemSetInfo[]>([])
  const [activeItemSetId, setActiveItemSetId] = useState(1)
  const [switching, setSwitching] = useState(false)

  // Load spec and skill set lists after build is loaded
  useEffect(() => {
    async function load() {
      try {
        const specRes = await window.api.pob.getSpecList() as { ok: boolean; specs: SpecInfo[]; activeSpec: number }
        if (specRes.ok && specRes.specs) {
          setSpecs(specRes.specs)
          setActiveSpec(specRes.activeSpec)
        }
        const ssRes = await window.api.pob.getSkillSetList() as { ok: boolean; skillSets: SkillSetInfo[]; activeSkillSet: number }
        if (ssRes.ok && ssRes.skillSets) {
          setSkillSets(ssRes.skillSets)
          setActiveSkillSet(ssRes.activeSkillSet)
        }
        const isRes = await window.api.pob.getItemSetList() as { ok: boolean; itemSets: ItemSetInfo[]; activeItemSetId: number }
        if (isRes.ok && isRes.itemSets) {
          setItemSets(isRes.itemSets)
          setActiveItemSetId(isRes.activeItemSetId)
        }
      } catch { /* ignore */ }
    }
    load()
  }, [build])

  const handleSpecChange = async (idx: number) => {
    if (switching || sensitivityRunning) return
    setSwitching(true)
    try {
      await window.api.pob.setActiveSpec(idx)
      setActiveSpec(idx)
      onSpecChange?.(idx)
    } finally {
      setSwitching(false)
    }
  }

  const handleSkillSetChange = async (idx: number) => {
    if (switching || sensitivityRunning) return
    setSwitching(true)
    try {
      await window.api.pob.setActiveSkillSet(idx)
      setActiveSkillSet(idx)
      onSkillSetChange?.(idx)
    } finally {
      setSwitching(false)
    }
  }

  const handleItemSetChange = async (id: number) => {
    if (switching || sensitivityRunning) return
    setSwitching(true)
    try {
      await window.api.pob.setActiveItemSet(id)
      setActiveItemSetId(id)
      onItemSetChange?.(id)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-poe-muted text-xs uppercase tracking-widest mb-1">
            {info?.className}{info?.ascendClassName ? ` · ${info.ascendClassName}` : ''}
            {info?.level ? ` · Level ${info.level}` : ''}
          </div>
          <h2 className="text-poe-gold font-bold text-xl">
            {info?.name || 'Imported Build'}
          </h2>
          {stats.SkillName && (
            <div className="text-poe-muted text-sm mt-1">
              Main skill: <span className="text-poe-text">{stats.SkillName}</span>
            </div>
          )}
        </div>
        {(sensitivityRunning || switching) && (
          <div className="flex items-center gap-2 text-poe-muted text-xs bg-poe-border/30 px-3 py-2 rounded-full">
            <span className="animate-pulse w-2 h-2 bg-poe-gold rounded-full inline-block" />
            {switching ? 'Switching...' : 'Analyzing...'}
          </div>
        )}
      </div>

      {/* Spec & Skill Set switchers */}
      {(specs.length > 1 || skillSets.length > 1 || itemSets.length > 1) && (
        <div className="flex flex-wrap gap-3">
          {specs.length > 1 && (
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-1">Tree Spec</div>
              <div className="flex flex-wrap gap-1">
                {specs.map(s => (
                  <button
                    key={s.index}
                    onClick={() => handleSpecChange(s.index)}
                    disabled={switching || sensitivityRunning}
                    className={`px-2 py-1 rounded text-xs transition-all truncate max-w-[140px] ${
                      s.index === activeSpec
                        ? 'bg-poe-gold/20 text-poe-gold border border-poe-gold/40 font-medium'
                        : 'border border-poe-border/30 text-poe-muted/70 hover:text-poe-gold hover:border-poe-gold/30 disabled:opacity-40'
                    }`}
                    title={`${s.title} (${s.nodeCount} nodes)`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          {skillSets.length > 1 && (
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-1">Skill Set</div>
              <div className="flex flex-wrap gap-1">
                {skillSets.map(ss => (
                  <button
                    key={ss.index}
                    onClick={() => handleSkillSetChange(ss.index)}
                    disabled={switching || sensitivityRunning}
                    className={`px-2 py-1 rounded text-xs transition-all truncate max-w-[140px] ${
                      ss.index === activeSkillSet
                        ? 'bg-poe-gold/20 text-poe-gold border border-poe-gold/40 font-medium'
                        : 'border border-poe-border/30 text-poe-muted/70 hover:text-poe-gold hover:border-poe-gold/30 disabled:opacity-40'
                    }`}
                    title={`${ss.title} (${ss.groupCount} groups, ${ss.gemCount} gems)`}
                  >
                    {ss.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          {itemSets.length > 1 && (
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-1">Gear Set</div>
              <div className="flex flex-wrap gap-1">
                {itemSets.map(is => (
                  <button
                    key={is.id}
                    onClick={() => handleItemSetChange(is.id)}
                    disabled={switching || sensitivityRunning}
                    className={`px-2 py-1 rounded text-xs transition-all truncate max-w-[140px] ${
                      is.id === activeItemSetId
                        ? 'bg-poe-gold/20 text-poe-gold border border-poe-gold/40 font-medium'
                        : 'border border-poe-border/30 text-poe-muted/70 hover:text-poe-gold hover:border-poe-gold/30 disabled:opacity-40'
                    }`}
                    title={is.title}
                  >
                    {is.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main DPS */}
      <div className="bg-black/30 rounded-lg p-5 border border-poe-border/50 text-center">
        <div className="stat-label mb-2">Combined DPS</div>
        <div className="text-5xl font-bold text-poe-gold tabular-nums">{fmt(mainDps)}</div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Life" value={fmt(stats.Life)} color="text-red-400" />
        <StatCard label="Energy Shield" value={fmt(stats.EnergyShield)} color="text-blue-300" />
        <StatCard label="Mana" value={fmt(stats.Mana)} color="text-blue-400" />
        <StatCard label="Crit Chance" value={fmtPct(stats.CritChance)} />
        <StatCard label="Crit Multi" value={stats.CritMultiplier ? `${(stats.CritMultiplier * 100).toFixed(0)}%` : '—'} />
        <StatCard label="Hit Chance" value={fmtPct(stats.HitChance)} />
        <StatCard label="Armour" value={fmt(stats.Armour)} />
        <StatCard label="Evasion" value={fmt(stats.Evasion)} />
        <StatCard label="Attack/Cast Speed" value={stats.Speed?.toFixed(2) ?? '—'} />
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'text-poe-gold' }: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="bg-black/30 rounded p-3 border border-poe-border/40 text-center">
      <div className={`text-lg font-semibold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-poe-muted mt-0.5 leading-tight">{label}</div>
    </div>
  )
}
