/**
 * Comprehensive Path of Exile Unique Item Description Database
 *
 * Each entry maps an item name to a 1-2 sentence mechanical description
 * of what the item does for a build. Organized by slot type.
 *
 * 300+ items covering all major categories.
 */

export const UNIQUE_ITEM_DB: Record<string, string> = {

  // ---------------------------------------------------------------------------
  // BELTS
  // ---------------------------------------------------------------------------

  'Headhunter': 'Steals rare monster mods on kill for 20 seconds, providing massive temporary buffs including extra damage, speed, and size. The most powerful mapping belt in the game.',
  'Mageblood': 'Makes four magic utility flasks permanent with no need to recharge, providing constant defensive and offensive flask bonuses. Enables extreme flask-stacking builds.',
  'Darkness Enthroned': 'Socketed abyss jewels have 75% increased effect, making it a massive stat stick when paired with well-rolled abyss jewels.',
  "Ryslatha's Coil": 'Increases the maximum and decreases the minimum of attack damage rolls, dramatically boosting high-end hit damage. Best-in-slot for many attack builds that scale big hits.',
  "Bisco's Leash": 'Grants Rampage on kill, providing escalating movement speed and damage bonuses as you chain kills. Great for fast mapping.',
  'Soul Tether': 'Grants Energy Shield leech and allows ES leech to continue to recharge, effectively giving life-based builds an extra overleech layer via ES.',
  'Prismweave': 'Adds flat elemental damage to attacks and provides elemental resistances. Strong budget belt for elemental attack builds.',
  "Bisco's Collar": 'Grants massive increased quantity and rarity of items found from normal monsters. A premier magic-find belt.',
  'The Retch': 'Deals chaos damage to enemies based on life leech rate, turning high leech into an offensive mechanic. Synergizes with Slayer overleech.',
  'Auxium': 'Chill and freeze duration on you are based on energy shield instead of life, and provides flask charge generation. Useful for ES-based builds needing chill/freeze immunity.',
  "Doryani's Invitation (Lightning)": 'Grants lightning damage to attacks and a percentage of lightning damage leeched as life. Available in fire, cold, lightning, and physical variants.',
  "Doryani's Invitation (Fire)": 'Grants fire damage to attacks and a percentage of fire damage leeched as life. Solid belt for fire attack builds.',
  "Doryani's Invitation (Cold)": 'Grants cold damage to attacks and a percentage of cold damage leeched as life. Useful for cold attack builds needing sustain.',
  "Doryani's Invitation (Physical)": 'Grants physical damage to attacks and a percentage of physical damage leeched as life. Strong for physical attack builds.',
  'Immortal Flesh': 'Grants massive life regeneration and flat maximum life but reduces elemental resistances. Strong for RF and other regen-heavy builds.',
  'Perseverance': 'Grants Onslaught if you have fortify, and attack damage based on evasion and armour. Great for hybrid-defence attack builds.',
  'Chains of Emancipation': 'Grants maximum power charges but causes temporal chains on you, which can be turned into a benefit with self-curse builds.',
  'Replica Headhunter': 'Steals magic monster mods on kill instead of rare, providing frequent but smaller buffs during mapping.',
  'The Magnate': 'Grants increased flask effect and physical damage. Solid belt for physical builds that value flask scaling.',
  "Garukhan's Flight": 'Grants movement speed and life regeneration based on evasion rating. Actually boots, sometimes confused with belts.',
  'Cyclopean Coil': 'Grants increased attributes and cannot be frozen/ignited/shocked if respective attribute is highest. Provides strong defences and stats.',
  'Arn\'s Anguish': 'Converts endurance charges to brutal charges, granting increased physical damage per charge instead of damage reduction.',

  // ---------------------------------------------------------------------------
  // BODY ARMOURS
  // ---------------------------------------------------------------------------

  "Shavronne's Wrappings": 'Chaos damage does not bypass energy shield, enabling low-life builds that reserve life for auras without dying to chaos damage. The cornerstone of most low-life ES builds.',
  "Kaom's Heart": 'Grants 500 flat maximum life and 20-40% increased fire damage but has no sockets. Massive life pool for builds that socket gems elsewhere.',
  "Inpulsa's Broken Heart": 'Shocked enemies you kill explode dealing lightning damage, creating chain reactions that clear entire packs. Defines many lightning-based mapping builds.',
  'Loreweave': 'Sets maximum elemental resistances to a fixed 78% (unaffected by curses or map mods) and grants flat attributes and critical strike chance. Strong all-round defensive chest.',
  "Hyrri's Ire": 'Grants massive flat cold damage to attacks, spell dodge, and evasion. Best-in-slot for many cold bow builds.',
  "Farrul's Fur": 'Grants power and frenzy charges at the start of every cat stealth cycle via Aspect of the Cat. Provides reliable charge generation for crit builds.',
  'Carcass Jack': 'Increases area of effect and area damage for skills, boosting both coverage and damage. Universal chest for AoE builds.',
  'The Brass Dome': 'Grants massive armour and sets all maximum elemental resistances to equal values but removes critical strike extra damage taken. Extremely defensive choice.',
  'Cloak of Defiance': 'Takes 10% of damage from mana before life and grants increased maximum mana. Core item for Mind over Matter builds.',
  "Voll's Protector": 'Generates a power charge on critical strike with attacks. Enables power charge sustain for attack crit builds.',
  "Atziri's Splendour": 'Comes in multiple variants granting combinations of armour, evasion, energy shield, life, mana, and leech. Versatile but outclassed by modern rares.',
  'Queen of the Forest': 'Grants bonus movement speed based on evasion rating, enabling extreme MS builds. Speed is capped but easily reaches high values with evasion stacking.',
  "Kintsugi": 'Grants 20% less damage taken if you have not been hit recently, plus evasion. Strong defensive layer for evasion builds that avoid getting hit often.',
  'Skin of the Loyal': 'Has six linked sockets with +1 to level of socketed gems and no other stats. A powerful budget option for spell builds that scale gem levels.',
  'Skin of the Lords': 'Has six linked sockets with +1 to level of socketed gems and grants a random keystone passive. Can enable builds if the right keystone rolls.',
  'Belly of the Beast': 'Grants a large percentage increase to maximum life and resistances. A reliable defensive chest for life-based builds.',
  "Victario's Influence": 'Socketed gems are supported by Charity and Generosity, and grants aura effect. Designed for aura-support builds in parties.',
  'Lightning Coil': 'Converts 30% of physical damage taken to lightning damage, which is then mitigated by lightning resistance. Strong physical damage mitigation.',
  "Cherrubim's Maleficence": 'Grants chaos damage and life leech. Solid choice for chaos/poison builds that want sustain.',
  "Geofri's Sanctuary": 'Grants Zealot\'s Oath and energy shield on block. Useful for builds converting life regen to ES regen.',
  'The Perfect Form': 'Grants Arctic Armour for free, Phase Acrobatics, and evasion based on cold resistance. Strong evasion/dodge defensive option.',
  'Sporeguard': 'Grants Fungal Ground on kill, which slows enemies and grants reduced damage taken. Also has built-in Despair application.',
  'Doppelganger Guise': 'In blood stance, grants less physical damage taken and life recovery; in sand stance, grants less chaos damage taken and evasion. Extremely strong defensive chest.',
  'Replica Shroud of the Lightless': 'Socketed abyss jewels have increased effect and it penetrates elemental resistance per socketed abyss jewel. Strong for abyss jewel stacking builds.',
  'Shroud of the Lightless': 'Penetrates elemental resistance per socketed abyss jewel and grants elemental penetration. Strong for elemental builds stacking abyss jewels.',
  'Bronn\'s Lithe': 'Grants increased movement skill damage and attack speed, plus movement speed. Best-in-slot for movement-skill-based builds like Flicker Strike.',
  "Gruthkul's Pelt": 'Grants massive life and life regeneration but disables spellcasting. Used in attack builds that want maximum life pool.',
  'Ivory Tower': 'Chaos damage is taken from mana before life, and grants added maximum energy shield equal to 30% of maximum mana. Enables mana-stacking low-life ES builds.',
  'Covenant': 'Socketed skills are supported by Added Chaos Damage and have their mana cost converted to life cost. Strong for builds that want free added chaos.',
  'Dialla\'s Malefaction': 'Gems socketed in red/green/blue sockets gain +1/+1/+1 to gem level for the matching colour. Cheap way to boost gem levels.',

  // ---------------------------------------------------------------------------
  // HELMETS
  // ---------------------------------------------------------------------------

  'Crown of the Inward Eye': 'Grants increased armour/ES/evasion and transfiguration of soul/body/mind, converting %life/%mana/%ES increases into spell damage. Strong for hybrid builds.',
  "Starkonja's Head": 'Grants increased attack speed, critical strike chance, life, and evasion. A reliable all-round helmet for attack builds.',
  "Rat's Nest": 'Grants attack speed, movement speed, and critical strike chance with high evasion. Offensively powerful helmet for crit attack builds.',
  'The Fledgling': 'Grants Sand Stance-related bonuses including blind aura and less damage taken while in sand stance. Useful for evasion-based builds.',
  'Abyssus': 'Grants massive flat physical damage to attacks and melee critical multiplier but increases physical damage taken. The ultimate glass-cannon melee helmet.',
  "Alpha's Howl": 'Grants +2 to level of socketed aura gems, cannot be frozen, and reduced mana reservation. Core helmet for aura-stacking builds.',
  "Devoto's Devotion": 'Grants increased movement speed, attack speed, and dexterity but has reduced physical damage. Speed-focused helmet for mapping.',
  "Eber's Unification": 'Grants Void Gaze on kill, applying chaos resistance reduction to enemies. Also provides energy shield and spell damage.',
  'The Vertex': 'Grants +1 to level of socketed gems and reduced mana cost of skills. Defensive ES helmet that also boosts gem levels.',
  "Goldrim": 'Grants massive elemental resistances, making it the go-to leveling helmet for capping resists early.',
  'Fractal Thoughts': 'Grants critical strike chance and multiplier based on intelligence. Strong helmet for intelligence-stacking crit builds.',
  'Blizzard Crown': 'Grants cold damage to spells and attacks and increases freeze chance. A strong offensive helmet for cold-based builds.',
  'Hale Negator': 'Stores life recovery and releases it when you take a savage hit. Provides a burst heal as a defensive safety net.',
  "Maw of Conquest": 'Grants increased fire damage and life when you use a fire skill. Useful for fire builds with sustain needs.',
  'Mask of the Tribunal': 'Grants increased energy shield per nearby ally and aura effect. Strong for party-play aura support.',
  'Kitava\'s Thirst': 'Triggers socketed spells when you spend a threshold of mana, enabling automatic spellcasting for high mana-cost builds.',
  "Mind of the Council": 'Grants lightning damage to mana recovery and increased maximum mana. Useful for lightning builds with mana as a resource.',
  'Crown of Eyes': 'Spell damage modifiers apply to attacks at 150% of their value. Enables builds that stack spell damage for attack scaling.',
  'Forbidden Shako': 'Grants a random level 25+ support gem mod to socketed gems. Can roll extremely powerful support combinations.',
  'Galesight': 'Grants fire exposure on hit and increases burning damage. Strong for ignite builds needing exposure application.',
  'Tempest\'s Binding': 'Socketed gems are supported by Added Lightning Damage and Innervate. Provides strong automatic support for lightning skills.',
  'Scold\'s Bridle': 'Deals physical damage to you when you spend mana on skills. Enables Cast when Damage Taken loops and self-damage combos.',
  'The Baron': 'Grants +2 to level of socketed minion gems and allows your minions to leech life to you if you have 1000+ strength. Core for strength-stacking summoners.',
  'Wreath of Phrecia': 'Grants energy shield and causes cold damage taken to be resisted by maximum fire resistance instead. Useful for elemental damage conversion defence.',

  // ---------------------------------------------------------------------------
  // GLOVES
  // ---------------------------------------------------------------------------

  'Facebreaker': 'Grants 600-800% more physical damage with unarmed attacks. The defining item for unarmed strike builds.',
  "Shaper's Touch": 'Converts strength to bonus energy shield and dexterity to bonus evasion, and grants melee damage based on strength. Core for strength-stacking builds.',
  'Hands of the High Templar': 'Can have up to five corrupted implicit modifiers, making them potentially the most powerful gloves in the game with the right implicits.',
  'Voidbringer': 'Grants increased spell critical strike chance and added maximum mana but increases mana cost of skills. Strong for crit spellcasters.',
  "Atziri's Acuity": 'Grants Vaal Pact conditionally when you critical strike, enabling instant leech on crits. Strong for crit builds that need burst sustain.',
  'Shadows and Dust': 'Grants Rampage and creates smoke clouds on critical strike. Provides attack speed, crit multi, and mapping utility.',
  'Tombfist': 'Intimidates enemies if socketed with a murderous eye jewel and maims with a searching eye jewel. Best-in-slot attack gloves for many builds.',
  "Southbound": 'Enemies can only be killed when frozen, and grants increased maximum life and cold resistance. Used in culling strategies and cold DoT builds.',
  'Snakebite': 'Attacks poison during any flask effect, enabling easy poison application for attack builds. Also grants frenzy charge on kill.',
  "Wyrmsign": 'Grants Rampage when you have no endurance charges, and generates endurance charges while not on Rampage. Cyclical charge/rampage engine.',
  'Maligaro\'s Virtuosity': 'Grants high increased critical strike chance and critical strike multiplier. Classic glass-cannon crit gloves.',
  'Kalisa\'s Grace': 'Grants a power charge on spending a large amount of mana. Useful for mana-heavy crit builds.',
  'Grip of the Council': 'Adds cold damage to minion attacks and grants minion movement speed. Strong for cold-converted minion builds.',
  'Breathstealer': 'Creates a spore pod aura on kill that provides an anointed notable to nearby allies. Grants aura-like effects during mapping.',
  'Asenath\'s Gentle Touch': 'Causes cursed enemies you kill to explode and temporally chains enemies on hit. Provides corpse destruction and crowd control.',
  'Gravebind': 'Your kills are attributed to your minions and vice versa, enabling on-kill effects to trigger from either source.',
  'Command of the Pit': 'Grants accuracy rating to minions if socketed with a ghastly eye jewel. Useful for minion builds needing accuracy.',
  'Haemophilia': 'Causes bleeding enemies you kill to explode, creating chain reactions in packs. Budget explosion gloves for bleed builds.',
  'Allelopathy': 'Grants level 22 Blight as a socketed skill with built-in spread. Enables Blight without gem links.',
  'Incandescent Heart': 'Converts 25% of elemental damage taken to chaos damage and grants extra chaos damage. Strong for CI builds where chaos damage is irrelevant.',

  // ---------------------------------------------------------------------------
  // BOOTS
  // ---------------------------------------------------------------------------

  "Atziri's Step": 'Grants spell suppression chance, movement speed, evasion, and life. A reliable defensive boot for spell-dodge builds.',
  'Darkray Vectors': 'Grants additional frenzy charge and movement speed per frenzy charge but reduces dodge per frenzy charge. Enables high frenzy count speed builds.',
  'Sin Trek': 'Grants large flat energy shield, dexterity, intelligence, and movement speed. Strong ES boots for hybrid or CI builds.',
  "Ralakesh's Impatience": 'Grants minimum endurance, frenzy, and power charges equal to maximum while stationary. Provides full charges while standing still, great for bossing.',
  "Kaom's Roots": 'Grants massive life and unwavering stance (cannot be stunned) but prevents movement speed modification. Tanky boots for slow, hard-hitting builds.',
  'Bubonic Trail': 'Grants death walk (enemies explode on death in your path) if socketed with abyss jewels, plus increased damage per socketed jewel.',
  'Seven-League Step': 'Grants 50% increased movement speed with no other stats. Purely a speed boot for leveling and low-gear mapping.',
  "Gang's Momentum": 'Grants increased fire damage and ignite chance to movement skills. Niche boots for fire movement skill builds.',
  'Goldwyrm': 'Grants increased quantity of items found and fire resistance. Magic-find boots.',
  'Windshriek': 'Increases curse area of effect and allows one additional curse on enemies. Enables multi-curse setups.',
  'Windscream': 'Allows one additional curse on enemies. Budget version of Windshriek for curse builds.',
  "Rainbowstride": 'Grants spell block, maximum mana, and elemental resistances. Defensive boots for block-based spellcasters.',
  'Dance of the Offered': 'Grants onslaught on kill and increased attack and movement speed. Strong for fast mapping builds.',
  'The Stampede': 'Your movement speed is at least 150% of base and travel skills have no cooldown. Enables permanent max speed and spammable movement skills.',
  'Replica Alberon\'s Warpath': 'Adds chaos damage to attacks per 80 strength. Strong for strength-stacking chaos attack builds.',
  'March of the Legion': 'Socketed aura gems are free to reserve but have a duration and cooldown. Enables temporary extra aura stacking.',
  'Stormcharger': 'Grants increased movement speed, lightning resistance, and lightning damage to attacks. Budget lightning-attack boots.',
  'Deerstalker': 'Socketed trap gems are supported by Trap and grants trap throwing speed. Enables five-link traps in boots.',

  // ---------------------------------------------------------------------------
  // AMULETS
  // ---------------------------------------------------------------------------

  'Ashes of the Stars': 'Grants +1 to level of all skill gems, increased reservation efficiency, and up to 20% quality to all skill gems. Best-in-slot amulet for nearly any build that benefits from gem quality.',
  'Crystallised Omniscience': 'Converts all attributes to Omniscience, which provides elemental penetration. Enables builds that stack attributes for massive elemental penetration.',
  'Badge of the Brotherhood': 'Sets maximum frenzy charges equal to maximum power charges. Enables extreme charge stacking for builds that scale both charge types.',
  "Hyrri's Truth": 'Grants Precision aura for free and adds cold damage to attacks with high accuracy. Strong for cold attack builds that need accuracy.',
  'Yoke of Suffering': 'Each elemental ailment on an enemy increases damage taken by 5%. Extremely powerful with builds that apply all three elemental ailments.',
  "Xoph's Blood": 'Grants Avatar of Fire keystone, fire damage, and fire penetration. Enables full fire conversion without pathing to the keystone.',
  'Solstice Vigil': 'Grants Temporal Chains aura for free and shackles you with temporal chains. Extends buff durations massively for self-curse builds.',
  'Impresence': 'Grants a free blasphemy curse aura (Despair, Vulnerability, Frostbite, Conductivity, or Enfeeble depending on variant). Saves an aura reservation slot.',
  'Aul\'s Uprising': 'Makes one specific aura reserve no mana (varies by variant). Enables free reservation of a powerful aura.',
  "Pandemonius": 'Blinds enemies on hit and grants cold penetration against blinded enemies. Strong offensive and defensive amulet for cold builds.',
  'The Jinxed Juju': 'Transfers 10% of damage taken to your spectre, effectively providing damage reduction. Also grants +1 to maximum spectres.',
  "Marylene's Fallacy": 'Massively increases critical strike multiplier but reduces critical strike chance and makes crits deal damage over time. Niche use in specific crit builds.',
  'Carnage Heart': 'Grants all attributes, life leech, and increased damage while leeching. Solid all-around amulet for leech-based builds.',
  "Rigwald's Curse": 'Allows unarmed attacks to deal damage as if wielding a claw, enabling claw passives to work with Facebreaker builds.',
  'Eyes of the Greatwolf': 'Has two talisman implicit mods with 100% increased effect, creating potentially extremely powerful stat combinations.',
  'The Ephemeral Bond': 'Grants power charges to your minions and makes their power charges grant increased critical strike chance. Useful for crit minion builds.',
  "Choir of the Storm": 'Triggers a bolt of lightning when you critically strike, dealing high lightning damage. Also grants increased maximum mana and lightning resistance.',
  'Leadership\'s Price': 'Grants Petrified Blood for free and provides attribute bonuses. Used in low-life builds that want Petrified Blood without reservation.',
  'Tavukai': 'Grants +1 to maximum skeletons and causes skeletons to deal more damage but they lose life over time. Powerful for skeleton mage builds.',
  'Stranglegasp': 'Can have five anointed notable passives. Provides massive passive tree flexibility.',
  'The Ascetic': 'Increases flask charges gained when you have no belt equipped. Requires giving up belt slot for stronger flask sustain.',
  'Ungil\'s Harmony': 'Critical strikes deal no extra damage but grants massive critical strike chance. Used with Perfect Agony or Elemental Overload.',
  "Sidhebreath": 'Grants minion damage, minion movement speed, and cold damage to minion attacks. Budget leveling amulet for summoners.',
  'Star of Wraeclast': 'Grants level 20 Illusory Warp on kill and increased chaos damage. Provides teleportation utility during mapping.',
  'Atziri\'s Foible': 'Grants massive mana, mana regeneration, and reduced attribute requirements. Core amulet for mana-stacking and low-attribute builds.',
  'The Halcyon': 'Grants cold damage, freeze chance, and increased cold damage per frenzy charge. Strong for cold builds with frenzy charge generation.',
  'Warped Timepiece': 'Grants increased action speed but reduces life, mana, and energy shield. Pure speed amulet for builds that can afford the life penalty.',
  'Replica Dragonfang\'s Flight': 'Grants +4 to level of all skill gems of a specific type. Extremely powerful for builds that want maximum gem levels.',

  // ---------------------------------------------------------------------------
  // RINGS
  // ---------------------------------------------------------------------------

  'Nimis': 'Projectiles return to you and have random spread, effectively doubling projectile hits on bosses. Extremely powerful for projectile builds.',
  'The Taming': 'Grants increased damage per elemental ailment on the enemy and resists. With many ailments applied, provides massive damage increase.',
  'Mark of the Elder': 'Grants massive attack damage when paired with a Shaper-influenced ring in the other slot. One of the strongest attack damage rings.',
  'Mark of the Shaper': 'Grants massive spell damage when paired with an Elder-influenced ring in the other slot. One of the strongest spell damage rings.',
  'Call of the Brotherhood': 'Converts 40% of lightning damage to cold damage. Core ring for lightning-to-cold conversion builds.',
  'Essence Worm': 'Socketed gem has no mana reservation but increases all other reservation by 40%. Enables one free aura for builds with tight reservation.',
  'Ventor\'s Gamble': 'Has random rolls on quantity, rarity, and resistances ranging from very negative to very positive. Perfect rolls make it the best MF ring.',
  'Precursor\'s Emblem': 'Grants powerful bonuses per endurance/frenzy/power charge depending on variant. Scales extremely well with high charge counts.',
  'Polaric Devastation': 'Covers enemies in ash or frost on hit depending on damage type. Provides exposure and increased damage taken by enemies.',
  'Malachai\'s Artifice': 'Applies Elemental Equilibrium via the socketed gem, inflicting -50% to other elemental resistances. Powerful for builds using two different elements.',
  'Pyre': 'Converts cold damage to fire damage and causes ignited enemies to burn faster. Used in cold-to-fire conversion builds.',
  'Sibyl\'s Lament': 'Reduces elemental reflected damage taken. Used specifically to counter reflect map mods.',
  "Le Heup of All": 'Grants all attributes, all resistances, increased damage, and rarity. Strong all-around ring for builds needing many stats.',
  'Circle of Nostalgia': 'Modifies Herald of Agony with bonuses like increased buff effect or reduced reservation. Core for Herald of Agony builds.',
  'Circle of Guilt': 'Modifies Herald of Purity with bonuses like increased physical damage or reduced reservation. Powerful for physical builds using HoP.',
  'Circle of Fear': 'Modifies Herald of Ice with bonuses like increased cold damage or reduced reservation. Strong for cold herald builds.',
  'Circle of Anguish': 'Modifies Herald of Ash with bonuses like increased fire damage or reduced reservation. Useful for fire herald builds.',
  'Circle of Regret': 'Modifies Herald of Thunder with bonuses like increased lightning damage or reduced reservation. Used in lightning herald builds.',
  'Profane Proxy': 'Socketed curse applies to enemies in a ring around your sentinel of purity or other minion. Automates curse application via minions.',
  'Storm Secret': 'Herald of Thunder hits damage you as well but have increased frequency. Enables self-hit and high-frequency HoT builds.',
  'Thief\'s Torment': 'Grants massive life and mana gain on hit but prevents wearing a second ring. Provides unmatched sustain for rapid-hitting builds.',
  'Romira\'s Banquet': 'Generates a power charge on non-critical strikes but removes all power charges on critical strike. Used in discharge and specific charge interaction builds.',
  'Berek\'s Respite': 'Grants damage and proliferates ignite to other enemies on kill. Useful for ignite builds wanting better clear.',
  'Berek\'s Grip': 'Grants life leech from cold damage and mana leech from lightning damage. Versatile sustain ring for elemental builds.',
  'Berek\'s Pass': 'Grants cold and fire damage and freeze/ignite synergies. Budget ring for builds dealing both cold and fire damage.',
  'Snakepit': 'Causes spells to fork or chain depending on which hand it is equipped in. Adds projectile mechanics to spell builds.',
  'Gifts from Above': 'Creates consecrated ground on critical strike and grants increased rarity. Provides sustain and damage from consecrated ground.',
  'Voidsight': 'Grants chaos resistance and causes hits to hinder enemies, reducing their movement speed. Also provides increased chaos damage.',
  'Ming\'s Heart': 'Grants chaos damage and chaos resistance but reduces maximum life and energy shield. High-risk high-reward chaos damage ring.',
  'Heartbound Loop': 'Deals physical damage to you when a minion dies. Used in Cast when Damage Taken loops with minion destruction.',
  'Doedre\'s Damning': 'Allows an additional curse on enemies and grants curse-related bonuses. Budget way to enable dual-curse setups.',
  'Kaom\'s Way': 'Grants life regeneration per endurance charge. Core ring for endurance-charge-stacking regen builds like RF.',

  // ---------------------------------------------------------------------------
  // WEAPONS - BOWS
  // ---------------------------------------------------------------------------

  'Windripper': 'Grants critical strike chance, flat elemental damage to attacks, and increased quantity/rarity from frozen/shocked enemies. The premier magic-find bow.',
  "Death's Opus": 'Grants +2 additional arrows and increased critical strike multiplier. Strong for multi-arrow crit bow builds.',
  'Voltaxic Rift': 'Converts a portion of lightning damage to chaos damage, allowing lightning builds to bypass elemental reflect and resistances.',
  "Death's Harp": 'Grants high critical strike multiplier and +1 arrow. Budget version of Death\'s Opus for early crit bow builds.',
  'Hopeshredder': 'Grants frenzy charges on hit against unique enemies and adds cold damage per frenzy charge, but degenerates life per frenzy charge.',
  'Doomfletch\'s Prism': 'Adds elemental damage equal to physical damage of arrows, effectively tripling physical bow damage as tri-element.',
  'Reach of the Council': 'Grants +4 arrows and increased attack speed. Provides massive coverage for arrow-based bow skills.',
  'Null\'s Inclination': 'Triggers socketed minion spells on kill. Enables bow builds that also deploy minions automatically.',
  'Quill Rain': 'Grants massive attack speed and projectile speed but deals 40% less weapon damage. Used for trigger setups and rapid-hit builds.',
  'The Tempest': 'Grants increased lightning damage and shock chance. Budget lightning bow for early leveling.',
  'Lioneye\'s Glare': 'Hits cannot be evaded and grants far shot for increased damage at range. Removes need for accuracy investment.',
  'Chin Sol': 'Grants 100% more bow damage at close range and knockback. Enables extreme damage for point-blank bow builds.',
  'Darkscorn': 'Converts physical damage to chaos and grants 25% of physical damage taken as chaos. A defensive option for bow builds.',
  'Xoph\'s Nurture': 'Grants ignite proliferation and life gain on ignite. Designed for burning arrow and ignite bow builds.',
  'Arborix': 'Alternates between two modes granting either extra arrows or increased attack speed. Versatile bow for different situations.',

  // ---------------------------------------------------------------------------
  // WEAPONS - WANDS
  // ---------------------------------------------------------------------------

  'Piscator\'s Vigil': 'Grants no physical damage but massive increases to elemental damage with attacks. Core wand for elemental wand attack builds.',
  'Void Battery': 'Grants +1 maximum power charge and massive spell damage per power charge. Best-in-slot wand for power-charge-stacking spellcasters.',
  'Obliteration': 'Enemies you kill have a 25% chance to explode dealing chaos damage. Provides pack clear through explosions.',
  'Poet\'s Pen': 'Triggers socketed spells on attack, with a short cooldown. Enables attack-spell hybrid builds.',
  'The Poet': 'Grants mana recovery on hit and spell damage. Useful for sustaining mana in rapid-hit spell builds.',
  'Lifesprig': 'Grants +1 to level of socketed spell gems and spell damage. The classic leveling wand for spellcasters.',
  'Tulfall': 'Generates power charges and grants cold damage per charge but removes them at max. Used in charge-cycling builds.',
  'Moonsorrow': 'Blinds enemies on hit and grants spell damage. Provides defensive utility through blind application.',
  'Shade of Solaris': 'Grants massive critical strike bonus if you have not critically struck recently, enabling one massive critical hit.',

  // ---------------------------------------------------------------------------
  // WEAPONS - SWORDS (ONE-HAND & TWO-HAND)
  // ---------------------------------------------------------------------------

  "Cospri's Malice": 'Triggers socketed cold spells on melee critical strike with a cooldown. Core weapon for CoC Ice Nova and similar builds.',
  'Paradoxica': 'Hits deal double damage. With a well-rolled flat physical mod, this creates some of the highest one-hand DPS in the game.',
  'Saviour': 'Creates mirage copies of you that use your skills, effectively doubling or tripling your attack output. Best-in-slot for many melee builds.',
  'Starforge': 'Grants massive physical damage and allows physical damage to shock. One of the highest physical DPS two-hand swords.',
  'Oro\'s Sacrifice': 'Grants massive fire damage, causes attacks to ignite, and generates frenzy charges on igniting a unique enemy. Core for fire Flicker Strike.',
  "Ahn's Might": 'Grants increased accuracy and damage when at max or zero power charges. Works well with Ahn\'s Heritage for charge manipulation.',
  'Rebuke of the Vaal': 'Grants flat damage of all five elements and high critical strike chance. Strong for elemental builds that benefit from all damage types.',
  'Hyaon\'s Fury': 'Grants massive lightning damage per frenzy charge but increases damage taken per charge. Risk/reward scaling with frenzy charges.',
  'The Goddess Unleashed': 'Grants fire damage, movement speed, and trigger effects. Built from upgrading Goddess Scorned through prophecy chain.',
  'Ahn\'s Heritage': 'Grants +3% to maximum fire resistance and onslaught when at maximum endurance charges. Strong defensive shield for endurance charge builds.',
  'Oni-Goroshi': 'Grants Her Embrace buff when you ignite, adding massive fire damage but degenerating your life. Powerful leveling and endgame weapon.',
  'Exquisite Blade': 'High base physical damage two-hand sword often used as a crafting base. Not a unique but commonly discussed in this category.',
  'Terminus Est': 'Generates frenzy charges on critical strike with high base crit. Classic Flicker Strike weapon for budget builds.',
  'Dancing Dervish': 'Animates itself as a minion during Rampage, attacking independently while granting onslaught and removing your ability to use weapons.',

  // ---------------------------------------------------------------------------
  // WEAPONS - DAGGERS
  // ---------------------------------------------------------------------------

  'Arakaali\'s Fang': 'Spawns 20 spiders when you kill a poisoned enemy via a flask. The spiders deal massive damage, making this core for spider summoner builds.',
  'Cold Iron Point': 'Grants +3 to level of all physical spell skill gems. Massive level boost for physical spells like Blade Vortex and Bladefall.',
  'Heartbreaker': 'Grants spell damage and culling strike on spells. Budget option for spell builds wanting a free cull.',
  'The Consuming Dark': 'Converts fire damage to chaos and grants poison chance from chaos damage. Used in fire-to-chaos conversion poison builds.',
  'Divinarius': 'Grants spell damage, critical strike chance for spells, and increased AoE. All-around good dagger for spell builds.',
  'Bino\'s Kitchen Knife': 'Proliferates poison on kill and grants life regeneration while poisoning. Clear speed poison dagger.',
  'White Wind': 'Grants massive cold damage and evasion when off-hand is empty. Strong for dual-wield avoidance or one-hand setups.',
  'Mark of the Doubting Knight': 'Grants life on hit against bleeding enemies and massive physical damage. Oriented toward bleed attack builds.',
  'Replica Cold Iron Point': 'Grants +3 to level of all fire spell skill gems. The fire equivalent of Cold Iron Point for fire spell scaling.',

  // ---------------------------------------------------------------------------
  // WEAPONS - CLAWS
  // ---------------------------------------------------------------------------

  'Wasp Nest': 'Grants high attack speed, critical strike chance, and added chaos damage with built-in poison chance. Best-in-slot budget claw for poison builds.',
  'Touch of Anguish': 'Grants cold damage, frenzy charge on shattering, and causes cold damage to chain. Used for chain-based cold claw builds.',
  'Hand of Wisdom and Action': 'Grants lightning damage per intelligence and attack speed per dexterity. Core for intelligence-stacking lightning claw builds.',
  'Al Dhih': 'Steals power charges and grants life gain on hit against cursed enemies. Utility claw for curse-heavy builds.',
  'Mortem Morsu': 'Grants poison chance, critical strike chance, and increased damage with poison. Budget poison claw for early progression.',
  'Bloodseeker': 'Grants instant life leech from attacks. Provides the old Vaal Pact effect on a weapon without the keystone.',
  'The Scourge': 'Grants added physical damage and minion damage applies to you as well. Enables unique scaling where minion nodes boost your attacks.',
  'Replica Redbeaks': 'Grants massive fire damage when on low life. Used in low-life attack builds.',
  'Cybil\'s Paw': 'Grants life on hit per power charge and spell damage. Used in spellcaster builds that want sustain through rapid hits.',

  // ---------------------------------------------------------------------------
  // WEAPONS - AXES
  // ---------------------------------------------------------------------------

  'Atziri\'s Disfavour': 'Grants +2 to level of socketed support gems and massive physical damage with bleed. One of the strongest two-hand axes for bleed builds.',
  'Kitava\'s Feast': 'Grants life recovery on hit equal to damage dealt to enemies and massive physical damage. Self-sustain two-hand axe.',
  'Disfavour': 'See Atziri\'s Disfavour - the premier bleed two-hand axe with support gem level boosting.',
  'Rigwald\'s Savagery': 'Grants high physical damage and attack speed in wolf form (from Rigwald set). Used in werewolf-themed builds.',
  'The Blood Reaper': 'Grants massive physical damage, life leech, and causes bleeding. Budget two-hand axe for bleed builds.',
  'Soul Taker': 'Allows you to use skills without sufficient mana, solving all mana sustain issues. Also grants significant cold damage.',
  'Razor of the Seventh Sun': 'Recovers life on ignite and grants fire damage. Provides sustain for fire attack builds.',
  'Jack, the Axe': 'Grants life leech and causes bleeding on hit. Reliable sustain axe for physical attack builds.',
  'Reaper\'s Pursuit': 'Grants culling strike and increased rarity. A niche magic-find option.',
  'Ngamahu\'s Flame': 'Triggers Molten Burst projectiles on melee hit, dealing massive fire damage. Core weapon for Cyclone Ngamahu builds.',
  'Debeon\'s Dirge': 'Grants massive cold damage if you have used a warcry recently. Designed for warcry-based cold attack builds.',

  // ---------------------------------------------------------------------------
  // WEAPONS - MACES & SCEPTRES
  // ---------------------------------------------------------------------------

  'Mjolner': 'Triggers socketed lightning spells on melee hit. Core for Cyclone/discharge and CwC lightning spell builds.',
  'Nebulis': 'Grants increased elemental damage per 1% cold/lightning resistance above 75%. Extremely powerful with resistance stacking.',
  'Brightbeak': 'Grants massive attack speed, making it the default weapon for movement skill speed and Shield Charge travel.',
  'Doon Cuebiyari': 'Grants increased damage per 8 strength. Designed for strength-stacking builds.',
  'Callinellus Malleus': 'Grants massive physical damage and reduced enemy stun threshold. One of the strongest options for stun-focused builds.',
  'Mon\'tregul\'s Grasp': 'Halves maximum zombie count but grants zombies massive damage, life, and they create consecrated ground on death. Core for focused zombie builds.',
  'Cameria\'s Maul': 'Freezes enemies as though dealing triple damage. Provides strong freeze utility for physical builds.',
  'Tidebreaker': 'Grants massive physical damage and endurance charge on stun. One of the highest physical DPS two-hand maces.',
  'Kongor\'s Undying Rage': 'Cannot critically strike unless you have Onslaught, but crits deal triple damage when they occur. Burst crit two-hand mace.',
  'Clayshaper': 'Grants +1 to maximum golems and minion life. Used in golem builds for additional golem count.',
  'Cane of Kulemak': 'Can roll random unique sceptre modifiers, creating potentially powerful combinations. Outcome varies wildly.',
  'Advancing Fortress': 'Grants block chance and socketed gems are supported by Fortify. A defensive one-hand option that frees up a support link.',
  'Earendel\'s Embrace': 'Makes skeletons cast a fire explosion on summon and grants minion fire damage. Niche summoner sceptre.',

  // ---------------------------------------------------------------------------
  // WEAPONS - STAVES
  // ---------------------------------------------------------------------------

  'Cane of Unravelling': 'Grants +2 to level of all chaos spell gems and increased chaos damage. Core for chaos DOT builds like Bane and Essence Drain.',
  'The Searing Touch': 'Grants +2 to level of all fire spell gems and massive fire/burning damage. Core for fire DOT builds like Righteous Fire and Fire Trap.',
  'Martyr of Innocence': 'Grants massive added fire damage to spells and attacks and increased fire damage. One of the highest fire DPS staves.',
  'Pledge of Hands': 'Grants a level 30 Greater Spell Echo support to socketed spells and massive mana. Enables triple-repeat spellcasting.',
  'Staff of the First Disciple': 'Grants energy shield, mana, and spell damage. Solid staff for CI/LL spellcasters.',
  'Hegemony\'s Era': 'Grants a power charge on critical strike with staves and knock back. Enables power charge generation for staff crit builds.',
  'Disintegrator': 'Grants added physical damage per siphoning charge and increased damage, but degenerates life per charge. Used in Shaper-influenced builds.',
  'Eclipse Staff': 'Grants increased block chance and spell block. A defensive staff option.',
  'Duskdawn': 'Grants massive critical strike chance and multiplier plus life/ES on critical strike. A strong crit-focused staff.',
  'Taryn\'s Shiver': 'Grants cold damage, freezes enemies, and cold spell damage. Classic cold spell staff.',
  'Realm Ender': 'Grants massive AoE and elemental damage. Useful for wide-area spell builds.',

  // ---------------------------------------------------------------------------
  // SHIELDS
  // ---------------------------------------------------------------------------

  'Aegis Aurora': 'Recovers energy shield on block equal to 2% of armour. Combined with high armour and block chance, provides nearly infinite ES sustain.',
  'Prism Guardian': 'Socketed gems have Blood Magic and reduced reservation. Enables auras to reserve life, freeing mana for low-life builds.',
  "Atziri's Mirror": 'Grants spell block, elemental damage reflection, and evasion. Defensive option for spell-dodge builds.',
  'Magna Eclipsis': 'Grants a level 20 Elemental Aegis providing a massive elemental damage absorption shield. Strong layered defence.',
  'Rise of the Phoenix': 'Grants +5% to maximum fire resistance and life regeneration. Core shield for Righteous Fire builds.',
  'Saffell\'s Frame': 'Grants +4% to all maximum elemental resistances but has no block chance. Traded block for powerful elemental max res.',
  'Lioneye\'s Remorse': 'Grants massive armour, life, and block chance. One of the tankiest shields for armour-stacking builds.',
  'The Surrender': 'Grants level 30 Reckoning triggered on block and life recovery on block. Provides sustain and counterattack damage on block.',
  'Spirit Shield (various crafted)': 'Crafted spirit shields provide energy shield and spell damage. The default choice for ES-based spellcasters.',
  'Apep\'s Supremacy': 'Grants chaos damage to spells, energy shield on block, and poison duration. Useful for chaos/poison spell builds with block.',
  'Replica Atziri\'s Mirror': 'Grants elemental damage and attack block. An offensive variant of the original Atziri\'s Mirror.',
  'Crest of Desire': 'Socketed gem has +1 level and 50% increased quality, massively boosting a single skill gem. A pseudo 7-link in a shield.',
  'Mahuxotl\'s Machination': 'Grants five keystones: Corrupted Soul, Divine Flesh, Eternal Youth, Vaal Pact, and Immortal Ambition. Enables complex defensive layering.',
  'Chernobog\'s Pillar': 'Grants fire damage, life, and covers enemies in ash on block. Provides damage amplification through ash debuff.',
  'Springleaf': 'Grants life recovery rate when on low life. A budget defensive shield that shines at low HP.',
  'Matua Tupuna': 'Grants +2 to level of socketed minion gems and minion bonuses. Budget shield for summoner builds.',
  'Sentari\'s Answer': 'Curses enemies on block. Automates curse application for block-focused builds.',

  // ---------------------------------------------------------------------------
  // QUIVERS
  // ---------------------------------------------------------------------------

  "Hyrri's Demise": 'Grants added cold damage to attacks per dexterity, scaling massively with dexterity stacking. Core quiver for dex-stacking bow builds.',
  "Rigwald's Quills": 'Causes projectiles to fork, doubling projectile hits. Massively increases clear speed for bow builds.',
  "Maloney's Mechanism": 'Triggers socketed bow skills when you use a skill. Automates curse/utility bow skills alongside your main attack.',
  'Drillneck': 'Grants increased damage with hits and ailments per arrow pierced, plus pierce chance. Strong for pierce-focused bow builds.',
  'Soul Strike': 'Grants faster start of energy shield recharge and increased ES. Defensive quiver for CI bow builds.',
  'Voidfletcher': 'Stores void charges that fire void shots dealing massive added chaos damage. Provides enormous bonus single-target damage.',
  'The Signal Fire': 'Converts 25% of physical damage to fire and gains that amount as extra fire damage. Effectively doubles physical-to-fire conversion value.',
  'Skirmish': 'Allows you to use bow attacks with a melee weapon. Enables unique hybrid melee/bow setups.',
  'Asphyxia\'s Wrath': 'Grants cold damage, despair on hit against frozen enemies, and increases freeze duration. Strong for cold bow builds.',
  'Blackgleam': 'Converts physical damage to fire damage for projectile attacks. Budget quiver for fire conversion bow builds.',
  'Rearguard': 'Grants block chance and projectile damage. Defensive quiver that provides attack block.',
  'Cragfall': 'Grants high physical damage to attacks and stun duration. A strong physical bow quiver.',

  // ---------------------------------------------------------------------------
  // FLASKS
  // ---------------------------------------------------------------------------

  'Bottled Faith': 'Creates consecrated ground that increases damage taken by enemies and provides crit chance to the player. Best-in-slot offensive flask for most builds.',
  'Dying Sun': 'Grants +2 projectiles and increased AoE during flask effect. Massive clear and single-target boost for projectile builds.',
  "Atziri's Promise": 'Adds extra chaos damage from physical and elemental damage and grants chaos resistance. The best budget offensive flask.',
  'Taste of Hate': 'Converts physical damage taken to cold damage and adds extra cold damage from physical. Strong offensive and defensive flask.',
  'Cinderswallow Urn': 'Grants life/mana/ES recovery on kill and increases damage against ignited enemies. Versatile mapping flask.',
  'Progenesis': 'Converts a portion of hit damage to damage over time, giving your recovery mechanics time to heal. One of the strongest defensive flasks.',
  "Lion's Roar": 'Grants more melee physical damage and knockback during flask effect. Best-in-slot offensive flask for melee physical builds.',
  'The Wise Oak': 'Penetrates the resistance of your lowest uncapped elemental resistance and reduces damage taken of your highest. Requires balanced resistances for full benefit.',
  'Rumi\'s Concoction': 'Grants attack and spell block chance during flask effect. Core defensive flask for block builds.',
  'Forbidden Taste': 'Instantly recovers all life but deals chaos damage over time. An emergency heal that requires chaos resistance to survive.',
  'Coruscating Elixir': 'Removes all energy shield and prevents chaos damage bypassing ES during flask effect. Enables pseudo-Shav\'s effect on a flask.',
  'Vessel of Vinktar': 'Grants lightning damage and leech during flask effect but shocks you. Massive lightning damage boost with a self-shock downside.',
  'Divination Distillate': 'Grants increased quantity and rarity during flask effect while recovering life and mana. Core magic-find flask.',
  'The Overflowing Chalice': 'Grants massively increased flask charge generation to other flasks. Sustains other flask uptime.',
  'Writhing Jar': 'Spawns worm minions on use that can be killed for on-kill effects. Utility flask for triggering on-kill mechanics on bosses.',
  'Lavianga\'s Spirit': 'Removes mana cost of skills during flask effect. Solves all mana problems temporarily.',
  'Coralito\'s Signature': 'Grants perfect agony and increased poison damage but removes critical strike multiplier. Core for poison crit builds.',
  'Kiara\'s Determination': 'Grants immunity to freeze, chill, curses, and stun during flask effect. An all-in-one defensive utility flask.',
  'Sin\'s Rebirth': 'Grants unholy might during flask effect, adding extra chaos damage from physical. Strong for physical builds wanting chaos damage.',
  'The Sorrow of the Divine': 'Creates consecrated ground and grants Zealot\'s Oath during flask effect, converting life regen to ES regen.',
  'Rotgut': 'Consumes frenzy charges to grant onslaught and increased duration. Speed flask for frenzy charge builds.',

  // ---------------------------------------------------------------------------
  // JEWELS
  // ---------------------------------------------------------------------------

  "Watcher's Eye": 'Grants up to three powerful modifiers that only apply while affected by specific auras. The most build-defining jewel, with mod combinations worth mirrors.',
  'Thread of Hope': 'Allocates passives within a ring on the tree without connecting them, but reduces resistances. Enables distant notable access without pathing.',
  'Unnatural Instinct': 'Allocates all small passives within the jewel radius without spending points. Extremely powerful in specific tree locations.',
  'Inspired Learning': 'Steals one mod from a rare monster on kill (budget Headhunter effect) when placed near four notables. Provides minor Headhunter-like mapping fun.',
  'Forbidden Flame': 'Paired with Forbidden Flesh, grants an ascendancy notable from another class of the same base. Enables cross-class ascendancy node access.',
  'Forbidden Flesh': 'Paired with Forbidden Flame, grants an ascendancy notable from another class of the same base. Must match the same notable as Forbidden Flame.',
  'Militant Faith': 'Transforms keystone in radius into a Timeless keystone (Inner Conviction, Transcendence, etc.) and modifies nearby notables based on devotion value.',
  'Elegant Hubris': 'Transforms notables in radius into random powerful modifiers and keystone into a Timeless keystone. Outcomes vary dramatically by seed.',
  'Glorious Vanity': 'Transforms passives in radius into Vaal-themed alternatives and changes keystone to a Timeless keystone (Corrupted Soul, Ritual of Awakening, etc.).',
  'Lethal Pride': 'Adds random bonuses to notables in radius and transforms keystone into a Timeless keystone (Chainbreaker, Tempered by War, etc.).',
  'Brutal Restraint': 'Adds random bonuses to notables in radius and transforms keystone into a Timeless keystone (Dance with Death, Second Sight, etc.).',
  'That Which Was Taken': 'Grants a powerful random modifier equivalent to a map or keystone effect. A build-defining jewel if the right mod is obtained.',
  'Impossible Escape': 'Allocates passives within the radius of a specified keystone without connecting them. Enables taking powerful notables near keystones you don\'t path through.',
  'Split Personality': 'Grants two attributes/stats that increase for each passive point allocated between the jewel and your starting location. Rewards long passive paths.',
  'Voices': 'A large cluster jewel with only jewel sockets and no notables. Enables stacking multiple medium cluster jewels.',
  'The Adorned': 'Increases the effect of all magic jewels. Extremely powerful when combined with a full set of well-rolled magic jewels.',
  'Megalomaniac': 'A medium cluster jewel with three random notable passives from any cluster. Can provide powerful off-class notable combinations.',
  'One With Nothing': 'Grants Hollow Palm Technique, dealing increased damage while unencumbered (no gloves/main-hand/off-hand). Enables unarmed attack builds with massive damage.',
  'Conqueror\'s Efficiency': 'Reduces mana cost and reservation of skills and grants increased skill effect duration. Useful utility jewel.',
  'Conqueror\'s Potency': 'Increases flask effect, curse effect, and aura effect. Boosts multiple scaling mechanics.',
  'Intuitive Leap': 'Allocates passives in radius without connecting them. A less restrictive version of Thread of Hope without the resistance penalty.',
  'Unending Hunger': 'Grants spectres Soul Eater on kill for a duration. Massively empowers spectres during mapping.',
  'The Green Nightmare': 'Grants spell suppression chance per green socket allocated in radius. Strong for evasion builds near green-heavy tree sections.',
  'The Blue Nightmare': 'Grants power charge on block per blue socket allocated in radius. Useful for block builds near intelligence-heavy areas.',
  'The Red Nightmare': 'Grants endurance charge on block per red socket allocated in radius. Useful for block builds near strength-heavy areas.',
  'Efficient Training': 'Converts intelligence in radius to strength. Helps strength-stacking builds that path through int areas.',
  'Brute Force Solution': 'Converts strength in radius to intelligence. Helps int-stacking builds that path through strength areas.',
  'Fertile Mind': 'Converts dexterity in radius to intelligence. Helps int-stacking builds that path through dexterity areas.',
  'Might of the Meek': 'Increases non-notable passives in radius by 50% but disables notables. Powerful near dense small-passive clusters.',
  'Calamitous Visions': 'Transforms Herald of Agony/Ash/Ice/Purity/Thunder into a powerful unique version with altered behaviour.',
  'Ancestral Vision': 'Grants Ancestral Bond keystone for free. Enables totem builds without traveling to the keystone.',
  'Transcendent Flesh': 'Grants critical strike multiplier per strength in radius and reduces cold resistance. Powerful near strength-heavy tree areas.',
  'Transcendent Mind': 'Grants mana regeneration per intelligence in radius and reduces fire resistance. Strong near intelligence-heavy tree areas.',
  'Transcendent Spirit': 'Grants movement speed per dexterity in radius and reduces lightning resistance. Fast builds near dexterity-heavy tree areas.',
  'The Anima Stone': 'Grants +1 to maximum golems if you have 3 primordial jewels. Core for golem builds stacking primordial jewels.',
  'Primordial Might': 'Makes golems aggressive (seeking out enemies) and grants golem damage. Changes golem AI to be proactive.',
  'Primordial Harmony': 'Reduces golem skill cooldown and grants golem damage per golem type. Increases golem uptime and damage.',
  'Primordial Eminence': 'Grants golem buff effect and golem life. Makes golem-provided buffs stronger.',
  'Fortress Covenant': 'Grants massive minion damage and spell block in radius but minions take increased damage. A powerful glass-cannon minion jewel.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL WEAPONS - MISC
  // ---------------------------------------------------------------------------

  'Cospri\'s Will': 'Enemies you curse are poisoned and you can apply an additional curse. Enables tri-curse poison builds. (Body armour)',
  'Lycosidae': 'Your hits cannot be evaded. Removes need for accuracy investment entirely (legacy shield).',
  'Frostbreath': 'Doubles damage against chilled enemies with hits. Massive conditional damage boost for cold-hit builds.',
  'Doryani\'s Catalyst': 'Grants elemental damage and elemental leech. All-purpose elemental sceptre.',
  'Eclipse Solaris': 'Grants spell damage and block chance if you have blocked recently. Defensive spell shield with spell damage.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL BODY ARMOURS
  // ---------------------------------------------------------------------------

  'Replica Farruls Fur': 'Grants cat stealth effects and aspect of the cat charge generation with altered behaviour. Variant of Farrul\'s Fur.',
  'Tinkerskin': 'Recovers life, ES, and mana and generates frenzy charges when your traps are triggered. Core for trap builds needing sustain.',
  'Foxshade': 'Grants evasion and movement speed. Budget leveling/early mapping evasion chest.',
  'Tabula Rasa': 'A six-linked body armour with no stats. Provides a free six-link for any build during leveling and early endgame.',
  'Zahndethus\' Cassock': 'Creates consecrated ground on block. Sustain chest for block builds using the consecrated ground recovery.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL HELMETS
  // ---------------------------------------------------------------------------

  "Geofri's Crest": 'Grants +1 to level of all skill gems socketed and elemental resistances. Budget helmet for gem-level scaling.',
  "The Brine Crown": 'Grants high armour, cannot be frozen, and increases cold damage taken by nearby enemies. Defensive cold-themed helmet.',
  'The Devouring Diadem': 'Grants Eldritch Battery and a feast of flesh skill that consumes corpses for recovery. Converts ES to protect mana and provides sustain.',
  'Honourhome': 'Grants reduced mana reservation and attributes. Budget helmet for aura builds needing reservation efficiency.',
  'Hungry Loop': 'Actually a ring that consumes socketed gems and supports them permanently. Enables a free 5-link in a ring slot.',
  'Obscurantis': 'Grants increased projectile damage per 200 accuracy rating. Powerful for accuracy-stacking projectile builds.',
  'Black Sun Crest': 'Grants +1 to level of socketed gems and increased dexterity. Budget gem-level helmet.',
  'Rime Gaze': 'Socketed gems are supported by Concentrated Effect and grants cold damage. A pseudo 5-link helmet for cold spells.',
  'Indigon': 'Grants increasing spell damage the more mana you spend recently, scaling up to enormous values. Core for mana-spending spell builds.',
  'Starcatcher': 'Increases maximum power charges and grants power charge related bonuses. Useful for power charge stacking builds.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL BOOTS
  // ---------------------------------------------------------------------------

  'Skyforths': 'Grants power charge on critical strike with spells and reduces mana reservation. Also stuns based on ES instead of life.',
  'Legacy of Fury': 'Creates scorched ground that deals fire damage and inflicts scorch on nearby enemies. Massive fire DOT clear and debuff.',
  'Replica Farrul\'s Chase': 'Grants cat stealth-related movement speed and frenzy charges. Speed-oriented variant boots.',
  'The Red Trail': 'Grants frenzy charges when you hit a bleeding enemy while bleeding yourself. Enables frenzy charge generation for bleed builds.',
  'Torchoak Step': 'Grants life regeneration and increased armour. Budget defensive boots.',
  'Sundance': 'Grants increased attack speed and rarity of items found. Budget magic-find boots with some offensive utility.',
  'Wake of Destruction': 'Grants flat lightning damage to attacks and leaves shocked ground. Budget lightning attack boots.',
  'Lioneye\'s Paws': 'Grants Iron Reflexes and socketed gems are supported by Added Fire Damage. Converts evasion to armour automatically.',
  'Alberon\'s Warpath': 'Adds chaos damage to attacks per 80 strength. Core boots for strength-stacking chaos attack builds.',
  'Bones of Ullr': 'Grants +1 to maximum zombies and spectres. Budget boots for summoner builds.',
  'Victario\'s Flight': 'Grants movement speed to you and nearby allies. Budget group-play speed boots.',
  'Three-step Assault': 'Grants increased evasion while you have onslaught and spell dodge. Defensive evasion boots.',
  'Brine Crown': 'See The Brine Crown above - often referred to without "The".',

  // ---------------------------------------------------------------------------
  // ADDITIONAL GLOVES
  // ---------------------------------------------------------------------------

  'Sadima\'s Touch': 'Grants increased quantity of items found and attributes. Classic magic-find gloves.',
  'Lochtonial Caress': 'Grants charge generation on kill and increased attack/cast speed. Strong leveling gloves.',
  'Meginord\'s Vise': 'Grants 100 increased strength and physical damage. Core for strength-stacking builds.',
  'Vaal Caress': 'Grants +2 to level of socketed vaal gems and increased vaal skill damage. Niche for vaal skill builds.',
  "Asenath's Mark": 'Grants mana on hit and spell damage. Budget spellcaster gloves.',
  'Thunderfist': 'Socketed gems are supported by Added Lightning Damage and grants lightning damage. A pseudo 5-link for lightning skills.',
  'Volkuur\'s Guidance': 'Adds elemental damage as poison (fire, cold, or lightning variant). Enables elemental poison builds.',
  'Null and Void': 'Grants Rampage and casts socketed spells on Rampage tier milestones. Combines rampage with automatic spellcasting.',
  'Machina Mitts': 'Grants attack speed and leech bonuses. Decent offensive gloves for attack builds.',
  'Architect\'s Hand': 'Socketed trap skills are supported by Trap and have increased trap throwing speed. A pseudo 5-link for trap builds.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL AMULETS
  // ---------------------------------------------------------------------------

  'Stone of Lazhwar': 'Converts block chance to spell block at 50%. Budget way to gain spell block.',
  'Daresso\'s Salute': 'Grants weapon range, movement speed, and increased damage while not wearing a chest. Used in specific no-armour builds.',
  'Extractor Mentis': 'Grants power and frenzy charges based on minion kills. Used in minion builds that want charge generation.',
  'Hinekora\'s Sight': 'Grants Cannot be Blinded, increased accuracy, and spell suppression. Defensive utility amulet.',
  'The Aylardex': 'Converts power charges to increased mana and reduces power charge critical strike bonus. Niche for mana-focused builds.',
  'Presence of Chayula': 'Grants Stun Immunity and converts 20% of max life to energy shield. Core for CI/Low-life builds needing stun immunity.',
  'Rashkaldor\'s Patience': 'Increases the quality of socketed gems and grants item quantity. Budget amulet for quality and MF scaling.',
  'Astramentis': 'Grants massive all-attribute bonuses. Core for omniscience builds or any build that needs many attributes.',
  'Marohi Erqi': 'Actually a mace. Grants massive physical damage and built-in Increased AoE support. A slow, devastating two-hand mace.',
  'Victario\'s Acuity': 'Grants charges to allies on critical strike. A support amulet for party play.',
  'Night\'s Hold': 'Socketed gem is supported by multiple support gems at level 10. A pseudo 5-link in an amulet slot for leveling.',
  'Defiance of Destiny': 'Restores a portion of missing life before a hit lands, effectively giving you a pre-heal. Powerful defensive amulet against big hits.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL RINGS
  // ---------------------------------------------------------------------------

  'Andvarius': 'Grants massive rarity of items found but reduces resistances. Classic MF ring.',
  'Dream Fragments': 'Grants cannot be frozen and increased maximum mana. Provides freeze immunity without a flask suffix.',
  'Lori\'s Lantern': 'Grants chaos resistance and defensive bonuses when on low life. Budget defensive ring for low-life builds.',
  'Shavronne\'s Revelation': 'Right ring slot: massive ES regen but no mana regen. Left ring slot: massive mana regen but no ES regen. Slot-dependent mechanic.',
  'Valyrium': 'Stun threshold is based on energy shield instead of life. Prevents stunlock for CI characters.',
  'Rigwald\'s Crest': 'Grants the Aspect of the Wolf skill. A compact way to add wolf pack bonuses.',
  'The Pariah': 'Grants massive bonuses per socket colour: red gives life, green gives dexterity, blue gives intelligence, white gives quantity.',
  'Vivinsect': 'Grants increased effect of heralds and herald-specific bonuses. A herald-enhancing ring.',
  'Tasalio\'s Sign': 'Creates chilled ground on kill and adds cold damage. Defensive and offensive cold utility ring.',
  'Valako\'s Sign': 'Creates shocked ground and grants lightning damage. Offensive lightning utility ring.',
  'Ngamahu\'s Sign': 'Creates ignited ground and grants fire damage. Offensive fire utility ring.',
  'Praxis': 'Grants massive mana and reduced mana cost. Solves mana issues for any build.',
  'Perandus Signet': 'Grants increased intelligence and experience gain. Used for leveling and intelligence stacking.',
  'Putembo\'s Valley': 'Grants additional curse and hex-related bonuses. Useful for multi-curse builds.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL QUIVERS
  // ---------------------------------------------------------------------------

  'Broadstroke': 'Grants increased projectile damage and attack speed. A solid generic offensive quiver.',
  'The Fracturing Spinner': 'Creates lingering projectile effects. Niche quiver for specific interaction builds.',
  'Victario\'s Quiver': 'Grants projectile speed and damage and has chance to grant frenzy charge on kill. Budget quiver.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL WEAPONS
  // ---------------------------------------------------------------------------

  'Tempestuous Steel': 'Grants extra cold and lightning damage from physical. Budget tri-element conversion sword.',
  'The Princess': 'Grants extra cold damage from physical damage. Used for physical-to-cold conversion offhand.',
  'Beltimber Blade': 'Grants additional projectiles with far shot while dual wielding. Strong for dual-wield projectile attack builds.',
  'Dreamfeather': 'Grants increased attack damage per 450 evasion rating. Core sword for evasion-stacking attack builds.',
  'The Rippling Thoughts': 'Triggers Storm Cascade on hit. Automated lightning spell procs during melee combat.',
  'United in Dream': 'Grants Envy aura to you and minions and causes minions to poison. Core for poison minion builds.',
  'Ephemeral Edge': 'Increases maximum energy shield by 30% but reduces maximum life. Pure ES-scaling sword.',
  'The Cauteriser': 'Grants fire damage and a burning ground effect on hit. Solid leveling two-hand axe.',
  'Hezmana\'s Bloodlust': 'Grants Blood Magic to attacks, removing mana cost of attack skills. Used in builds with no mana sustain.',
  'Moonbender\'s Wing': 'Converts physical damage to random elements and grants elemental damage. A versatile elemental conversion axe.',
  'Relentless Fury': 'Grants culling strike and onslaught on kill. A reliable mapping axe.',
  'Wings of Entropy': 'Counts as dual wielding while being a two-hand weapon, granting dual wield bonuses with two-hand damage. Unique mechanical interaction.',
  'Shimmeron': 'Grants massive spell damage and crit per power charge but degenerates ES per charge during non-crit. Used in power charge crit builds.',
  'Storm Prison': 'Grants a power charge on kill and increased spell damage per power charge. Budget power charge wand.',
  'Malachai\'s Simula': 'Actually a helmet. Grants Blood Magic and added damage. Used for Blood Magic builds.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL FLASKS
  // ---------------------------------------------------------------------------

  'Soul Ripper': 'Grants Vaal souls on use instead of recovering life/mana. Enables frequent Vaal skill usage.',
  'Replica Rumi\'s Concoction': 'Grants spell block instead of attack and spell block. Focused purely on spell block.',
  'The Traitor': 'Actually a keystone from Timeless jewel, not a flask.',
  'Oriath\'s End': 'Enemies you kill during flask effect explode. Provides pack-clearing explosions.',
  'Bottled Storm': 'Creates a storm that hits enemies with lightning on use. Automated lightning damage.',
  'The Writhing Jar': 'Creates two worm minions that can be killed for on-kill triggers. Essential for boss-phase on-kill mechanics.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL SHIELDS
  // ---------------------------------------------------------------------------

  'Victario\'s Charity': 'Grants frenzy and power charges to nearby allies on kill and hit. The default aura-bot support shield.',
  'The Deep One\'s Hide': 'Grants high life and cold resistance with vulnerability on hit. Applies a powerful curse automatically.',
  'Trolltimber Spire': 'Grants totem life and causes totems to regenerate your life. Sustain shield for totem builds.',
  'Redblade Banner': 'Warcries count as if you have maximum power, always fully exerting. Enables instant maximum warcry effects.',
  'Malachai\'s Loop': 'Grants power charges rapidly but discharges them all at max, shocking you. Used in discharge and self-shock builds.',
  'Rathpith Globe': 'Grants spell damage and critical strike chance but deals damage to you on spell cast. High risk-reward spellcaster shield.',

  // ---------------------------------------------------------------------------
  // ADDITIONAL JEWELS
  // ---------------------------------------------------------------------------

  'Emperor\'s Mastery': 'Grants all attributes and resistances. A convenient stat-fixing jewel.',
  'Emperor\'s Might': 'Grants strength and physical damage. A straightforward damage jewel.',
  'Emperor\'s Wit': 'Grants intelligence and spell damage. Useful for spellcaster stat-fixing.',
  'Emperor\'s Cunning': 'Grants dexterity and attack speed. Useful for dex-fixing with damage.',
  'Watchers Eye': 'See Watcher\'s Eye above - alternate spelling commonly used.',
  'The Golden Rule': 'Reflects poison you inflict onto yourself. Used in self-poison builds for synergy with other mechanics.',
  'Atziri\'s Reign': 'Increases Vaal skill duration. Extends the uptime of all Vaal skills.',
  'Energy From Within': 'Converts life increases in radius to energy shield increases. Core for ES builds near life clusters.',
  'Healthy Mind': 'Converts life increases in radius to mana increases. Used in mana-stacking builds.',
  'Clear Mind': 'Grants spell damage when you have no auras on mana. Rewards builds that reserve zero mana.',
  'Quickening Covenant': 'Grants minion cast speed and minion damage but minions cannot use attacks. Used for spell-based minion builds.',
  'Ghastly Eye Jewel': 'An abyss jewel base that can roll minion mods. Not a unique but frequently mentioned in context of Tombfist and Darkness Enthroned.',
  'Searching Eye Jewel': 'An abyss jewel base that can roll attack mods. Core for Tombfist and Darkness Enthroned attack builds.',
  'Murderous Eye Jewel': 'An abyss jewel base that can roll life and damage mods. The most common abyss jewel for attack builds.',
  'Hypnotic Eye Jewel': 'An abyss jewel base that can roll spell mods. Used for spellcasters with abyss jewel sockets.',
  'Large Cluster Jewel': 'A customizable jewel that adds a new passive cluster to the tree. Not a unique but central to endgame passive optimization.',
  'Medium Cluster Jewel': 'A customizable jewel that sockets into large clusters for additional notables. Not a unique but essential for cluster stacking.',
  'Small Cluster Jewel': 'A customizable jewel providing specific defensive or utility notables. Not a unique but useful for targeted bonuses.',
  'Replica Conqueror\'s Efficiency': 'Grants reduced mana reservation with altered bonuses from the original. Useful in aura builds.',
  'Lioneye\'s Fall': 'Transforms melee and melee weapon modifiers in radius to bow modifiers. Enables bow builds to use melee clusters.',
};
