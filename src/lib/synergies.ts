// ---------------------------------------------------------------------------
// Build Synergy Detection Engine for Path of Exile
// ---------------------------------------------------------------------------

// ---- Interfaces -----------------------------------------------------------

export interface SynergyRule {
  id: string;
  name: string;
  category: "offensive" | "defensive" | "utility" | "conversion";
  severity: "critical" | "notable" | "info";
  description: string;
  explanation: string;
  detect: (data: SynergyData) => boolean;
}

export interface DetectedSynergy {
  rule: SynergyRule;
}

export interface SynergyData {
  keystones: string[];
  activeSkills: Array<{ name: string; isVaal: boolean }>;
  supports: string[];
  conditions: string[];
  multipliers: Record<string, number>;
  stats: Record<string, number>;
  ascendancy: { className: string; ascendClassName: string };
  uniques: Array<{ name: string; base: string }>;
  conversionTable: Record<
    string,
    {
      conversion: Record<string, number>;
      gain: Record<string, number>;
      mult: number;
    }
  >;
  skillFlags: string[];
}

// ---- Helpers --------------------------------------------------------------

function hasKeystone(data: SynergyData, name: string): boolean {
  const lower = name.toLowerCase()
  return data.keystones.some((k) => k.toLowerCase() === lower) ||
    data.conditions.some((c) => c.toLowerCase() === lower || c.toLowerCase() === `have${lower.replace(/\s+/g, '')}`)
}

function hasSkillFlag(data: SynergyData, flag: string): boolean {
  return data.skillFlags.some((f) => f.toLowerCase() === flag.toLowerCase());
}

function hasSupport(data: SynergyData, name: string): boolean {
  return data.supports.some((s) => s.toLowerCase().includes(name.toLowerCase()));
}

function hasActiveSkill(data: SynergyData, name: string): boolean {
  return data.activeSkills.some(
    (s) => s.name.toLowerCase() === name.toLowerCase(),
  );
}

function hasUnique(data: SynergyData, name: string): boolean {
  return data.uniques.some(
    (u) => u.name.toLowerCase() === name.toLowerCase(),
  );
}

function hasCondition(data: SynergyData, name: string): boolean {
  return data.conditions.some(
    (c) => c.toLowerCase() === name.toLowerCase(),
  );
}

function stat(data: SynergyData, key: string): number {
  return data.stats[key] ?? 0;
}

function multiplier(data: SynergyData, key: string): number {
  return data.multipliers[key] ?? 0;
}

// ---- Severity sort weight -------------------------------------------------

const severityWeight: Record<SynergyRule["severity"], number> = {
  critical: 0,
  notable: 1,
  info: 2,
};

// ---- Rule Definitions -----------------------------------------------------

