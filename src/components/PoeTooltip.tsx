import { useState, useRef, useEffect, useCallback } from 'react'

interface TooltipData {
  ok?: boolean
  name?: string
  description?: string
  lines?: string[]
  rarity?: string
  base?: string
  level?: number
  quality?: number
  isSupport?: boolean
  color?: number
  nodeType?: string
}

interface Props {
  children: React.ReactNode
  factorId: string
  category: 'gem' | 'item' | 'notable'
  tooltipParams: object
}

const RARITY_COLORS: Record<string, string> = {
  NORMAL: '#C8C8C8', MAGIC: '#8888FF', RARE: '#FFFF77', UNIQUE: '#AF6025',
}
const GEM_TYPE_COLORS: Record<number, string> = {
  1: '#E55', 2: '#6B8', 3: '#5C9AE8',
}

const tooltipCache: Record<string, TooltipData> = {}

export function clearTooltipCache() {
  for (const key in tooltipCache) delete tooltipCache[key]
}

export function PoeTooltip({ children, factorId, category, tooltipParams }: Props) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<TooltipData | null>(null)
  const [loading, setLoading] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    if (tooltipCache[factorId]) { setData(tooltipCache[factorId]); return }
    setLoading(true)
    try {
      const res = await (window as any).api.pob.getTooltip(tooltipParams)
      if (res && res.ok !== false) { tooltipCache[factorId] = res; setData(res) }
    } catch { /* ignore */ }
    setLoading(false)
  }, [factorId, tooltipParams])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) {
      setOpen(false)
    } else {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPos({ x: rect.right + 8, y: rect.top })
      }
      fetchData()
      setOpen(true)
    }
  }

  // Click outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Clamp to viewport
  useEffect(() => {
    if (!open || !tooltipRef.current) return
    const rect = tooltipRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let { x, y } = pos
    if (x + rect.width > vw - 10) x = Math.max(10, pos.x - rect.width - 60)
    if (y + rect.height > vh - 10) y = Math.max(10, vh - rect.height - 10)
    if (x !== pos.x || y !== pos.y) setPos({ x, y })
  }, [open, data, pos])

  const nameColor = category === 'item' ? RARITY_COLORS[data?.rarity || ''] || '#AF6025'
    : category === 'gem' ? GEM_TYPE_COLORS[data?.color || 0] || '#5C9AE8'
    : '#C7A44B'

  return (
    <div ref={triggerRef} className="cursor-pointer" onClick={handleClick}>
      {children}
      {open && (
        <div ref={tooltipRef} className="fixed z-[100]" style={{ left: pos.x, top: pos.y }}>
          <div className="poe-tooltip select-text">
            {loading && !data && (
              <div className="text-[#808080] text-xs px-3 py-2">Loading...</div>
            )}
            {data && (
              <>
                <div className="poe-tooltip-header" style={{ borderColor: nameColor + '60' }}>
                  <div className="poe-tooltip-name" style={{ color: nameColor }}>
                    {data.name || 'Unknown'}
                  </div>
                  {data.base && <div className="text-[11px] text-[#808080]">{data.base}</div>}
                  {data.nodeType && <div className="text-[10px] text-[#808080] uppercase tracking-wider">{data.nodeType}</div>}
                </div>

                <div className="poe-tooltip-sep" />

                {data.description && (
                  <>
                    <div className="poe-tooltip-desc">{data.description}</div>
                    <div className="poe-tooltip-sep" />
                  </>
                )}

                {data.lines && data.lines.length > 0 && (
                  <div className="poe-tooltip-mods">
                    {data.lines.map((line, i) => {
                      const parsed = parseModLine(line)
                      if (!parsed.text) return null
                      return (
                        <div key={i} className={`poe-tooltip-mod ${parsed.colorClass}`}>{parsed.text}</div>
                      )
                    })}
                  </div>
                )}

                {category === 'gem' && data.level != null && (
                  <div className="poe-tooltip-footer">
                    Level {data.level}{data.quality ? ` / Quality ${data.quality}%` : ''}
                  </div>
                )}
              </>
            )}
            {!loading && !data && (
              <div className="text-[#808080] text-xs px-3 py-2">No data</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface ParsedMod {
  text: string
  colorClass: string
  isCrafted: boolean
}

function parseModLine(raw: string): ParsedMod {
  let text = raw
  let isCrafted = false

  // Strip all {tag:...}, {variant:...}, {range:...}, {crafted} prefixes
  // Keep track of {crafted} for blue coloring
  text = text.replace(/\{crafted\}/g, () => { isCrafted = true; return '' })
  text = text.replace(/\{tags?:[^}]*\}/g, '')
  text = text.replace(/\{variant:[^}]*\}/g, '')
  text = text.replace(/\{range:[^}]*\}/g, '')
  text = text.replace(/\{[^}]*\}/g, '') // catch any remaining tags
  text = text.trim()

  if (!text) return { text: '', colorClass: '', isCrafted }

  let colorClass = 'poe-mod-default'
  if (isCrafted) {
    colorClass = 'poe-mod-crafted'
  } else if (text.match(/^Allocates /)) {
    colorClass = 'poe-mod-crafted'
  } else if (text.match(/^(Armour|Evasion|Energy Shield|Physical Damage|Elemental Damage|Critical|Attacks per|Weapon Range|Quality):/)) {
    colorClass = 'poe-mod-requirement'
  } else if (text.match(/^Requires/i) || text.match(/^Level \d/) || text.match(/^Mana Mult/) || text.match(/^Item Level/)) {
    colorClass = 'poe-mod-requirement'
  } else {
    // Almost everything else on an item/gem is a mod line — color it blue
    colorClass = 'poe-mod-explicit'
  }

  return { text, colorClass, isCrafted }
}
