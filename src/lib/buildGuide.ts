// ---------------------------------------------------------------------------
// Build Guide Engine for Path of Exile
// Produces plain-English explanations of a build for non-experts.
// ---------------------------------------------------------------------------
import { UNIQUE_ITEM_DB } from '../data/uniqueItems'

import type { SynergyData } from './synergies'
import type { BuildInfo, BuildStats, SkillGroup } from '../types/pob'

// ---- Input interfaces specific to guide generation -----------------------

export interface BreakdownData {
  skillName: string
  damageTypes: Record<
    string,
    {
      baseMin: number
      baseMax: number
      hitAverage: number
      incTotal: number
      moreTotal: number
      conversion: number
      gain: number
    }
  >
  defences: Record<string, { base: number; inc: number; more: number; total: number }>
  totalDps: number
  combinedDps: number
}

// ---- Output interfaces ---------------------------------------------------

export interface BuildIdentity {
  archetype: string
  mainSkill: string
  ascendancy: string
  fullTitle: string
  damageProfile: Record<string, number>
  playstyleTags: string[]
  defenseModel: string
  keyMechanics: string[]
}

export interface HowItWorks {
  mainSkill: { name: string; explanation: string; scaling: string[] }
  supports: Array<{ name: string; role: string; color: number }>
  keyItems: Array<{ name: string; role: string }>
  keyNodes: Array<{ name: string; type: string; role: string }>
  auras: Array<{ name: string; type: 'aura' | 'herald' | 'curse' | 'guard' | 'buff'; effect: string }>
}

export interface ScalingPriority {
  rank: number
  stat: string
  displayName: string
  importance: 'critical' | 'high' | 'medium' | 'low'
  reason: string
  gearMods: string[]
}

// ===========================================================================
// Static Knowledge Tables
// ===========================================================================

// ---- Support Gem Descriptions (80+ entries) --------------------------------

