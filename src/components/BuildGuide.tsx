import { useMemo, useState } from 'react'
import type { BuildData } from '../types/pob'
import { classifyBuild, explainBuild, deriveScaling } from '../lib/buildGuide'
import { PoeTooltip } from './PoeTooltip'

interface Props {
  build: BuildData
  synergyData: Record<string, unknown> | null
  breakdownData: Record<string, unknown> | null
}

const DMG_COLORS: Record<string, string> = {
  Physical: '#AAA', Lightning: '#E8D23A', Cold: '#5C9AE8', Fire: '#E8623A', Chaos: '#9B59B6',
}

type GuideTab = 'identity' | 'howItWorks' | 'scaling'

export function BuildGuide({ build, synergyData, breakdownData }: Props) {
  const [tab, setTab] = useState<GuideTab>('identity')

  const guide = useMemo(() => {
    try {
      const identity = classifyBuild(synergyData as any, build.stats as any, build.info as any, build.skills?.skillSets?.[0] as any)
      const howItWorks = explainBuild(synergyData as any, build.skills?.skillSets?.[0] as any, breakdownData as any)
      const scaling = deriveScaling(breakdownData as any, build.stats as any)
      return { identity, howItWorks, scaling }
    } catch (e) {
      console.error('BuildGuide error:', e)
      return null
    }
  }, [build, synergyData, breakdownData])

  if (!guide) return <div className="panel p-6 text-poe-muted">Loading guide data...</div>

  const { identity, howItWorks, scaling } = guide

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-poe-panel border border-poe-border rounded-lg p-1">
        {([
          { key: 'identity' as GuideTab, label: 'Build Overview' },
          { key: 'howItWorks' as GuideTab, label: 'How It Works' },
          { key: 'scaling' as GuideTab, label: 'Scaling Priorities' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-poe-gold/20 text-poe-gold border border-poe-gold/30'
                : 'text-poe-muted/70 hover:text-poe-gold border border-transparent'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'identity' && <IdentityCard identity={identity} build={build} />}
      {tab === 'howItWorks' && <HowItWorksPanel data={howItWorks} />}
      {tab === 'scaling' && <ScalingPanel priorities={scaling} />}
    </div>
  )
}

// ── Identity Card ──────────────────────────────────────────────────────────

function IdentityCard({ identity, build }: { identity: any; build: BuildData }) {
  if (!identity) return null
  const { stats } = build

  return (
    <div className="panel p-6 space-y-5">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="text-poe-muted text-xs uppercase tracking-widest">
          {build.info?.className} · {build.info?.ascendClassName} · Level {build.info?.level}
        </div>
        <h1 className="text-3xl font-bold text-poe-gold">{identity.fullTitle}</h1>
      </div>

      {/* Playstyle Tags */}
      <div className="flex flex-wrap gap-2 justify-center">
        {identity.playstyleTags?.map((tag: string, i: number) => (
          <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-poe-gold/10 text-poe-gold border border-poe-gold/30">
            {tag}
          </span>
        ))}
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-3">
        <BigStat label="Combined DPS" value={fmtNum(stats.CombinedDPS || stats.TotalDPS || 0)} color="text-poe-gold" />
        <BigStat label="Life" value={fmtNum(stats.Life || 0)} color="text-red-400" />
        <BigStat label="Energy Shield" value={fmtNum(stats.EnergyShield || 0)} color="text-blue-300" />
      </div>

      {/* Damage Profile */}
      {identity.damageProfile && (
        <div>
          <div className="text-xs text-poe-muted/70 uppercase tracking-wider mb-2 text-center">Damage Type Breakdown</div>
          <div className="h-5 rounded-full overflow-hidden flex">
            {Object.entries(identity.damageProfile as Record<string, number>)
              .filter(([, v]) => v > 0.01)
              .sort(([, a], [, b]) => b - a)
              .map(([type, frac]) => (
                <div key={type} className="h-full" style={{ width: `${frac * 100}%`, backgroundColor: DMG_COLORS[type] || '#888' }}
                  title={`${type}: ${(frac * 100).toFixed(1)}%`} />
              ))}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {Object.entries(identity.damageProfile as Record<string, number>)
              .filter(([, v]) => v > 0.01)
              .sort(([, a], [, b]) => b - a)
              .map(([type, frac]) => (
                <span key={type} className="flex items-center gap-1 text-xs text-poe-muted">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: DMG_COLORS[type] }} />
                  {type} {(frac * 100).toFixed(0)}%
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Key Mechanics */}
      {identity.keyMechanics?.length > 0 && (
        <div>
          <div className="text-xs text-poe-muted/70 uppercase tracking-wider mb-2">Key Mechanics</div>
          <div className="space-y-2">
            {identity.keyMechanics.map((m: string, i: number) => (
              <div key={i} className="flex gap-2 text-sm text-poe-text">
                <span className="text-poe-gold shrink-0">&#x25B8;</span>
                <span>{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Defense Model */}
      <div className="text-center text-sm text-poe-muted">
        Defense: <span className="text-poe-text font-medium">{identity.defenseModel}</span>
      </div>
    </div>
  )
}

// ── How It Works ───────────────────────────────────────────────────────────

function HowItWorksPanel({ data }: { data: any }) {
  if (!data) return null
  const [expanded, setExpanded] = useState<string | null>('mainSkill')

  const toggle = (key: string) => setExpanded(expanded === key ? null : key)

  return (
    <div className="space-y-3">
      {/* Main Skill */}
      {data.mainSkill && (
        <Section title={`Main Skill: ${data.mainSkill.name}`} expanded={expanded === 'mainSkill'} onToggle={() => toggle('mainSkill')} color="text-poe-gold">
          <p className="text-sm text-poe-text leading-relaxed">{data.mainSkill.explanation}</p>
          {data.mainSkill.scaling?.length > 0 && (
            <div className="mt-2 text-xs text-poe-muted">
              <span className="font-medium">Scales with: </span>
              {data.mainSkill.scaling.join(', ')}
            </div>
          )}
        </Section>
      )}

      {/* Support Gems */}
      {data.supports?.length > 0 && (
        <Section title={`Support Gems (${data.supports.length})`} expanded={expanded === 'supports'} onToggle={() => toggle('supports')} color="text-blue-400">
          <div className="space-y-2">
            {data.supports.map((s: any, i: number) => (
              <div key={i} className="flex gap-2">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ({ 1: '#E55', 2: '#6B8', 3: '#5C9AE8' } as any)[s.color] || '#888' }} />
                <div>
                  <span className="text-sm text-poe-text font-medium">{s.name}</span>
                  <span className="text-sm text-poe-muted ml-1">— {s.role}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Key Items */}
      {data.keyItems?.length > 0 && (
        <Section title={`Key Unique Items (${data.keyItems.length})`} expanded={expanded === 'items'} onToggle={() => toggle('items')} color="text-orange-400">
          <div className="space-y-3">
            {data.keyItems.map((item: any, i: number) => (
              <PoeTooltip key={i} factorId={`guide-item-${i}`} category="item"
                tooltipParams={{ type: 'item', slot: item.slot, itemName: item.name }}>
                <div className="bg-black/20 rounded p-3 border border-[#AF6025]/20 cursor-pointer hover:border-[#AF6025]/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-[#AF6025]/10 border border-[#AF6025]/30 flex items-center justify-center shrink-0">
                      <span className="text-[#AF6025] text-lg">&#x2666;</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-[#AF6025] font-medium">{item.name}</div>
                      {item.slot && <div className="text-[10px] text-poe-muted/60">{item.slot}</div>}
                      <div className="text-sm text-poe-text mt-1 leading-relaxed">{item.role}</div>
                      <div className="text-[10px] text-poe-muted/70 mt-1 italic">Click for full item details</div>
                    </div>
                  </div>
                </div>
              </PoeTooltip>
            ))}
          </div>
        </Section>
      )}

      {/* Key Nodes */}
      {data.keyNodes?.length > 0 && (
        <Section title={`Key Passives (${data.keyNodes.length})`} expanded={expanded === 'nodes'} onToggle={() => toggle('nodes')} color="text-purple-400">
          <div className="space-y-2">
            {data.keyNodes.map((node: any, i: number) => (
              <div key={i}>
                <span className="text-sm text-poe-gold font-medium">{node.name}</span>
                <span className="text-xs text-poe-muted/70 ml-1">({node.type})</span>
                <span className="text-sm text-poe-muted ml-1">— {node.role}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Auras & Buffs */}
      {data.auras?.length > 0 && (
        <Section title={`Auras & Buffs (${data.auras.length})`} expanded={expanded === 'auras'} onToggle={() => toggle('auras')} color="text-green-400">
          <div className="grid grid-cols-2 gap-2">
            {data.auras.map((aura: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                  aura.type === 'aura' ? 'bg-blue-900/30 text-blue-400'
                  : aura.type === 'curse' ? 'bg-purple-900/30 text-purple-400'
                  : aura.type === 'guard' ? 'bg-yellow-900/30 text-yellow-400'
                  : 'bg-green-900/30 text-green-400'
                }`}>{aura.type}</span>
                <span className="text-poe-text">{aura.name}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// ── Scaling Priorities ─────────────────────────────────────────────────────

function ScalingPanel({ priorities }: { priorities: any[] }) {
  if (!priorities?.length) return <div className="panel p-6 text-poe-muted text-center">No scaling data available.</div>

  const IMP_COLORS = { critical: '#E55', high: '#E89B3A', medium: '#AF9A5A', low: '#7A6A4A' }

  return (
    <div className="panel p-6 space-y-4">
      <h2 className="text-poe-gold font-semibold text-lg text-center">What to Prioritize</h2>
      <div className="space-y-3">
        {priorities.map((p: any) => (
          <div key={p.rank} className="flex items-start gap-3 bg-black/20 rounded p-3 border border-poe-border/20">
            <span className="text-2xl font-bold tabular-nums shrink-0 w-8 text-right" style={{ color: (IMP_COLORS as any)[p.importance] || '#888' }}>
              {p.rank}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-poe-text font-medium">{p.displayName}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                  style={{ backgroundColor: ((IMP_COLORS as any)[p.importance] || '#888') + '20', color: (IMP_COLORS as any)[p.importance] }}>
                  {p.importance}
                </span>
              </div>
              <div className="text-sm text-poe-muted mt-0.5">{p.reason}</div>
              {p.gearMods?.length > 0 && (
                <div className="text-xs text-poe-muted/70 mt-1">
                  <span className="text-poe-gold/70">Look for: </span>
                  {p.gearMods.join(' · ')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Shared Components ──────────────────────────────────────────────────────

function Section({ title, expanded, onToggle, color, children }: {
  title: string; expanded: boolean; onToggle: () => void; color: string; children: React.ReactNode
}) {
  return (
    <div className="panel overflow-hidden">
      <button onClick={onToggle} className={`w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/[0.02] transition-colors`}>
        <span className={`font-semibold ${color}`}>{title}</span>
        <span className="text-poe-muted text-xs">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && <div className="px-5 pb-4">{children}</div>}
    </div>
  )
}

function BigStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-black/30 rounded-lg p-4 border border-poe-border/50 text-center">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-poe-muted mt-1">{label}</div>
    </div>
  )
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}
