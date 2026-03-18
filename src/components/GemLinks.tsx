import type { SkillGroup } from '../types/pob'
import { PoeTooltip } from './PoeTooltip'

interface Props {
  skillSets: SkillGroup[][] | undefined
  mainSkillName?: string
}

const GEM_COLORS: Record<number, string> = { 1: '#E55', 2: '#6B8', 3: '#5C9AE8', 0: '#888' }

export function GemLinks({ skillSets, mainSkillName }: Props) {
  const mainSet = skillSets?.[0] || []
  if (!mainSet.length) return null

  return (
    <div className="panel p-5 space-y-3">
      <h3 className="text-poe-gold font-semibold text-sm">Gem Links</h3>
      <div className="space-y-2.5">
        {mainSet.map((group, gi) => {
          if (!group.enabled || !group.gems?.length) return null
          const isMain = group.gems.some(g => g.nameSpec === mainSkillName)
          const activeGem = group.gems.find(g => g.enabled && !(g as any).isSupport)
          const groupLabel = group.label || activeGem?.nameSpec || group.gems[0]?.nameSpec || `Group ${gi + 1}`

          return (
            <div key={gi} className={`rounded-lg p-2.5 border transition-colors ${
              isMain ? 'bg-poe-gold/5 border-poe-gold/30' : 'bg-black/20 border-poe-border/20'
            }`}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-2">
                {isMain && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-poe-gold/20 text-poe-gold border border-poe-gold/30">MAIN</span>}
                <span className="text-xs text-poe-muted truncate">{group.slot ? `[${group.slot}]` : ''}</span>
              </div>

              {/* Socket chain */}
              <div className="flex flex-wrap items-center gap-0">
                {group.gems.filter(g => g.enabled).map((gem, gemIdx, arr) => {
                  const color = GEM_COLORS[(gem as any).color || 0]
                  const isActive = !(gem as any).isSupport
                  return (
                    <div key={gemIdx} className="flex items-center">
                      <PoeTooltip factorId={`link-${gi}-${gemIdx}`} category="gem"
                        tooltipParams={{ type: 'gem', groupIdx: gi, gemName: gem.nameSpec, skillId: gem.skillId }}>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:brightness-125 transition-all ${
                          isActive ? 'bg-black/40' : 'bg-black/20'
                        }`} style={{ border: `1px solid ${color}50` }}>
                          <div className={`rounded-full shrink-0 ${isActive ? 'w-3 h-3' : 'w-2.5 h-2.5'}`}
                            style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}40` }} />
                          <span className={`text-xs truncate max-w-[100px] ${isActive ? 'text-poe-text font-medium' : 'text-poe-muted'}`}>
                            {gem.nameSpec}
                          </span>
                        </div>
                      </PoeTooltip>
                      {/* Link connector */}
                      {gemIdx < arr.length - 1 && (
                        <div className="w-2 h-0.5 bg-poe-border/40 shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