const SUPPORT_DESCRIPTIONS: Record<string, { role: string; category: 'damage' | 'utility' | 'defensive' }> = {
  // --- Damage supports ---
  'Trinity': {
    role: 'Massive damage multiplier from dealing multiple element types via Resonance stacks',
    category: 'damage',
  },
  'Elemental Damage with Attacks': {
    role: 'Large more multiplier for elemental attack damage',
    category: 'damage',
  },
  'Mirage Archer': {
    role: 'Creates a clone that continues attacking after you stop, boosting sustained DPS',
    category: 'damage',
  },
  'Inspiration': {
    role: 'Reduces mana cost and provides crit chance plus elemental damage',
    category: 'damage',
  },
  'Added Fire Damage': {
    role: 'Converts a portion of physical damage to extra fire damage',
    category: 'damage',
  },
  'Added Cold Damage': {
    role: 'Adds flat cold damage to attacks or spells',
    category: 'damage',
  },
  'Added Lightning Damage': {
    role: 'Adds flat lightning damage to attacks or spells',
    category: 'damage',
  },
  'Added Chaos Damage': {
    role: 'Adds flat chaos damage that bypasses energy shield',
    category: 'damage',
  },
  'Controlled Destruction': {
    role: 'Large more spell damage multiplier at the cost of reduced crit chance',
    category: 'damage',
  },
  'Concentrated Effect': {
    role: 'More area damage at the cost of smaller area of effect',
    category: 'damage',
  },
  'Increased Critical Strikes': {
    role: 'Massively boosts critical strike chance',
    category: 'damage',
  },
  'Increased Critical Damage': {
    role: 'Massively boosts critical strike multiplier for confirmed crits',
    category: 'damage',
  },
  'Hypothermia': {
    role: 'More damage against chilled enemies and increased chance to freeze',
    category: 'damage',
  },
  'Ice Bite': {
    role: 'Adds cold damage and grants frenzy charges on kill for sustained mapping',
    category: 'damage',
  },
  'Vicious Projectiles': {
    role: 'More physical projectile damage and damage over time with projectiles',
    category: 'damage',
  },
  'Swift Affliction': {
    role: 'More damage over time at the cost of shorter duration',
    category: 'damage',
  },
  'Efficacy': {
    role: 'More damage over time and increased skill duration',
    category: 'damage',
  },
  'Void Manipulation': {
    role: 'More chaos damage at the cost of no elemental damage',
    category: 'damage',
  },
  'Burning Damage': {
    role: 'More burning damage, ideal for ignite and fire DoT builds',
    category: 'damage',
  },
  'Deadly Ailments': {
    role: 'Much more ailment damage at the cost of reduced hit damage',
    category: 'damage',
  },
  'Unbound Ailments': {
    role: 'Increases ailment effect and duration for stronger ignite/poison/bleed',
    category: 'damage',
  },
  'Brutality': {
    role: 'Huge more physical damage but prevents dealing non-physical damage',
    category: 'damage',
  },
  'Melee Physical Damage': {
    role: 'More melee physical damage, a core multiplier for physical melee builds',
    category: 'damage',
  },
  'Damage on Full Life': {
    role: 'More damage when on full life, ideal for builds with strong leech or CI',
    category: 'damage',
  },
  'Elemental Focus': {
    role: 'Large more elemental damage but cannot inflict elemental ailments',
    category: 'damage',
  },
  'Immolate': {
    role: 'Adds large flat fire damage against burning enemies',
    category: 'damage',
  },
  'Predator': {
    role: 'Marks a target for minions to focus, granting more minion damage against it',
    category: 'damage',
  },
  'Minion Damage': {
    role: 'More minion damage, a core multiplier for summoner builds',
    category: 'damage',
  },
  'Spell Echo': {
    role: 'Repeats spells automatically for more casts per second at reduced damage',
    category: 'damage',
  },
  'Multistrike': {
    role: 'Repeats melee attacks for more hits per second with escalating damage',
    category: 'damage',
  },
  'Unleash': {
    role: 'Stores spell casts and releases them in a burst for smoother gameplay',
    category: 'damage',
  },
  'Faster Attacks': {
    role: 'Increases attack speed for more hits per second',
    category: 'damage',
  },
  'Faster Casting': {
    role: 'Increases cast speed for more casts per second',
    category: 'damage',
  },
  'Impale': {
    role: 'Chance to impale on hit, stacking physical damage that replays on later hits',
    category: 'damage',
  },
  'Physical to Lightning': {
    role: 'Converts half of physical damage to lightning and adds lightning damage',
    category: 'damage',
  },
  'Cold to Fire': {
    role: 'Converts half of cold damage to fire and adds fire damage from cold',
    category: 'damage',
  },
  'Empower': {
    role: 'Raises the level of the linked skill gem, boosting all base values',
    category: 'damage',
  },
  'Awakened Added Fire Damage': {
    role: 'Premium version: converts more physical to fire with higher values',
    category: 'damage',
  },
  'Awakened Elemental Damage with Attacks': {
    role: 'Premium version: larger more multiplier for elemental attack damage',
    category: 'damage',
  },
  'Awakened Controlled Destruction': {
    role: 'Premium version: larger more spell damage multiplier',
    category: 'damage',
  },
  'Awakened Melee Physical Damage': {
    role: 'Premium version: larger more multiplier for melee physical damage',
    category: 'damage',
  },
  'Awakened Brutality': {
    role: 'Premium version: even higher more physical damage',
    category: 'damage',
  },
  'Awakened Vicious Projectiles': {
    role: 'Premium version: larger more multiplier for projectile and DoT damage',
    category: 'damage',
  },
  'Awakened Swift Affliction': {
    role: 'Premium version: larger more damage over time',
    category: 'damage',
  },
  'Awakened Void Manipulation': {
    role: 'Premium version: larger more chaos damage',
    category: 'damage',
  },
  'Awakened Burning Damage': {
    role: 'Premium version: larger more burning damage',
    category: 'damage',
  },
  'Awakened Deadly Ailments': {
    role: 'Premium version: larger more ailment damage',
    category: 'damage',
  },
  'Awakened Elemental Focus': {
    role: 'Premium version: larger more elemental damage',
    category: 'damage',
  },
  'Awakened Minion Damage': {
    role: 'Premium version: larger more minion damage multiplier',
    category: 'damage',
  },
  'Energy Blade': {
    role: 'Converts energy shield into flat lightning damage on weapons',
    category: 'damage',
  },
  'Bloodthirst': {
    role: 'Adds physical damage to attacks based on missing life',
    category: 'damage',
  },
  'Rage': {
    role: 'Generates rage on hit, granting attack damage, speed, and movement speed',
    category: 'damage',
  },
  'Close Combat': {
    role: 'More melee damage based on proximity and provides Fortify on melee hit',
    category: 'damage',
  },
  'Cruelty': {
    role: 'Grants more damage over time based on recent hit damage',
    category: 'damage',
  },
  'Volatility': {
    role: 'Increases maximum damage variance for higher peak hits',
    category: 'damage',
  },
  'Fist of War': {
    role: 'Every few attacks is empowered with a large more damage bonus',
    category: 'damage',
  },
  'Pulverise': {
    role: 'More area of effect and damage for slam attacks at the cost of speed',
    category: 'damage',
  },
  'Nightblade': {
    role: 'Grants Elusive on crit with massive crit multiplier while elusive',
    category: 'damage',
  },
  'Momentum': {
    role: 'Grants action speed after travelling, rewarding mobile playstyle',
    category: 'damage',
  },

  // --- Utility supports ---
  'Greater Multiple Projectiles': {
    role: 'Fires additional projectiles for better area coverage at a damage cost',
    category: 'utility',
  },
  'Lesser Multiple Projectiles': {
    role: 'Fires two extra projectiles with smaller damage penalty than GMP',
    category: 'utility',
  },
  'Volley': {
    role: 'Fires extra projectiles in parallel lines for wider coverage',
    category: 'utility',
  },
  'Fork': {
    role: 'Projectiles split into two on first hit, covering more area',
    category: 'utility',
  },
  'Chain': {
    role: 'Projectiles bounce between enemies, hitting multiple targets',
    category: 'utility',
  },
  'Pierce': {
    role: 'Projectiles pass through enemies, hitting everything in their path',
    category: 'utility',
  },
  'Returning Projectiles': {
    role: 'Projectiles return after reaching max distance, hitting enemies twice',
    category: 'utility',
  },
  'Increased Area of Effect': {
    role: 'Larger area of effect for better pack clearing',
    category: 'utility',
  },
  'Spell Cascade': {
    role: 'Repeats area spells in a line, tripling coverage',
    category: 'utility',
  },
  'Awakened Spell Cascade': {
    role: 'Premium version: repeats area spells five times in a line',
    category: 'utility',
  },
  'Barrage': {
    role: 'Converts projectile skills to fire sequentially at a single target',
    category: 'utility',
  },
  'Trap': {
    role: 'Converts the skill into a thrown trap that triggers when enemies approach',
    category: 'utility',
  },
  'Mine': {
    role: 'Converts the skill into a remote mine detonated on demand',
    category: 'utility',
  },
  'Ballista Totem': {
    role: 'Places a totem that uses the linked bow attack automatically',
    category: 'utility',
  },
  'Spell Totem': {
    role: 'Places a totem that casts the linked spell automatically',
    category: 'utility',
  },
  'Arcanist Brand': {
    role: 'Creates a brand that repeatedly casts the linked spell on attached enemies',
    category: 'utility',
  },
  'Hextouch': {
    role: 'Applies linked curse on hit, automating curse application',
    category: 'utility',
  },
  'Mark On Hit': {
    role: 'Automatically applies linked mark skill to rare and unique enemies on hit',
    category: 'utility',
  },
  'Ancestral Call': {
    role: 'Strikes at additional nearby enemies when using melee attacks',
    category: 'utility',
  },
  'Melee Splash': {
    role: 'Single-target melee hits deal damage in an area around the target',
    category: 'utility',
  },
  'Enhance': {
    role: 'Raises the quality of linked skill gems for bonus effects',
    category: 'utility',
  },
  'Combustion': {
    role: 'Lowers enemy fire resistance when igniting, helping fire builds penetrate',
    category: 'utility',
  },
  'Bonechill': {
    role: 'Enemies chilled by linked skill take increased cold damage over time',
    category: 'utility',
  },
  'Elemental Proliferation': {
    role: 'Spreads elemental ailments to nearby enemies on kill',
    category: 'utility',
  },
  'Onslaught': {
    role: 'Grants Onslaught buff on kill for 20% increased action speed',
    category: 'utility',
  },
  'Culling Strike': {
    role: 'Instantly kills enemies below 10% life, shortening boss fights',
    category: 'utility',
  },
  'Power Charge on Critical': {
    role: 'Generates power charges on crit for sustained crit chance bonus',
    category: 'utility',
  },

  // --- Defensive supports ---
  'Cast when Damage Taken': {
    role: 'Automatically casts linked spells when you take enough damage',
    category: 'defensive',
  },
  'Minion Life': {
    role: 'Increases minion maximum life for better survivability',
    category: 'defensive',
  },
  'Blind': {
    role: 'Blinds enemies on hit, reducing their chance to hit by 20%',
    category: 'defensive',
  },
  'Life Gain on Hit': {
    role: 'Recovers life for each enemy hit, powerful with fast multi-hit skills',
    category: 'defensive',
  },
  'Energy Leech': {
    role: 'Leeches energy shield on hit and provides more damage while leeching',
    category: 'defensive',
  },
  'Lifetap': {
    role: 'Skills cost life instead of mana, useful for life-stacking and reservation builds',
    category: 'defensive',
  },
  'Fortify': {
    role: 'Grants Fortify buff on melee hit, reducing damage taken from hits',
    category: 'defensive',
  },
  'Withering Touch': {
    role: 'Applies Wither stacks on hit, increasing chaos damage taken by enemies',
    category: 'damage',
  },
  'Chance to Bleed': {
    role: 'Adds physical damage and chance to inflict bleed on hit',
    category: 'damage',
  },
  'Chance to Poison': {
    role: 'Adds chaos damage and chance to poison on hit',
    category: 'damage',
  },
  'Decay': {
    role: 'Applies a chaos damage over time debuff on hit',
    category: 'damage',
  },
  'Bloodlust': {
    role: 'More damage against bleeding enemies but cannot cause bleeding',
    category: 'damage',
  },
  'Awakened Hextouch': {
    role: 'Premium version: apply two curses on hit automatically',
    category: 'utility',
  },
  'Awakened Chain': {
    role: 'Premium version: projectiles chain to additional targets',
    category: 'utility',
  },
  'Awakened Fork': {
    role: 'Premium version: projectiles fork on each hit',
    category: 'utility',
  },
  'Awakened Greater Multiple Projectiles': {
    role: 'Premium version: even more additional projectiles',
    category: 'utility',
  },
  'Feeding Frenzy': {
    role: 'Minions are aggressive and grant you the Feeding Frenzy buff for more minion damage and speed',
    category: 'damage',
  },
  'Awakened Multistrike': {
    role: 'Premium version: repeats melee attacks with higher escalating damage',
    category: 'damage',
  },
  'Phantasmal': {
    role: 'Provides alternate quality effects that modify skill behavior',
    category: 'utility',
  },
}

// ---- Keystone Descriptions (40+ entries) -----------------------------------

