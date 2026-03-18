// PoE CDN base for tree node icons
const POE_CDN = 'https://web.poecdn.com/image/'

// Map slot names to local asset filenames
const SLOT_ICON_MAP: Record<string, string> = {
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

// Gem color: 1=str(red), 2=dex(green), 3=int(blue)
const GEM_COLORS: Record<number, string> = {
  1: '#E55',    // strength / red
  2: '#6B8',    // dexterity / green
  3: '#5C9AE8', // intelligence / blue
  0: '#AAA',    // neutral / grey
}

export function getNotableIconUrl(iconPath?: string): string | undefined {
  if (!iconPath) return undefined
  return POE_CDN + iconPath
}

export function getSlotIconPath(slotName: string): string | undefined {
  const filename = SLOT_ICON_MAP[slotName]
  if (!filename) return undefined
  // In dev mode, assets are at resources/pob-src/Assets/
  // We'll use a data URL approach or serve from the renderer
  return `pob-assets://${filename}`
}

export function getSlotIconFilename(slotName: string): string | undefined {
  return SLOT_ICON_MAP[slotName]
}

export function getGemColor(colorNum?: number): string {
  return GEM_COLORS[colorNum ?? 0] || '#AAA'
}

export function getGemColorName(colorNum?: number): string {
  switch (colorNum) {
    case 1: return 'Strength'
    case 2: return 'Dexterity'
    case 3: return 'Intelligence'
    default: return ''
  }
}