const SYNERGY_RULES: SynergyRule[] = [
  // ===================== OFFENSIVE ==========================================

  {
    id: "trinity-multi-element",
    name: "Trinity Support",
    category: "offensive",
    severity: "critical",
    description: "Trinity Support with multi-element damage",
    explanation:
      "Trinity requires dealing damage of at least two different elements to " +
      "generate and spend Resonance stacks. This build hits with multiple " +
      "element types, enabling full Trinity uptime for a large damage multiplier.",
    detect(data) {
      return hasSupport(data, "Trinity");
    },
  },

  {
    id: "elemental-overload-low-crit",
    name: "Elemental Overload",
    category: "offensive",
    severity: "notable",
    description: "Elemental Overload with low critical strike chance",
    explanation:
      "Elemental Overload grants 40% more elemental damage when you crit, " +
      "but removes extra critical strike multiplier. This is most efficient " +
      "when crit chance is low, providing a large damage boost without " +
      "investing in crit scaling.",
    detect(data) {
      return hasKeystone(data, "Elemental Overload") && stat(data, "CritChance") < 30;
    },
  },

  {
    id: "impale-stacking",
    name: "High Impale Chance",
    category: "offensive",
    severity: "critical",
    description: "Impale chance at 60% or above",
    explanation:
      "Impale stores a portion of physical hit damage and replays it on " +
      "subsequent hits. At 60%+ impale chance, impale stacks accumulate " +
      "reliably for a massive sustained physical damage increase.",
    detect(data) {
      return stat(data, "ImpaleChance") >= 60;
    },
  },

  {
    id: "point-blank-projectile",
    name: "Point Blank",
    category: "offensive",
    severity: "notable",
    description: "Point Blank with projectile skills",
    explanation:
      "Point Blank causes projectile attacks to deal up to 30% more damage " +
      "at close range. Paired with a projectile skill, this is a significant " +
      "damage boost for builds that fight at melee distance.",
    detect(data) {
      return (
        (hasKeystone(data, "Point Blank") || hasSupport(data, "Point Blank")) &&
        hasSkillFlag(data, "projectile")
      );
    },
  },

  {
    id: "far-shot-projectile",
    name: "Far Shot",
    category: "offensive",
    severity: "notable",
    description: "Far Shot with projectile skills",
    explanation:
      "Far Shot causes projectile attacks to deal up to 30% more damage at " +
      "long range. Combined with a projectile skill, this rewards keeping " +
      "distance from enemies for a substantial damage increase.",
    detect(data) {
      return (
        (hasKeystone(data, "Far Shot") || hasCondition(data, "FarShot")) &&
        hasSkillFlag(data, "projectile")
      );
    },
  },

  {
    id: "rage-berserk",
    name: "Rage + Berserk",
    category: "offensive",
    severity: "critical",
    description: "Berserk skill with Rage generation",
    explanation:
      "Berserk consumes Rage to grant massive attack damage, speed, and " +
      "damage reduction. Having Rage generation alongside Berserk enables " +
      "a powerful burst window for both offense and defense.",
    detect(data) {
      return (
        hasActiveSkill(data, "Berserk") &&
        (multiplier(data, "Rage") > 0 || hasCondition(data, "CanGainRage"))
      );
    },
  },

  {
    id: "archmage-high-mana",
    name: "Archmage Support",
    category: "offensive",
    severity: "critical",
    description: "Archmage Support with high mana pool (3000+)",
    explanation:
      "Archmage adds lightning damage to spells based on unreserved mana. " +
      "With a mana pool of 3000 or more, the added flat damage is enormous, " +
      "making mana stacking one of the highest scaling damage strategies.",
    detect(data) {
      return hasSupport(data, "Archmage") && stat(data, "Mana") > 3000;
    },
  },

  {
    id: "spell-echo-detected",
    name: "Spell Echo Support",
    category: "offensive",
    severity: "info",
    description: "Spell Echo for double-cast speed",
    explanation:
      "Spell Echo causes spells to repeat an additional time at faster cast " +
      "speed, effectively doubling spell output at the cost of some damage " +
      "per cast. Excellent for hit-based or ignite spells.",
    detect(data) {
      return hasSupport(data, "Spell Echo");
    },
  },

  {
    id: "multistrike-detected",
    name: "Multistrike Support",
    category: "offensive",
    severity: "info",
    description: "Multistrike for repeated melee strikes",
    explanation:
      "Multistrike repeats melee attacks two additional times with increasing " +
      "damage, greatly boosting attack speed and sustained DPS for melee builds.",
    detect(data) {
      return hasSupport(data, "Multistrike");
    },
  },

  {
    id: "gmp-detected",
    name: "Greater Multiple Projectiles",
    category: "offensive",
    severity: "info",
    description: "GMP for wide projectile coverage",
    explanation:
      "Greater Multiple Projectiles fires four extra projectiles at a damage " +
      "penalty, providing excellent area coverage for clearing packs of monsters.",
    detect(data) {
      return hasSupport(data, "Greater Multiple Projectiles");
    },
  },

  {
    id: "vaal-skill-synergy",
    name: "Vaal Skill Synergy",
    category: "offensive",
    severity: "notable",
    description: "Vaal version of main skill available",
    explanation:
      "Vaal skill gems grant access to both the regular and Vaal versions of " +
      "a skill. The Vaal version provides a powerful burst ability fuelled by " +
      "souls collected from kills, adding a strong damage spike to the build.",
    detect(data) {
      return data.activeSkills.some((s) => s.isVaal);
    },
  },

  {
    id: "mirage-archer-bow",
    name: "Mirage Archer",
    category: "offensive",
    severity: "notable",
    description: "Mirage Archer with bow / projectile skill",
    explanation:
      "Mirage Archer summons a copy that fires your bow skill automatically, " +
      "granting free extra attacks while you move or dodge. This greatly " +
      "increases effective DPS uptime for projectile bow builds.",
    detect(data) {
      return (
        hasSupport(data, "Mirage Archer") &&
        (hasSkillFlag(data, "projectile") || hasSkillFlag(data, "bow"))
      );
    },
  },

  {
    id: "totem-playstyle",
    name: "Totem Playstyle",
    category: "offensive",
    severity: "notable",
    description: "Totem-based skill deployment detected",
    explanation:
      "Totem builds place totems that cast or attack on your behalf, allowing " +
      "you to focus on positioning and dodging. This playstyle trades direct " +
      "control for safety and hands-free damage.",
    detect(data) {
      return (
        hasSkillFlag(data, "totem") ||
        hasSupport(data, "Spell Totem") ||
        hasSupport(data, "Ballista Totem")
      );
    },
  },

  {
    id: "mine-playstyle",
    name: "Mine Playstyle",
    category: "offensive",
    severity: "notable",
    description: "Mine-based skill deployment detected",
    explanation:
      "Mines are thrown and then detonated in sequence, allowing you to " +
      "pre-load enormous burst damage. Mine builds excel at bossing due " +
      "to their ability to stack and detonate many mines at once.",
    detect(data) {
      return (
        hasSkillFlag(data, "mine") ||
        hasSupport(data, "High-Impact Mine") ||
        hasSupport(data, "Blastchain Mine")
      );
    },
  },

  {
    id: "trap-playstyle",
    name: "Trap Playstyle",
    category: "offensive",
    severity: "notable",
    description: "Trap-based skill deployment detected",
    explanation:
      "Traps are thrown and trigger when enemies approach, dealing damage " +
      "independently. Trap builds benefit from throwing speed and can " +
      "front-load large amounts of burst damage safely.",
    detect(data) {
      return (
        hasSkillFlag(data, "trap") ||
        hasSupport(data, "Trap") ||
        hasSupport(data, "Advanced Traps") ||
        hasSupport(data, "Cluster Traps")
      );
    },
  },

  {
    id: "power-charge-stacking",
    name: "Power Charge Stacking",
    category: "offensive",
    severity: "notable",
    description: "6+ Power Charges for high crit scaling",
    explanation:
      "Each Power Charge grants 40% increased critical strike chance. With " +
      "6 or more charges, the cumulative crit bonus is significant, and " +
      "many uniques and passives scale with the number of Power Charges.",
    detect(data) {
      return multiplier(data, "PowerCharges") >= 6;
    },
  },

  {
    id: "frenzy-charge-stacking",
    name: "Frenzy Charge Stacking",
    category: "offensive",
    severity: "notable",
    description: "6+ Frenzy Charges for high attack/cast speed",
    explanation:
      "Each Frenzy Charge grants 4% increased attack and cast speed and 4% " +
      "more damage. Stacking 6 or more provides a substantial combined " +
      "speed and damage multiplier.",
    detect(data) {
      return multiplier(data, "FrenzyCharges") >= 6;
    },
  },

  // ===================== DEFENSIVE ==========================================

  {
    id: "ci-ghost-dance",
    name: "CI + Ghost Dance",
    category: "defensive",
    severity: "critical",
    description: "Chaos Inoculation paired with Ghost Dance / Ghost Shroud",
    explanation:
      "Chaos Inoculation sets life to 1 and grants immunity to chaos damage, " +
      "making the build fully reliant on Energy Shield. Ghost Dance recovers " +
      "ES when hit, providing a powerful layered ES recovery mechanism.",
    detect(data) {
      return (
        hasKeystone(data, "Chaos Inoculation") &&
        (hasKeystone(data, "Ghost Dance") || hasCondition(data, "GhostShroud"))
      );
    },
  },

  {
    id: "mind-over-matter",
    name: "Mind over Matter",
    category: "defensive",
    severity: "notable",
    description: "Mind over Matter keystone active",
    explanation:
      "Mind over Matter redirects 40% of damage taken from life to mana, " +
      "effectively increasing the damage pool by using mana as a secondary " +
      "health buffer. Most effective with a large unreserved mana pool.",
    detect(data) {
      return hasKeystone(data, "Mind over Matter");
    },
  },

  {
    id: "glancing-blows-block",
    name: "Glancing Blows + Block",
    category: "defensive",
    severity: "notable",
    description: "Glancing Blows with high block chance",
    explanation:
      "Glancing Blows doubles block chance but blocked hits deal 65% of " +
      "their original damage. With high base block, this keystone provides " +
      "very consistent damage mitigation at the cost of some damage taken " +
      "on blocks.",
    detect(data) {
      return (
        hasKeystone(data, "Glancing Blows") &&
        (stat(data, "BlockChance") >= 40 || stat(data, "SpellBlockChance") >= 40)
      );
    },
  },

  {
    id: "acrobatics-phase",
    name: "Acrobatics / Phase Acrobatics",
    category: "defensive",
    severity: "notable",
    description: "Acrobatics and/or Phase Acrobatics keystone",
    explanation:
      "Acrobatics grants dodge chance for attacks, and Phase Acrobatics " +
      "extends that to spells. Together they provide a strong probabilistic " +
      "defense layer favoured by evasion-based builds.",
    detect(data) {
      return (
        hasKeystone(data, "Acrobatics") || hasKeystone(data, "Phase Acrobatics")
      );
    },
  },

  {
    id: "fortify-detected",
    name: "Fortify",
    category: "defensive",
    severity: "notable",
    description: "Fortify buff active or supported",
    explanation:
      "Fortify grants 20% less damage taken from hits. It is one of the " +
      "most effective generic defensive layers for melee characters and is " +
      "easy to maintain with melee attacks.",
    detect(data) {
      return (
        hasCondition(data, "Fortified") ||
        hasCondition(data, "Fortify") ||
        hasSupport(data, "Fortify")
      );
    },
  },

  {
    id: "endurance-charge-stacking",
    name: "Endurance Charge Stacking",
    category: "defensive",
    severity: "notable",
    description: "4+ Endurance Charges for physical damage reduction",
    explanation:
      "Each Endurance Charge grants 4% physical damage reduction and 4% to " +
      "all elemental resistances. Stacking 4 or more provides a significant " +
      "layer of passive mitigation.",
    detect(data) {
      return multiplier(data, "EnduranceCharges") >= 4;
    },
  },

  {
    id: "divine-shield",
    name: "Divine Shield",
    category: "defensive",
    severity: "notable",
    description: "Divine Shield keystone active",
    explanation:
      "Divine Shield regenerates Energy Shield based on physical damage " +
      "prevented by armour. This creates strong synergy between armour " +
      "stacking and ES recovery for hybrid or CI builds.",
    detect(data) {
      return hasKeystone(data, "Divine Shield");
    },
  },

  // ===================== CONVERSION =========================================

  {
    id: "avatar-of-fire-conversion",
    name: "Avatar of Fire + Conversion Chain",
    category: "conversion",
    severity: "critical",
    description: "Avatar of Fire with element-to-fire conversion chain",
    explanation:
      "Avatar of Fire converts 50% of all non-fire damage to fire and " +
      "prevents dealing non-fire damage. When combined with additional " +
      "conversion sources (e.g. Cold to Fire), this enables full damage " +
      "conversion to fire for massive scaling with fire modifiers.",
    detect(data) {
      if (!hasKeystone(data, "Avatar of Fire")) return false;
      const fireEntry = data.conversionTable["Fire"];
      if (!fireEntry) return true; // AoF alone is already notable
      const totalConvToFire = Object.values(fireEntry.conversion).reduce(
        (sum, v) => sum + v,
        0,
      );
      return totalConvToFire > 50;
    },
  },

  {
    id: "full-phys-to-ele-conversion",
    name: "Full Physical-to-Element Conversion",
    category: "conversion",
    severity: "critical",
    description: "Physical damage almost fully converted to elemental",
    explanation:
      "When nearly all physical damage is converted to elemental, the build " +
      "can scale exclusively with elemental modifiers while still benefiting " +
      "from sources of added physical damage. This opens up powerful double " +
      "dipping on both physical and elemental scaling.",
    detect(data) {
      const physEntry = data.conversionTable["Physical"];
      if (!physEntry) return false;
      return physEntry.mult < 0.1;
    },
  },

  {
    id: "cold-to-fire-conversion",
    name: "Cold to Fire Conversion",
    category: "conversion",
    severity: "notable",
    description: "Cold to Fire conversion path detected",
    explanation:
      "Converting cold damage to fire (via the Cold to Fire support or other " +
      "sources) allows a build to benefit from both cold and fire scaling " +
      "modifiers, and pairs naturally with Avatar of Fire for full fire " +
      "conversion chains.",
    detect(data) {
      return (
        hasSupport(data, "Cold to Fire") ||
        (() => {
          const fireEntry = data.conversionTable["Fire"];
          if (!fireEntry) return false;
          return (fireEntry.conversion["Cold"] ?? 0) > 0;
        })()
      );
    },
  },

  {
    id: "ele-as-extra-chaos",
    name: "Elemental Damage as Extra Chaos",
    category: "conversion",
    severity: "notable",
    description: "Elemental damage gained as extra chaos damage",
    explanation:
      "Gaining elemental damage as extra chaos damage effectively multiplies " +
      "total damage output without replacing the original element. This is " +
      "powerful because chaos damage bypasses energy shield by default and " +
      "adds a separate damage type for penetration purposes.",
    detect(data) {
      // Check gain entries in the conversion table for chaos
      const chaosEntry = data.conversionTable["Chaos"];
      if (!chaosEntry) return false;
      const totalGain = Object.values(chaosEntry.gain).reduce(
        (sum, v) => sum + v,
        0,
      );
      return totalGain > 0;
    },
  },

  // ===================== UTILITY ============================================

  {
    id: "headhunter-equipped",
    name: "Headhunter",
    category: "utility",
    severity: "critical",
    description: "Headhunter belt equipped",
    explanation:
      "Headhunter steals a random modifier from each Rare monster you kill, " +
      "snowballing into absurd levels of speed, damage, and size in dense " +
      "maps. It is the most iconic chase unique in Path of Exile.",
    detect(data) {
      return hasUnique(data, "Headhunter");
    },
  },

  {
    id: "mageblood-equipped",
    name: "Mageblood",
    category: "utility",
    severity: "critical",
    description: "Mageblood belt equipped",
    explanation:
      "Mageblood makes your first four flask suffixes permanent, granting " +
      "constant uptime on powerful utility and defensive flask effects " +
      "without requiring flask charges. This is one of the strongest " +
      "quality-of-life and power items in the game.",
    detect(data) {
      return hasUnique(data, "Mageblood");
    },
  },

  {
    id: "inspired-learning",
    name: "Inspired Learning Jewel",
    category: "utility",
    severity: "info",
    description: "Inspired Learning jewel detected",
    explanation:
      "Inspired Learning is a budget version of Headhunter, stealing one " +
      "modifier from a slain Rare monster when socketed near a notable " +
      "keystone cluster. Multiple copies stack for more stolen modifiers.",
    detect(data) {
      return hasUnique(data, "Inspired Learning");
    },
  },

  {
    id: "badge-of-the-brotherhood",
    name: "Badge of the Brotherhood",
    category: "utility",
    severity: "critical",
    description: "Badge of the Brotherhood amulet equipped",
    explanation:
      "Badge of the Brotherhood sets maximum Frenzy Charges equal to maximum " +
      "Power Charges. Builds that stack Power Charges can leverage this to " +
      "also gain massive Frenzy Charge benefits, multiplying both crit and " +
      "speed scaling simultaneously.",
    detect(data) {
      return hasUnique(data, "Badge of the Brotherhood");
    },
  },
];

// ---- Public API -----------------------------------------------------------

/**
 * Run all synergy rules against the given build data and return matching
 * synergies sorted by severity (critical > notable > info).
 */
export function detectSynergies(data: SynergyData): DetectedSynergy[] {
  const detected: DetectedSynergy[] = [];

  for (const rule of SYNERGY_RULES) {
    try {
      if (rule.detect(data)) {
        detected.push({ rule });
      }
    } catch {
      // Silently skip rules that fail due to missing data fields.
    }
  }

  detected.sort(
    (a, b) => severityWeight[a.rule.severity] - severityWeight[b.rule.severity],
  );

  return detected;
}