const KEYSTONE_DESCRIPTIONS: Record<string, string> = {
  'Chaos Inoculation':
    'Sets life to 1 but grants immunity to chaos damage. Build must use Energy Shield for survival.',
  'Mind over Matter':
    '30% of damage taken from mana before life. Requires large mana pool.',
  'Elemental Overload':
    '40% more elemental damage but cannot deal critical strikes. Efficient for non-crit builds.',
  'Avatar of Fire':
    'Converts 50% of non-fire damage to fire. Only fire damage can be dealt.',
  'Point Blank':
    'Projectiles deal up to 30% more damage at close range, less at distance.',
  'Iron Grip':
    'Strength bonus to melee physical damage also applies to projectile attacks.',
  'Iron Reflexes':
    'Converts all evasion rating to armour. Simplifies defences into pure physical mitigation.',
  'Resolute Technique':
    'Hits cannot be evaded but also cannot critically strike. Eliminates accuracy concerns.',
  'Acrobatics':
    'Grants 30% attack dodge chance at the cost of halving armour and energy shield.',
  'Phase Acrobatics':
    'Grants 30% spell dodge chance. Requires Acrobatics.',
  'Vaal Pact':
    'Life leech is instant but life regeneration has no effect. Strong for sustained damage intake.',
  'Zealots Oath':
    'Life regeneration applies to energy shield instead. Core for ES-regen builds.',
  'Ghost Reaver':
    'Life leech applies to energy shield. Allows leech-based ES recovery.',
  'Crimson Dance':
    'Allows bleeding to stack up to 8 times but removes the moving bonus. Massive bleed DPS.',
  'Perfect Agony':
    'Critical strike multiplier applies to ailment damage at 150% effectiveness. Core for crit ailment builds.',
  'Eldritch Battery':
    'Energy shield protects mana instead of life. Useful for high-cost skill builds.',
  'Blood Magic':
    'Life is used instead of mana for skills and auras. Eliminates mana but reserves life.',
  'Ancestral Bond':
    'Can summon an additional totem but you deal no damage yourself.',
  'Runebinder':
    'Can attach an additional brand to each enemy for double brand damage.',
  'Arrow Dancing':
    'Greatly increases chance to evade projectile attacks at the cost of melee evasion.',
  'Unwavering Stance':
    'Cannot be stunned but also cannot evade attacks. Useful for melee characters.',
  'Mortal Conviction':
    'Auras reserve life. Only one non-banner aura can be active, but it reserves no mana.',
  'Wicked Ward':
    'Energy shield recharge is not interrupted by damage for a short time after starting.',
  'The Agnostic':
    'Constantly drains mana to recover life. Cannot have energy shield. Powerful life sustain.',
  'Glancing Blows':
    'Doubles block chance but blocked hits deal 65% of their damage.',
  'Eternal Youth':
    'Energy shield recharge applies to life, but energy shield has no recharge.',
  'Call to Arms':
    'Warcries are instant but have a shared cooldown. Smooths warcry rotation.',
  'Imbalanced Guard':
    'Armour applies to all hits but is capped at 50% damage reduction. Provides chaos/elemental mitigation.',
  'Supreme Ego':
    'Auras from skills are 50% more powerful but disable all non-banner auras from allies.',
  'Minion Instability':
    'Minions explode on reaching low life, dealing fire damage. Core for minion-bomb builds.',
  'Necromantic Aegis':
    'Shield bonuses apply to minions instead of you. Powerful with specific unique shields.',
  'Solipsism':
    'Mana-based defence. Intelligence provides no energy shield; all mana bonuses are increased.',
  'Lethe Shade':
    'Damage over time is reduced by 50% while energy shield is recharging.',
  'Doomsday':
    'Hex skills create a doom zone before applying. Hexes applied from zones have bonus damage.',
  'Pain Attunement':
    '30% more spell damage when on low life. Core for low-life builds using auras.',
  'Precise Technique':
    '40% more attack damage while accuracy is higher than max life. For non-crit accurate attackers.',
  'Elemental Equilibrium':
    'Hits that deal one element make the enemy resist that element but become weaker to others.',
  'Conduit':
    'Shares charges with nearby party members. Utility for party play.',
  'Hex Master':
    'Hexes have no doom limit but cannot gain doom. Simplifies curse application.',
  'Magebane':
    'Dexterity provides no evasion bonus. Accuracy rating is added to evasion rating instead.',
  'Versatile Combatant':
    'Attack block chance also applies to spells at 50% value.',
  'Wind Dancer':
    'Take less damage from the first hit after not being hit recently, more damage from subsequent hits.',
  'Divine Shield':
    'Recover energy shield equal to a portion of armour when you block or are hit.',
  'Ghost Dance':
    'Recover energy shield when hit. Ghost shrouds grant additional evasion.',
  'Keystone: Corrupted Soul':
    'Gain 20% of max life as extra energy shield. Life and ES take damage simultaneously.',
}

// ---- Ascendancy Descriptions -----------------------------------------------

