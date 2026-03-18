import { PoeTooltip } from './PoeTooltip'

interface SlotData {
  name: string
  itemId?: number
  itemName?: string
}

interface Props {
  slots: SlotData[]
  factors?: Array<{ slot?: string; impactPct: number; impactAbs: number }>
  mode?: 'sidebar' | 'full'  // sidebar = compact, full = big tab
}

const RARITY_COLORS: Record<string, string> = {
  NORMAL: '#C8C8C8', MAGIC: '#8888FF', RARE: '#FFFF77', UNIQUE: '#AF6025',
}

const SLOT_ICONS: Record<string, string> = {
  'Weapon 1': 'icon_weapon.png',
  'Weapon 2': 'icon_weapon_2.png',
  'Helmet': 'icon_helmet.png',
  'Body Armour': 'icon_body_armour.png',
  'Gloves': 'icon_gloves.png',
  'Boots': 'icon_boots.png',
  'Amulet': 'icon_amulet.png',
  'Ring 1': 'icon_ring_left.png',
  'Ring 2': 'icon_ring_right.png',
  'Belt': 'icon_belt.png',
  'Quiver': 'icon_quiver.png',
}

const GEAR_SLOTS = [
  { slot: 'Weapon 1', row: 1, col: 1, label: 'Weapon' },
  { slot: 'Helmet', row: 1, col: 2, label: 'Helmet' },
  { slot: 'Weapon 2', row: 1, col: 3, label: 'Off-hand' },
  { slot: 'Amulet', row: 2, col: 2, label: 'Amulet' },
  { slot: 'Gloves', row: 3, col: 1, label: 'Gloves' },
  { slot: 'Body Armour', row: 3, col: 2, label: 'Body Armour' },
  { slot: 'Ring 1', row: 3, col: 3, label: 'Ring' },
  { slot: 'Belt', row: 4, col: 2, label: 'Belt' },
  { slot: 'Boots', row: 5, col: 1, label: 'Boots' },
  { slot: 'Ring 2', row: 5, col: 3, label: 'Ring' },
]

const FLASK_SLOTS = ['Flask 1', 'Flask 2', 'Flask 3', 'Flask 4', 'Flask 5']

export function GearDisplay({ slots, factors, mode = 'sidebar' }: Props) {
  if (!slots?.length) return null

  const slotMap = new Map(slots.map(s => [s.name, s]))
  const factorMap = new Map((factors || []).filter(f => f.slot).map(f => [f.slot!, f]))
  const assetsBase = (window as any).__pobAssetsBase || ''
  const full = mode === 'full'

  return (
    <div className={`panel ${full ? 'p-6' : 'p-4'} space-y-4`}>
      <h3 className={`text-poe-gold font-semibold ${full ? 'text-lg' : 'text-sm'}`}>Equipment</h3>

      {/* Main gear grid */}
      <div className={`grid grid-cols-3 ${full ? 'gap-3' : 'gap-1.5'}`} style={{ gridTemplateRows: 'repeat(5, auto)' }}>
        {GEAR_SLOTS.map(({ slot, row, col, label }) => (
          <div key={slot} style={{ gridRow: row, gridColumn: col }}>
            <SlotCard
              slot={slot}
              label={label}
              data={slotMap.get(slot)}
              factor={factorMap.get(slot)}
              assetsBase={assetsBase}
              full={full}
            />
          </div>
        ))}
      </div>

      {/* Flasks */}
      <div>
        <div className={`text-poe-muted/70 uppercase tracking-wider mb-1.5 ${full ? 'text-[11px]' : 'text-[9px]'}`}>Flasks</div>
        <div className={`grid grid-cols-5 ${full ? 'gap-2' : 'gap-1'}`}>
          {FLASK_SLOTS.map(slot => (
            <SlotCard
              key={slot}
              slot={slot}
              label={slot.replace('Flask ', 'F')}
              data={slotMap.get(slot)}
              factor={factorMap.get(slot)}
              assetsBase={assetsBase}
              full={full}
              isFlask
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SlotCard({ slot, label, data, factor, assetsBase, full, isFlask }: {
  slot: string; label: string; data?: SlotData; factor?: { impactPct: number; impactAbs: number }
  assetsBase: string; full: boolean; isFlask?: boolean
}) {
  const equipped = data && data.itemId && data.itemId > 0
  const itemName = data?.itemName || label
  const displayName = itemName.split(',')[0] // "The Fledgling, Lacquered Helmet" → "The Fledgling"
  const baseName = itemName.includes(',') ? itemName.split(',')[1]?.trim() : ''
  const isUnique = equipped && displayName !== label && !displayName.startsWith('New Item')
  const iconFile = SLOT_ICONS[slot]
  const borderColor = isUnique ? '#AF6025' : equipped ? '#FFFF77' : '#3D3325'

  if (!equipped) {
    return (
      <div className={`rounded text-center border border-poe-border/15 bg-black/10 ${full ? 'p-3' : 'px-2 py-1.5'}`}>
        {full && iconFile && (
          <img src={`${toFileUrl(assetsBase)}/${iconFile}`} alt="" className="w-6 h-6 mx-auto mb-1 opacity-20" />
        )}
        <div className={`text-poe-muted/40 ${full ? 'text-xs' : 'text-[10px]'}`}>{label}</div>
        <div className={`text-poe-muted/25 ${full ? 'text-[10px]' : 'text-[9px]'}`}>Empty</div>
      </div>
    )
  }

  const content = (
    <div className={`rounded text-center cursor-pointer hover:brightness-110 transition-all ${full ? 'p-3' : 'px-2 py-1.5'}`}
      style={{ border: `1px solid ${borderColor}40`, backgroundColor: `${borderColor}08` }}>
      {/* Slot icon */}
      {full && iconFile && (
        <img src={`${toFileUrl(assetsBase)}/${iconFile}`} alt="" className={`mx-auto mb-1.5 opacity-70 ${isFlask ? 'w-5 h-5' : 'w-8 h-8'}`} />
      )}
      {/* Item name */}
      <div className={`font-medium truncate ${full ? 'text-sm' : 'text-[10px]'}`}
        style={{ color: isUnique ? '#AF6025' : '#FFFF77' }}>
        {displayName}
      </div>
      {/* Base type */}
      {full && baseName && (
        <div className="text-[10px] text-poe-muted/70 truncate">{baseName}</div>
      )}
      {/* Slot label */}
      <div className={`text-poe-muted/60 truncate ${full ? 'text-[10px]' : 'text-[9px]'}`}>{label}</div>
      {/* DPS impact */}
      {factor && Math.abs(factor.impactPct) > 0.1 && (
        <div className={`text-poe-gold/80 mt-0.5 ${full ? 'text-xs font-medium' : 'text-[9px]'}`}>
          +{fmtDps(factor.impactAbs)} ({factor.impactPct.toFixed(1)}%)
        </div>
      )}
    </div>
  )

  return (
    <PoeTooltip factorId={`gear-${slot}`} category="item" tooltipParams={{ type: 'item', slot }}>
      {content}
    </PoeTooltip>
  )
}

function fmtDps(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

function toFileUrl(path: string): string {
  if (!path) return ''
  let p = path.replace(/\\/g, '/')
  if (p.startsWith('/')) return 'file://' + encodeURI(p)
  return 'file:///' + encodeURI(p)
}
