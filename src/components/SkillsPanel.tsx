import type { SkillGroup } from '../types/pob'
import { PoeTooltip } from './PoeTooltip'

interface Props {
  skillSets: SkillGroup[][] | undefined
}

const GEM_COLORS: Record<number, string> = { 1: '#E55', 2: '#6B8', 3: '#5C9AE8' }

export function SkillsPanel({ skillSets }: Props) {
  const mainSet = skillSets?.[0] || []

  if (!mainSet.length) return null

  return (
    <div className="panel p-5 space-y-4">
      <h3 className="text-poe-gold font-semibold">Skill Groups</h3>
      <div className="space-y-3">
        {mainSet.map((group, gi) => (
          <div key={gi} className="bg-black/30 rounded p-3 border border-poe-border/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-poe-text text-sm font-medium">
                {group.label || group.gems?.[0]?.nameSpec || `Group ${gi + 1}`}
              </span>
              {group.slot && (
                <span className="text-poe-muted/60 text-xs">[{group.slot}]</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.gems?.map((gem, gemIdx) => {
                const color = GEM_COLORS[(gem as any).color || 0] || '#888'
                return (
                  <PoeTooltip
                    key={gemIdx}
                    factorId={`skill-${gi}-${gemIdx}`}
                    category="gem"
                    tooltipParams={{ type: 'gem', groupIdx: gi, gemName: gem.nameSpec, skillId: gem.skillId }}
                  >
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs cursor-pointer
                      hover:brightness-125 transition-all
                      ${gem.enabled
                        ? 'bg-black/40 text-poe-text'
                        : 'border-poe-border/20 bg-black/20 text-poe-muted/60 line-through'}`}
                      style={{ borderColor: gem.enabled ? color + '50' : undefined }}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: gem.enabled ? color : '#555' }} />
                      <span className="font-medium">{gem.nameSpec}</span>
                      <span className="opacity-50 text-[10px]">L{gem.level}</span>
                    </div>
                  </PoeTooltip>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