const ASCENDANCY_DESCRIPTIONS: Record<string, string> = {
  // Duelist - Slayer
  'Headsman': 'Cannot take reflected physical damage and 20% more damage against bosses with full life',
  'Bane of Legends': 'Culling strike at 20% life and 20% more damage if you have killed recently',
  'Impact': 'Increased area of effect based on nearby enemies. Overrides melee splash.',
  'Overwhelm': 'Base critical strike chance is set to 8% for all attacks',
  // Duelist - Gladiator
  'Versatile Combatant': 'Attack block chance also applies to spell block at 50% value',
  'Blood in the Eyes': 'Blinded and maimed enemies take increased damage. Gladiator bleeds inflict maim.',
  'Gratuitous Violence': 'Bleeding enemies you kill explode, dealing area damage. Great for map clearing.',
  'Arena Challenger': 'Challenger charges grant more attack and movement speed while using a stance skill',
  // Duelist - Champion
  'Unstoppable Hero': 'Fortify grants attack speed, armour, evasion. Cannot be stunned while fortified.',
  'Fortitude': 'Permanent Fortify effect without needing to hit.',
  'Master of Metal': 'Impales you inflict last longer and deal more damage. Adds flat physical.',
  'Inspirational': 'Banner skills reserve no mana and have increased effect.',
  // Ranger - Deadeye
  'Gathering Winds': 'Grants Tailwind on hit, increasing action speed by 10%+ based on stacks',
  'Far Shot': 'Projectile damage increases with distance travelled',
  'Ricochet': 'Projectiles chain an additional time. Chaining does not reduce damage.',
  'Endless Munitions': 'Two additional projectiles and increased area of effect',
  'Focal Point': 'Marks you inflict are more effective and cannot be removed',
  // Ranger - Raider
  'Rapid Assault': 'Permanent Onslaught effect for 20% increased action speed',
  'Avatar of the Chase': 'Onslaught effect is doubled, granting 40% action speed',
  'Way of the Poacher': 'Generates frenzy charges on hit for sustained damage and speed',
  'Avatar of the Slaughter': 'Frenzy charges grant additional attack speed, movement speed, and evasion',
  'Quartz Infusion': 'Permanent Phasing for movement through enemies and spell suppression',
  'Avatar of the Veil': 'Exposure from hits and elemental ailment immunity while phasing',
  // Ranger - Pathfinder
  'Nature\'s Reprisal': 'Poison spreads to nearby enemies on kill. Increased chaos damage.',
  'Master Surgeon': 'Flasks gain charges when you crit. Life flask removes bleeding.',
  'Nature\'s Adrenaline': 'Movement speed and attack/cast speed while any flask is active',
  'Master Alchemist': 'Elemental ailment immunity during any flask effect',
  // Witch - Necromancer
  'Mistress of Sacrifice': 'Offerings also affect you at reduced value. Huge defensive and offensive boost.',
  'Mindless Aggression': 'Minions have increased movement, attack, and cast speed',
  'Unnatural Strength': 'Minion gems get +2 levels, massively boosting minion stats',
  'Bone Barrier': 'Grants Bone Armour skill. Minions have additional physical damage reduction.',
  // Witch - Occultist
  'Void Beacon': 'Nearby enemies have reduced resistances to cold and chaos damage',
  'Withering Presence': 'Applies Wither to nearby enemies and grants more chaos damage',
  'Profane Bloom': 'Cursed enemies you kill have a chance to explode. Excellent for clear.',
  'Malediction': 'Enemies affected by your curses have reduced damage and you gain increased damage per curse',
  // Witch - Elementalist
  'Shaper of Flames': 'All damage can ignite. Ignite damage based on highest element.',
  'Shaper of Storms': 'All damage can shock. Minimum shock effect of 15%.',
  'Heart of Destruction': 'More area and projectile damage against distant/nearby enemies',
  'Mastermind of Discord': 'Exposure applies a larger resistance penalty',
  'Bastion of Elements': 'Grants Primal Aegis that absorbs elemental damage',
  // Shadow - Assassin
  'Noxious Strike': 'Poisons deal damage faster and have increased duration',
  'Toxic Delivery': 'More damage with poison on crit. Recover ES on poison kill.',
  'Mistwalker': 'Elusive on crit with increased effect. Reduced damage taken while elusive.',
  'Opportunistic': 'More damage against enemies with no rare/unique allies nearby',
  // Shadow - Saboteur
  'Pyromaniac': 'Immune to ignite and shock. Regenerate life per active mine or trap.',
  'Born in the Shadows': 'Nearby enemies are blinded. Reduced damage taken from blinded enemies.',
  'Explosives Expert': 'Increased critical strike chance and AoE for traps and mines',
  'Perfect Crime': 'Increased trap/mine damage per active trap/mine',
  // Shadow - Trickster
  'Polymath': 'More damage per different mastery type allocated in the passive tree',
  'Heartstopper': 'Alternates between preventing hit damage and DoT damage over time',
  'Soul Drinker': 'Energy shield leech from non-damage. Overleech for energy shield.',
  'One Step Ahead': 'Action speed minimum of 108%. Enemies near you cannot have action speed above base.',
  // Templar - Inquisitor
  'Inevitable Judgement': 'Critical strikes ignore enemy elemental resistances entirely',
  'Augury of Penitence': 'Nearby enemies deal less damage and take increased elemental damage',
  'Righteous Providence': 'Strength and intelligence provide increased crit chance and multiplier',
  'Sanctuary': 'Consecrated ground grants life regen, increased damage, and crit to you',
  // Templar - Hierophant
  'Pursuit of Faith': 'Totems have increased placement speed and grant power charges',
  'Ritual of Awakening': 'Can summon two additional totems with increased placement speed',
  'Conviction of Power': 'Generates endurance and power charges. Minimum of 4 of each.',
  'Divine Guidance': 'Transfiguration of mind: increases to mana also apply to damage at 30%',
  // Templar - Guardian
  'Radiant Crusade': 'Nearby allies and you deal more damage while you have a sentinel',
  'Unwavering Crusade': 'Sentinels grant allies Onslaught and Intimidate',
  'Bastion of Hope': 'Grants block chance periodically. Cannot be stunned while at max block.',
  'Time of Need': 'Periodically regenerates life and removes ailments and curses',
  // Marauder - Juggernaut
  'Unbreakable': 'Armour is doubled from body armour. Regenerate life based on armour.',
  'Unstoppable': 'Cannot be slowed below base speed. Immune to stun.',
  'Unyielding': 'More damage per endurance charge. Endurance charges grant bonus to melee damage.',
  'Undeniable': 'Accuracy provides attack speed. Massive accuracy and speed scaling.',
  // Marauder - Berserker
  'Blitz': 'More attack speed from Blitz charges on crit. Reduces crit chance per charge.',
  'Rite of Ruin': 'Triples rage effect but causes rage to drain over time',
  'Flawless Savagery': 'More physical damage and crit multiplier. Added physical damage.',
  'Aspect of Carnage': '40% more damage taken and 40% more damage dealt. Glass cannon.',
  // Marauder - Chieftain
  'Ngamahu, Flame\'s Advance': 'Periodically gain a buff adding fire damage as extra',
  'Hinekora, Death\'s Fury': 'Leech from fire damage. Covered in ash on hit.',
  'Tasalio, Cleansing Water': 'Life regen. Fire damage resistance. Removes ignite.',
  'Ramako, Sun\'s Light': 'Chance to ignite and increased fire damage. Penetrate fire resistance.',
  // Scion - Ascendant
  'Path of the Marauder': 'Strength and access to Marauder starting area',
  'Path of the Ranger': 'Dexterity and access to Ranger starting area',
  'Path of the Witch': 'Intelligence and access to Witch starting area',
}

// ---- Unique Item Descriptions (50+ entries) --------------------------------

const UNIQUE_DESCRIPTIONS: Record<string, string> = {
  'Headhunter': 'Steals rare monster mods on kill, providing massive temporary buffs in mapping',
  'Mageblood': 'Makes 4 magic flasks permanent, providing constant stat boosts',
  "Hyrri's Truth": 'Grants high-level Precision aura and adds flat cold damage to attacks',
  'The Fledgling': 'Alternates between increased projectile speed and additional projectile',
  'Cinderswallow Urn': 'Flask that recovers ES/Life/Mana on kill and makes enemies take increased damage',
  "Ashes of the Stars": 'Grants +1 to all skill gem levels, 20% quality to all skills, and reserves less mana',
  "Crystallised Omniscience": 'Converts all attributes to Omniscience, which provides elemental penetration',
  'Nimis': 'Projectiles return to you. Doubles hits on large targets.',
  'Original Sin': 'All elemental damage is converted to chaos. Chaos damage ignores resistances.',
  'Bottled Faith': 'Creates consecrated ground, enemies take increased damage and you have higher crit',
  'Dying Sun': 'Adds two extra projectiles during flask effect and increases area',
  "Taste of Hate": 'Converts physical damage to cold and grants physical damage reduction',
  "Hyrri's Ire": 'Large flat cold damage to attacks, spell suppression, and evasion',
  "Kaom's Heart": 'Massive life bonus (+500) with no sockets. Pure life-stacking chest.',
  "Shavronne's Wrappings": 'Chaos damage does not bypass energy shield. Core for low-life builds.',
  'Aegis Aurora': 'Recovers energy shield on block equal to 2% of armour. Core for block tanks.',
  "Prism Guardian": 'Socketed auras reserve life instead of mana. Enables extra aura stacking.',
  "The Brass Dome": 'No extra damage from critical strikes. Massive armour.',
  "Replica Farrul's Fur": 'Grants Frenzy and Power charges periodically via Aspect of the Cat',
  "Farrul's Fur": 'Grants Frenzy and Power charges when Aspect of the Cat changes form',
  'Badge of the Brotherhood': 'Maximum frenzy charges equal power charges. Elusive effect scaling.',
  'Forbidden Flame': 'Paired with Forbidden Flesh, grants an ascendancy notable from another class',
  'Forbidden Flesh': 'Paired with Forbidden Flame, grants an ascendancy notable from another class',
  'Watcher\'s Eye': 'Grants powerful bonuses while affected by specific auras',
  'Unnatural Instinct': 'Grants all minor passive stats in radius without allocating them',
  'Thread of Hope': 'Allocate passives in a ring without connecting to your tree',
  'Militant Faith': 'Converts keystones and passives in radius. Grants Devotion bonuses.',
  'Brutal Restraint': 'Replaces notable passives in radius with random Maraketh modifiers',
  'Elegant Hubris': 'Replaces passives in radius with random Eternal Empire modifiers',
  'Glorious Vanity': 'Replaces passives in radius with random Vaal modifiers',
  'Lethal Pride': 'Adds random Karui modifiers to notable passives in radius',
  'The Squire': 'Supports socketed skills with all support gems in your off-hand',
  'Malachai\'s Loop': 'Gains power charges, then discharges them for a burst at max',
  'Cospri\'s Malice': 'Triggers socketed cold spells on melee critical strike',
  'Mjolner': 'Triggers socketed lightning spells on melee hit',
  'The Saviour': 'Creates mirage warriors that copy your attacks on crit',
  'Replica Alberon\'s Warpath': 'Adds chaos damage to attacks per 50 strength',
  'Crown of the Inward Eye': 'Transfiguration of soul, body, and mind. Huge offensive and defensive bonuses.',
  'Impossible Escape': 'Allocate passives in radius of a keystone without connecting',
  "Maw of Mischief": 'Grants Death Wish skill that explodes your minions as a damage source',
  'Doryani\'s Prototype': 'Lightning resistance of enemies matches yours. Requires negative lightning res.',
  "Ivory Tower": 'Chaos damage taken from mana before life while on low life. ES body armour.',
  "Replica Shroud of the Lightless": 'Socketed gems gain elemental penetration per abyss socket',
  'Arn\'s Anguish': 'Endurance charges are converted to Brutal charges for more physical damage',
  'Dissolution of the Flesh': 'Damage taken is reserved as life instead. Life pool acts as a buffer.',
  'Melding of the Flesh': 'Maximum elemental resistances are merged to the highest value',
  'Skin of the Loyal': 'Socketed gems are supported by level 1 global defences and +1 to all gem levels',
  'Skin of the Lords': 'Socketed gems cannot be modified. Grants a random keystone.',
  'Asenath\'s Gentle Touch': 'Cursed enemies explode on death. Temporal chains on hit.',
  'Hands of the High Templar': 'Corrupted implicit gloves with up to 5 implicits. Extremely variable.',
  'Voices': 'Large cluster base with up to 3 jewel sockets and variable passives',
  'Split Personality': 'Grants two stats that scale with distance from starting point on tree',
  'Rational Doctrine': 'Consecrated ground effect or profane ground based on stat ratio',
}

