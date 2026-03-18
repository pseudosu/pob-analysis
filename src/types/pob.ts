export interface BuildStats {
  FullDPS?: number
  TotalDPS?: number
  CombinedDPS?: number
  TotalDot?: number
  TotalDotDPS?: number
  Life?: number
  EnergyShield?: number
  Mana?: number
  Armour?: number
  Evasion?: number
  BlockChance?: number
  CritChance?: number
  CritMultiplier?: number
  HitChance?: number
  Speed?: number
  SkillName?: string
  SkillPartName?: string
}

export interface BuildInfo {
  name?: string
  level?: number
  className?: string
  ascendClassName?: string
  bandit?: string
}

export interface Gem {
  nameSpec: string
  skillId?: string
  level: number
  quality: number
  enabled: boolean
  color?: number
  isSupport?: boolean
}

export interface SkillGroup {
  label?: string
  slot?: string
  enabled: boolean
  mainActiveSkill?: number
  gems: Gem[]
}

export interface Item {
  id: number
  name?: string
  rarity?: string
  base?: string
  raw?: string
}

export interface ItemSlot {
  name: string
  itemId?: number
  item?: Item
}

export interface PassiveNode {
  id: number
  name: string
  isKeystone?: boolean
  isNotable?: boolean
  isMastery?: boolean
  mods?: string[]
}

export interface Notable {
  id: number
  name: string
  type: 'notable' | 'keystone'
}

export interface BuildData {
  stats: BuildStats
  info: BuildInfo
  skills: { skillSets: SkillGroup[][] }
  items: { items: Item[]; slots: ItemSlot[] }
  tree: { nodes: number[]; notables: Notable[] }
}

export interface Factor {
  id: string
  category: 'gem' | 'notable' | 'item'
  name: string
  slot?: string
  detail?: string
  groupLabel?: string
  baselineDps: number
  withoutDps: number
  impactPct: number
  impactAbs: number
  iconUrl?: string
  gemColor?: number      // 1=str, 2=dex, 3=int for gem color
  slotIcon?: string      // local asset filename for item slot
  sprite?: { x: number; y: number; w: number; h: number }  // sprite sheet coords
}

export interface Settings {
  luajitPath: string
  pobSourcePath: string
}