// ---- Aura / Herald / Curse / Guard / Buff classification -------------------

const AURA_GEMS = new Set([
  'Hatred', 'Wrath', 'Anger', 'Grace', 'Determination', 'Discipline',
  'Haste', 'Purity of Elements', 'Purity of Fire', 'Purity of Ice',
  'Purity of Lightning', 'Vitality', 'Clarity', 'Precision', 'Malevolence',
  'Zealotry', 'Pride', 'Defiance Banner', 'Dread Banner', 'War Banner',
  'Petrified Blood', 'Tempest Shield', 'Arctic Armour',
])

const HERALD_GEMS = new Set([
  'Herald of Ash', 'Herald of Ice', 'Herald of Thunder',
  'Herald of Purity', 'Herald of Agony',
])

const CURSE_GEMS = new Set([
  "Sniper's Mark", "Assassin's Mark", "Warlord's Mark", 'Elemental Weakness',
  'Vulnerability', 'Despair', 'Enfeeble', 'Temporal Chains',
  'Conductivity', 'Frostbite', 'Flammability', "Poacher's Mark",
  'Punishment', 'Projectile Weakness',
])

const GUARD_GEMS = new Set([
  'Steelskin', 'Immortal Call', 'Molten Shell', 'Vaal Molten Shell',
  'Bone Armour',
])

const BUFF_GEMS = new Set([
  'Blood Rage', 'Berserk', 'Vaal Haste', 'Vaal Grace',
  'Vaal Discipline', 'Vaal Impurity of Fire', 'Vaal Impurity of Ice',
  'Vaal Impurity of Lightning', 'Righteous Fire', 'Wave of Conviction',
  'Plague Bearer', 'Withering Step', 'Phase Run', 'Dash',
  'Flame Dash', 'Frostblink', 'Frost Shield', 'Ancestral Protector',
  'Ancestral Warchief', 'Vaal Ancestral Warchief',
])

// ---- Minion-related skill names --------------------------------------------

const MINION_SKILLS = new Set([
  'Raise Zombie', 'Summon Raging Spirit', 'Raise Spectre',
  'Summon Skeletons', 'Vaal Summon Skeletons', 'Summon Carrion Golem',
  'Summon Stone Golem', 'Summon Flame Golem', 'Summon Ice Golem',
  'Summon Lightning Golem', 'Summon Chaos Golem', 'Animate Weapon',
  'Animate Guardian', 'Dominating Blow', 'Herald of Purity',
  'Absolution', 'Summon Reaper', 'Summon Holy Relic',
  'Arakaali\'s Fang', 'Soulwrest',
])

// ===========================================================================
// 1. classifyBuild
// ===========================================================================

export function classifyBuild(
  synergy: SynergyData,
  stats: BuildStats,
  info: BuildInfo,
  skills: SkillGroup[],
  breakdown?: BreakdownData,
): BuildIdentity {
  const flags = synergy.skillFlags.map((f) => f.toLowerCase())
  const keystones = synergy.keystones.map((k) => k.toLowerCase())

  // --- Attack vs Spell ---
  const isAttack = flags.includes('attack')
  const isSpell = flags.includes('spell')

  // --- Melee vs Ranged ---
  const isMelee = flags.includes('melee')
  const isProjectile = flags.includes('projectile')
  const isBow = flags.includes('bow')
  const isWand = flags.includes('wand')
  const isRanged = isProjectile || isBow || isWand

  // --- Crit ---
  const critChance = stats.CritChance ?? 0
  const isCrit = critChance > 40

  // --- DoT ---
  const totalDotDps = stats.TotalDotDPS ?? stats.TotalDot ?? 0
  const totalHitDps = stats.TotalDPS ?? 0
  const isDoT = totalDotDps > totalHitDps * 0.5 && totalDotDps > 0

  // --- Summoner ---
  const isSummoner = synergy.activeSkills.some(
    (s) => MINION_SKILLS.has(s.name) || s.name.toLowerCase().includes('minion'),
  )

  // --- Totem / Mine / Trap ---
  const isTotem =
    flags.includes('totem') ||
    synergy.supports.some((s) => s.toLowerCase().includes('totem'))
  const isMine =
    flags.includes('mine') ||
    synergy.supports.some((s) => s.toLowerCase().includes('mine'))
  const isTrap =
    flags.includes('trap') ||
    synergy.supports.some((s) => s.toLowerCase().includes('trap'))

  // --- Defense model ---
  const hasCI = keystones.includes('chaos inoculation')
  const hasMoM = keystones.includes('mind over matter') || keystones.includes('mindovermatter')
  const hasPainAttunement = keystones.includes('pain attunement')
  const life = stats.Life ?? 0
  const es = stats.EnergyShield ?? 0
  let defenseModel: string
  if (hasCI) {
    defenseModel = 'CI'
  } else if (hasPainAttunement && es > 0) {
    defenseModel = 'Low Life'
  } else if (life > 0 && es > life) {
    defenseModel = 'Hybrid'
  } else if (hasMoM) {
    defenseModel = 'MoM'
  } else {
    defenseModel = 'Life'
  }

  // --- Damage profile ---
  const damageProfile: Record<string, number> = {}
  if (breakdown?.damageTypes) {
    let totalHit = 0
    for (const [type, data] of Object.entries(breakdown.damageTypes)) {
      const avg = data.hitAverage ?? 0
      if (avg > 0) {
        damageProfile[type] = avg
        totalHit += avg
      }
    }
    if (totalHit > 0) {
      for (const type of Object.keys(damageProfile)) {
        damageProfile[type] = Math.round((damageProfile[type] / totalHit) * 100) / 100
      }
    }
  }

  // --- Playstyle tags ---
  const playstyleTags: string[] = []
  if (isRanged) playstyleTags.push('Ranged')
  if (isMelee) playstyleTags.push('Melee')
  if (isProjectile) playstyleTags.push('Projectile')
  if (isBow) playstyleTags.push('Bow')
  if (isWand) playstyleTags.push('Wand')
  if (isCrit) playstyleTags.push('Crit')
  if (isDoT) playstyleTags.push('DoT')
  if (isSummoner) playstyleTags.push('Summoner')
  if (isTotem) playstyleTags.push('Totem')
  if (isMine) playstyleTags.push('Mine')
  if (isTrap) playstyleTags.push('Trap')
  playstyleTags.push(`${defenseModel}-based`)

  // --- Archetype string ---
  const archParts: string[] = []
  if (isCrit && !isDoT) archParts.push('Crit')
  if (isDoT) archParts.push('DoT')
  if (isSummoner) {
    archParts.push('Summoner')
  } else if (isTotem) {
    archParts.push('Totem')
  } else if (isMine) {
    archParts.push('Mine')
  } else if (isTrap) {
    archParts.push('Trap')
  } else if (isBow) {
    archParts.push('Bow')
  } else if (isWand) {
    archParts.push('Wand')
  } else if (isMelee) {
    archParts.push('Melee')
  }
  if (isAttack && !isSummoner) archParts.push('Attack')
  if (isSpell && !isSummoner) archParts.push('Spell Caster')
  if (archParts.length === 0) archParts.push('Build')
  const archetype = archParts.join(' ')

  // --- Main skill ---
  const mainSkill =
    breakdown?.skillName ??
    stats.SkillName ??
    findMainSkill(skills) ??
    'Unknown'

  // --- Ascendancy ---
  const ascendancy = info.ascendClassName ?? synergy.ascendancy?.ascendClassName ?? ''

  // --- Full title ---
  const fullTitle = `${archetype} — ${mainSkill} ${ascendancy}`.trim()

  // --- Key mechanics ---
  const keyMechanics: string[] = []
  for (const ks of synergy.keystones) {
    const desc = KEYSTONE_DESCRIPTIONS[ks]
    if (desc) keyMechanics.push(`${ks}: ${desc}`)
  }
  if (isCrit) {
    keyMechanics.push(
      `High critical strike chance (${critChance.toFixed(1)}%) with ${(stats.CritMultiplier ?? 0).toFixed(0)}% multiplier`,
    )
  }
  if (isDoT) {
    keyMechanics.push(
      `Damage over time is a major portion of DPS (${Math.round(totalDotDps).toLocaleString()} DoT DPS)`,
    )
  }
  if (isSummoner) {
    keyMechanics.push('Minions deal the majority of damage while you stay safe')
  }

  return {
    archetype,
    mainSkill,
    ascendancy,
    fullTitle,
    damageProfile,
    playstyleTags,
    defenseModel,
    keyMechanics,
  }
}

// ===========================================================================
// 2. explainBuild
// ===========================================================================

export function explainBuild(
  synergy: SynergyData,
  skills: SkillGroup[],
  breakdownData?: BreakdownData,
): HowItWorks {
  // --- Main skill identification ---
  const mainSkillName =
    breakdownData?.skillName ?? findMainSkill(skills) ?? 'Unknown'

  const mainExplanation = buildMainSkillExplanation(mainSkillName, synergy, breakdownData)
  const scaling = deriveScalingTags(synergy, breakdownData)

  // --- Supports on main skill ---
  const mainGroup = findMainGroup(skills)
  const supports: HowItWorks['supports'] = []
  if (mainGroup) {
    for (const gem of mainGroup.gems) {
      if (!gem.enabled) continue
      if (gem.isSupport || isSupportGem(gem.nameSpec)) {
        const cleanName = cleanSupportName(gem.nameSpec)
        const desc = lookupSupport(cleanName)
        supports.push({
          name: cleanName,
          role: desc?.role ?? 'Provides scaling or utility for the linked skill',
          color: gem.color ?? 0,
        })
      }
    }
  }

  // --- Key items (uniques, deduped) ---
  const seenItems = new Set<string>()
  const keyItems: HowItWorks['keyItems'] = []
  for (const u of synergy.uniques) {
    // Extract title (before comma) for lookup and dedup: "Headhunter, Leather Belt" → "Headhunter"
    const title = u.name.includes(',') ? u.name.split(',')[0].trim() : u.name
    if (seenItems.has(title)) continue
    seenItems.add(title)
    const desc = UNIQUE_ITEM_DB[title] ?? UNIQUE_ITEM_DB[u.name] ?? UNIQUE_DESCRIPTIONS[title] ?? UNIQUE_DESCRIPTIONS[u.name] ?? `Unique ${u.base} providing build-specific benefits`
    keyItems.push({ name: u.name, role: desc })
  }

  // --- Key nodes (keystones) ---
  const keyNodes: HowItWorks['keyNodes'] = synergy.keystones.map((ks) => ({
    name: ks,
    type: 'keystone',
    role: KEYSTONE_DESCRIPTIONS[ks] ?? 'Keystone passive that fundamentally changes how the build functions',
  }))

  // --- Auras / Heralds / Curses / Guards / Buffs ---
  const auras: HowItWorks['auras'] = []
  const seen = new Set<string>()
  for (const group of skills) {
    if (!group.enabled) continue
    for (const gem of group.gems) {
      if (!gem.enabled || seen.has(gem.nameSpec)) continue
      const classification = classifyAuraGem(gem.nameSpec)
      if (classification) {
        seen.add(gem.nameSpec)
        auras.push({
          name: gem.nameSpec,
          type: classification,
          effect: describeAuraEffect(gem.nameSpec, classification),
        })
      }
    }
  }

  return {
    mainSkill: { name: mainSkillName, explanation: mainExplanation, scaling },
    supports,
    keyItems,
    keyNodes,
    auras,
  }
}

// ===========================================================================
// 3. deriveScaling
// ===========================================================================

export function deriveScaling(
  breakdownData: BreakdownData,
  stats: BuildStats,
): ScalingPriority[] {
  const priorities: ScalingPriority[] = []
  let rank = 0

  const combinedDps = breakdownData.combinedDps || breakdownData.totalDps || 0
  if (combinedDps <= 0) return []

  // --- Analyse damage components ---
  let totalBase = 0
  let totalInc = 0
  let totalMore = 0
  let typeCount = 0
  for (const data of Object.values(breakdownData.damageTypes)) {
    const avg = data.hitAverage ?? 0
    if (avg <= 0) continue
    totalBase += (data.baseMin + data.baseMax) / 2
    totalInc += data.incTotal ?? 0
    totalMore += data.moreTotal ?? 0
    typeCount++
  }
  const avgInc = typeCount > 0 ? totalInc / typeCount : 0
  const avgMore = typeCount > 0 ? totalMore / typeCount : 0

  const critChance = stats.CritChance ?? 0
  const critMulti = stats.CritMultiplier ?? 0
  const isCrit = critChance > 40
  const isLife = !isCIBuild(stats)
  const isES = (stats.EnergyShield ?? 0) > (stats.Life ?? 0)

  // --- Flat base damage ---
  if (totalBase < combinedDps * 0.01) {
    priorities.push({
      rank: ++rank,
      stat: 'FlatDamage',
      displayName: 'Flat Added Damage',
      importance: 'critical',
      reason: 'Base damage is very low relative to total DPS. Adding flat damage has an outsized effect.',
      gearMods: [
        'Adds # to # physical/elemental/chaos damage',
        'Flat damage on rings, amulet, gloves, abyss jewels',
      ],
    })
  } else if (totalBase < combinedDps * 0.05) {
    priorities.push({
      rank: ++rank,
      stat: 'FlatDamage',
      displayName: 'Flat Added Damage',
      importance: 'high',
      reason: 'Base damage is relatively low. Flat damage sources will scale well.',
      gearMods: [
        'Adds # to # damage on rings, amulet',
        'Abyss jewels with flat damage',
      ],
    })
  }

  // --- Increased damage ---
  if (avgInc < 200) {
    priorities.push({
      rank: ++rank,
      stat: 'IncreasedDamage',
      displayName: '% Increased Damage',
      importance: avgInc < 100 ? 'critical' : 'high',
      reason: `Total increased damage is only ${Math.round(avgInc)}%. Each point of increased has diminishing returns so low totals benefit most.`,
      gearMods: [
        '% increased elemental/physical/spell damage on weapons',
        '% increased damage on amulet, jewels',
      ],
    })
  } else if (avgInc < 400) {
    priorities.push({
      rank: ++rank,
      stat: 'IncreasedDamage',
      displayName: '% Increased Damage',
      importance: 'medium',
      reason: `Increased damage is at ${Math.round(avgInc)}%. Additional sources still help but with diminishing returns.`,
      gearMods: ['% increased damage on jewels and cluster jewels'],
    })
  }

  // --- More multipliers ---
  if (avgMore < 300) {
    priorities.push({
      rank: ++rank,
      stat: 'MoreMultiplier',
      displayName: 'More Damage Multipliers',
      importance: avgMore < 150 ? 'high' : 'medium',
      reason: `More multipliers stack multiplicatively and total ${Math.round(avgMore)}%. Additional support gems or ascendancy nodes with "more" are very powerful.`,
      gearMods: [
        'Support gems with more multipliers',
        'Cluster jewels with damage notables',
      ],
    })
  }

  // --- Crit chance ---
  if (isCrit && critChance < 80) {
    priorities.push({
      rank: ++rank,
      stat: 'CritChance',
      displayName: 'Critical Strike Chance',
      importance: critChance < 50 ? 'high' : 'medium',
      reason: `Crit chance is ${critChance.toFixed(1)}%. Reaching closer to 100% means more consistent crit damage.`,
      gearMods: [
        '% increased critical strike chance on weapons, gloves',
        'Global crit on amulet, jewels',
        'Precision aura or Increased Critical Strikes support',
      ],
    })
  }

  // --- Crit multiplier ---
  if (isCrit && critMulti < 400) {
    priorities.push({
      rank: ++rank,
      stat: 'CritMultiplier',
      displayName: 'Critical Strike Multiplier',
      importance: critMulti < 250 ? 'high' : 'medium',
      reason: `Crit multiplier is ${critMulti.toFixed(0)}%. Each point of multiplier directly scales your crit hits.`,
      gearMods: [
        'Critical strike multiplier on amulet, rings, jewels',
        'Weapon crit multi',
      ],
    })
  }

  // --- Attack / cast speed ---
  const speed = stats.Speed ?? 0
  priorities.push({
    rank: ++rank,
    stat: 'Speed',
    displayName: 'Attack / Cast Speed',
    importance: speed < 3 ? 'high' : 'medium',
    reason: `Speed is a direct multiplier on DPS. Current rate is ${speed.toFixed(2)} actions per second.`,
    gearMods: [
      '% increased attack/cast speed on weapons, gloves, jewels',
      'Onslaught, Tailwind, or frenzy charges',
    ],
  })

  // --- Survivability: Life or ES ---
  if (isLife || (!isES && (stats.Life ?? 0) > 0)) {
    const life = stats.Life ?? 0
    priorities.push({
      rank: ++rank,
      stat: 'MaxLife',
      displayName: 'Maximum Life',
      importance: life < 4000 ? 'critical' : life < 5500 ? 'high' : 'medium',
      reason: `Maximum life is ${Math.round(life).toLocaleString()}. Higher life pool means surviving bigger hits.`,
      gearMods: [
        '+ to maximum life on every gear piece',
        '% increased maximum life on tree and jewels',
        'Strength (every 10 STR = 5 life)',
      ],
    })
  }

  if (isES) {
    const esVal = stats.EnergyShield ?? 0
    priorities.push({
      rank: ++rank,
      stat: 'EnergyShield',
      displayName: 'Energy Shield',
      importance: esVal < 6000 ? 'critical' : esVal < 10000 ? 'high' : 'medium',
      reason: `Energy shield is ${Math.round(esVal).toLocaleString()}. ES is your primary health pool.`,
      gearMods: [
        '+ to maximum energy shield on gear',
        '% increased energy shield on tree and gear',
        'Intelligence (every 10 INT = 2 ES)',
        'ES recharge rate and recovery',
      ],
    })
  }

  // --- Resistances (always important) ---
  priorities.push({
    rank: ++rank,
    stat: 'Resistances',
    displayName: 'Elemental Resistances',
    importance: 'high',
    reason: 'Capping fire, cold, and lightning resistance at 75% is mandatory for endgame content.',
    gearMods: [
      '% fire/cold/lightning resistance on every gear piece',
      'Purity auras if needed',
      'Bismuth flask as temporary fix',
    ],
  })

  // --- Accuracy (attack builds) ---
  const hitChance = stats.HitChance ?? 100
  if (hitChance < 100 && hitChance > 0) {
    priorities.push({
      rank: ++rank,
      stat: 'Accuracy',
      displayName: 'Accuracy / Hit Chance',
      importance: hitChance < 90 ? 'high' : 'medium',
      reason: `Hit chance is ${hitChance.toFixed(1)}%. Missing attacks is a direct DPS loss.`,
      gearMods: [
        '+ to accuracy rating on rings, gloves, helmet',
        'Precision aura',
        'Dexterity (provides accuracy)',
      ],
    })
  }

  return priorities
}

// ===========================================================================
// Internal helpers
// ===========================================================================

function findMainSkill(skills: SkillGroup[]): string | undefined {
  for (const group of skills) {
    if (!group.enabled || !group.gems) continue
    for (const gem of group.gems) {
      if (gem.enabled && !gem.isSupport && !isSupportGem(gem.nameSpec) && !isAuraOrUtility(gem.nameSpec)) {
        return gem.nameSpec
      }
    }
  }
  return undefined
}

function findMainGroup(skills: SkillGroup[]): SkillGroup | undefined {
  // Find the group with the most support gems (likely the 6-link)
  let best: SkillGroup | undefined
  let bestCount = 0
  for (const group of skills) {
    if (!group.enabled) continue
    const supportCount = group.gems.filter(
      (g) => g.enabled && (g.isSupport || isSupportGem(g.nameSpec)),
    ).length
    if (supportCount > bestCount) {
      bestCount = supportCount
      best = group
    }
  }
  return best
}

function isSupportGem(name: string): boolean {
  const lower = name.toLowerCase()
  if (lower.includes('support')) return true
  // Check if it's in the support descriptions table
  return lookupSupport(name) !== undefined
}

function isAuraOrUtility(name: string): boolean {
  return (
    AURA_GEMS.has(name) ||
    HERALD_GEMS.has(name) ||
    CURSE_GEMS.has(name) ||
    GUARD_GEMS.has(name) ||
    BUFF_GEMS.has(name)
  )
}

function cleanSupportName(name: string): string {
  return name
    .replace(/\s*Support\s*$/i, '')
    .replace(/^Awakened\s+/, 'Awakened ')
    .trim()
}

function lookupSupport(name: string): { role: string; category: string } | undefined {
  // Try exact match
  if (SUPPORT_DESCRIPTIONS[name]) return SUPPORT_DESCRIPTIONS[name]
  // Try with "Support" suffix stripped
  const cleaned = name.replace(/\s*Support\s*$/i, '').trim()
  if (SUPPORT_DESCRIPTIONS[cleaned]) return SUPPORT_DESCRIPTIONS[cleaned]
  // Try case-insensitive
  const lower = cleaned.toLowerCase()
  for (const [key, val] of Object.entries(SUPPORT_DESCRIPTIONS)) {
    if (key.toLowerCase() === lower) return val
  }
  return undefined
}

function classifyAuraGem(name: string): 'aura' | 'herald' | 'curse' | 'guard' | 'buff' | undefined {
  if (AURA_GEMS.has(name)) return 'aura'
  if (HERALD_GEMS.has(name)) return 'herald'
  if (CURSE_GEMS.has(name)) return 'curse'
  if (GUARD_GEMS.has(name)) return 'guard'
  if (BUFF_GEMS.has(name)) return 'buff'
  // Check for Vaal variants
  const nonVaal = name.replace(/^Vaal\s+/, '')
  if (AURA_GEMS.has(nonVaal)) return 'aura'
  if (HERALD_GEMS.has(nonVaal)) return 'herald'
  return undefined
}

function describeAuraEffect(name: string, type: 'aura' | 'herald' | 'curse' | 'guard' | 'buff'): string {
  const AURA_EFFECTS: Record<string, string> = {
    'Hatred': 'Adds cold damage based on physical damage and grants cold damage to nearby allies',
    'Wrath': 'Adds lightning damage to attacks and spells for you and allies',
    'Anger': 'Adds fire damage to attacks and spells for you and allies',
    'Grace': 'Grants a large amount of flat evasion rating to you and allies',
    'Determination': 'Grants a large amount of flat armour to you and allies',
    'Discipline': 'Grants flat energy shield to you and allies',
    'Haste': 'Increases attack speed, cast speed, and movement speed for you and allies',
    'Purity of Elements': 'Grants elemental resistances and immunity to elemental ailments',
    'Purity of Fire': 'Increases fire resistance and maximum fire resistance',
    'Purity of Ice': 'Increases cold resistance and maximum cold resistance',
    'Purity of Lightning': 'Increases lightning resistance and maximum lightning resistance',
    'Vitality': 'Grants life regeneration per second to you and allies',
    'Clarity': 'Grants mana regeneration per second to you and allies',
    'Precision': 'Grants accuracy rating and critical strike chance',
    'Malevolence': 'Increases skill effect duration and damage over time',
    'Zealotry': 'Grants more spell damage and creates consecrated ground',
    'Pride': 'Nearby enemies take increased physical damage, escalating over time',
    'Defiance Banner': 'Reduces enemy crit chance and grants armour and evasion',
    'Dread Banner': 'Grants chance to impale and reduces enemy accuracy',
    'War Banner': 'Increases accuracy and grants physical damage per nearby enemy',
    'Petrified Blood': 'Prevents part of life loss from hits. Enables low-life without ES.',
    'Tempest Shield': 'Grants spell block chance and shocks enemies on block',
    'Arctic Armour': 'Reduces fire and physical damage taken while stationary',
    'Herald of Ash': 'Adds fire damage based on physical and burns enemies around killed targets',
    'Herald of Ice': 'Adds cold damage to attacks and spells, shatters frozen enemies in an explosion',
    'Herald of Thunder': 'Adds lightning damage and calls down lightning on shocked enemies',
    'Herald of Purity': 'Adds physical damage and summons Sentinels of Purity on kill',
    'Herald of Agony': 'Summons an Agony Crawler minion that grows stronger with Virulence stacks',
    "Sniper's Mark": 'Marked enemy takes increased projectile damage and projectiles split on hitting it',
    "Assassin's Mark": 'Marked enemy grants power charges on kill and takes extra crit damage',
    "Warlord's Mark": 'Marked enemy grants endurance charges and provides leech',
    'Elemental Weakness': 'Cursed enemies have reduced elemental resistances',
    'Vulnerability': 'Cursed enemies take increased physical damage and DoT',
    'Despair': 'Cursed enemies have reduced chaos resistance and take increased DoT',
    'Enfeeble': 'Cursed enemies deal less damage and have reduced accuracy and crit',
    'Temporal Chains': 'Cursed enemies act slower, extending debuff durations on them',
    'Conductivity': 'Cursed enemies have reduced lightning resistance',
    'Frostbite': 'Cursed enemies have reduced cold resistance',
    'Flammability': 'Cursed enemies have reduced fire resistance',
    "Poacher's Mark": 'Marked enemy grants frenzy charges and life/mana on hit',
    'Steelskin': 'Absorbs a portion of incoming damage for a short duration',
    'Immortal Call': 'Brief physical and elemental damage immunity, consumes endurance charges',
    'Molten Shell': 'Absorbs damage based on armour value. Stronger with more armour.',
    'Vaal Molten Shell': 'Much larger damage absorption based on armour. Powerful defensive cooldown.',
    'Blood Rage': 'Grants attack speed, frenzy charges on kill, and life leech at the cost of life degen',
    'Berserk': 'Consumes rage for more damage, attack speed, and movement speed',
    'Vaal Haste': 'Temporary massive boost to attack, cast, and movement speed',
    'Vaal Grace': 'Temporary large amount of spell and attack dodge chance',
    'Righteous Fire': 'Burns nearby enemies and grants more spell damage at the cost of life degen',
  }

  return AURA_EFFECTS[name] ?? `${capitalize(type)} skill providing ${type === 'curse' ? 'a debuff on enemies' : type === 'guard' ? 'damage mitigation' : 'a beneficial effect'}`
}

function buildMainSkillExplanation(
  skillName: string,
  synergy: SynergyData,
  breakdown?: BreakdownData,
): string {
  const parts: string[] = []
  parts.push(`${skillName} is the primary damage-dealing skill in this build.`)

  // Describe damage composition
  if (breakdown?.damageTypes) {
    const types = Object.entries(breakdown.damageTypes)
      .filter(([, d]) => (d.hitAverage ?? 0) > 0)
      .sort(([, a], [, b]) => (b.hitAverage ?? 0) - (a.hitAverage ?? 0))
    if (types.length > 0) {
      const dominant = types[0][0]
      if (types.length === 1) {
        parts.push(`It deals purely ${dominant} damage.`)
      } else {
        const secondary = types.slice(1).map(([t]) => t).join(', ')
        parts.push(`It primarily deals ${dominant} damage with secondary ${secondary} components.`)
      }
    }
  }

  // Mention relevant keystones
  const relevantKeystones = synergy.keystones.filter((k) => KEYSTONE_DESCRIPTIONS[k])
  if (relevantKeystones.length > 0) {
    parts.push(
      `The build uses ${relevantKeystones.join(', ')} to shape how damage is dealt and scaled.`,
    )
  }

  return parts.join(' ')
}

function deriveScalingTags(synergy: SynergyData, breakdown?: BreakdownData): string[] {
  const tags: string[] = []

  if (breakdown?.damageTypes) {
    for (const [type, data] of Object.entries(breakdown.damageTypes)) {
      if ((data.hitAverage ?? 0) > 0) {
        tags.push(`${type} damage`)
      }
    }
  }

  const flags = synergy.skillFlags.map((f) => f.toLowerCase())
  if (flags.includes('attack')) tags.push('Attack damage')
  if (flags.includes('spell')) tags.push('Spell damage')
  if (flags.includes('projectile')) tags.push('Projectile damage')
  if (flags.includes('area')) tags.push('Area damage')

  if ((synergy.stats['CritChance'] ?? 0) > 40) {
    tags.push('Critical strikes')
  }

  return tags
}

function isCIBuild(stats: BuildStats): boolean {
  // CI builds have 1 life
  return (stats.Life ?? 0) <= 1 && (stats.EnergyShield ?? 0) > 0
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
