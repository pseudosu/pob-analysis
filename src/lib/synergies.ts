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
  dpsImpact?: number;      // absolute DPS delta when this synergy is removed
  dpsImpactPct?: number;   // percentage DPS delta
  ehpImpact?: number;      // absolute EHP delta
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

  // --- Keystone Synergies (offensive) ---

  {
    id: "iron-will-str-stack",
    name: "Iron Will + STR Stacking",
    category: "offensive",
    severity: "notable",
    description: "Iron Will with 300+ Strength",
    explanation:
      "Iron Will applies the STR bonus to spell damage. With 300+ STR, " +
      "this provides significant added spell damage scaling.",
    detect(data) {
      return hasKeystone(data, "Iron Will") && stat(data, "Str") > 300;
    },
  },

  {
    id: "perfect-agony-crit",
    name: "Perfect Agony + High Crit Multi",
    category: "offensive",
    severity: "notable",
    description: "Perfect Agony with 200%+ crit multiplier",
    explanation:
      "Perfect Agony applies crit multi to ailment damage at 150% " +
      "effectiveness. High crit multi makes poison/bleed/ignite scale " +
      "enormously.",
    detect(data) {
      return (
        hasKeystone(data, "Perfect Agony") &&
        stat(data, "CritMultiplier") > 200
      );
    },
  },

  {
    id: "elemental-equilibrium",
    name: "Elemental Equilibrium",
    category: "offensive",
    severity: "notable",
    description: "Elemental Equilibrium keystone active",
    explanation:
      "EE causes hits to lower resistance to elements NOT matching the " +
      "hit. Enables -50% ele res with proper element rotation.",
    detect(data) {
      return hasKeystone(data, "Elemental Equilibrium");
    },
  },

  {
    id: "resolute-technique-no-crit",
    name: "Resolute Technique",
    category: "offensive",
    severity: "info",
    description: "Resolute Technique with no crit investment",
    explanation:
      "Resolute Technique removes all crit in exchange for never missing. " +
      "With no crit investment, this is pure upside for reliable damage.",
    detect(data) {
      return (
        hasKeystone(data, "Resolute Technique") &&
        stat(data, "CritChance") < 10
      );
    },
  },

  {
    id: "crimson-dance-bleed",
    name: "Crimson Dance",
    category: "offensive",
    severity: "notable",
    description: "Crimson Dance for bleed stacking",
    explanation:
      "Crimson Dance allows bleeds to stack up to 8 times and removes the " +
      "moving bleed bonus. Essential for bleed-stacking builds.",
    detect(data) {
      return hasKeystone(data, "Crimson Dance");
    },
  },

  {
    id: "precise-technique",
    name: "Precise Technique",
    category: "offensive",
    severity: "notable",
    description: "Precise Technique keystone active",
    explanation:
      "Precise Technique grants 40% more attack damage when accuracy is " +
      "higher than life. Strong for accuracy-stacking non-crit builds.",
    detect(data) {
      return hasKeystone(data, "Precise Technique");
    },
  },

  {
    id: "call-to-arms",
    name: "Call to Arms",
    category: "offensive",
    severity: "info",
    description: "Call to Arms for instant warcries",
    explanation:
      "Call to Arms makes warcries instant and triggers them automatically. " +
      "Quality of life for warcry-based builds.",
    detect(data) {
      return hasKeystone(data, "Call to Arms");
    },
  },

  // --- Ascendancy Synergies (offensive) ---

  {
    id: "assassin-crit-scaling",
    name: "Assassin Crit Scaling",
    category: "offensive",
    severity: "notable",
    description: "Assassin ascendancy with high crit chance",
    explanation:
      "Assassin's ascendancy nodes provide massive crit chance, crit " +
      "multi, and power charge generation. High crit synergizes with all " +
      "Assassin nodes.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Assassin" &&
        stat(data, "CritChance") > 50
      );
    },
  },

  {
    id: "raider-frenzy-speed",
    name: "Raider Frenzy Stacking",
    category: "offensive",
    severity: "notable",
    description: "Raider with 4+ frenzy charges",
    explanation:
      "Raider generates and enhances frenzy charges, granting massive " +
      "attack speed, movement speed, and evasion. Frenzy stacking is " +
      "core to Raider.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Raider" &&
        multiplier(data, "FrenzyCharges") >= 4
      );
    },
  },

  {
    id: "deadeye-projectile",
    name: "Deadeye Projectile Synergy",
    category: "offensive",
    severity: "notable",
    description: "Deadeye with projectile skills",
    explanation:
      "Deadeye's ascendancy enhances projectiles with additional chains, " +
      "pierce, and far shot. Projectile skills gain huge clear and " +
      "single-target.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Deadeye" &&
        hasSkillFlag(data, "projectile")
      );
    },
  },

  {
    id: "elementalist-golem",
    name: "Elementalist Golem Synergy",
    category: "offensive",
    severity: "notable",
    description: "Elementalist with active golems",
    explanation:
      "Elementalist's Liege of the Primordial and Elemancer make golems " +
      "incredibly strong, providing massive buffs and immunity to reflect.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Elementalist" &&
        data.activeSkills.some((s) =>
          s.name.toLowerCase().includes("golem"),
        )
      );
    },
  },

  {
    id: "berserker-rage-gen",
    name: "Berserker Rage Synergy",
    category: "offensive",
    severity: "notable",
    description: "Berserker with Rage generation",
    explanation:
      "Berserker gains massive attack damage and speed from Rage, plus " +
      "has unique Rage sustain mechanics. Core for Rage-based melee.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Berserker" &&
        (multiplier(data, "Rage") > 0 || hasCondition(data, "CanGainRage"))
      );
    },
  },

  {
    id: "champion-fortify-permanent",
    name: "Champion Permanent Fortify",
    category: "offensive",
    severity: "notable",
    description: "Champion with Fortify active",
    explanation:
      "Champion's Fortitude grants permanent Fortify, freeing up a support " +
      "gem slot and providing 20% less damage taken from hits at all times.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Champion" &&
        (hasCondition(data, "Fortified") || hasCondition(data, "Fortify"))
      );
    },
  },

  {
    id: "pathfinder-flask-effect",
    name: "Pathfinder Flask Mastery",
    category: "offensive",
    severity: "notable",
    description: "Pathfinder ascendancy for flask effect",
    explanation:
      "Pathfinder's ascendancy provides massive flask effect, flask " +
      "charge generation, and elemental immunity during flask effect. " +
      "Core for flask-dependent builds.",
    detect(data) {
      return data.ascendancy.ascendClassName === "Pathfinder";
    },
  },

  {
    id: "inquisitor-crit-ignore-res",
    name: "Inquisitor Crit Ignores Resistance",
    category: "offensive",
    severity: "critical",
    description: "Inquisitor with high crit for resistance bypass",
    explanation:
      "Inquisitor's Inevitable Judgement causes crits to ignore enemy " +
      "elemental resistances entirely. High crit chance means near-permanent " +
      "resistance bypass.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Inquisitor" &&
        stat(data, "CritChance") > 40
      );
    },
  },

  {
    id: "necromancer-offering",
    name: "Necromancer Offering Synergy",
    category: "offensive",
    severity: "notable",
    description: "Necromancer with active offering",
    explanation:
      "Necromancer's Mistress of Sacrifice lets offerings affect you too, " +
      "providing block, attack/cast speed, or ES recovery from corpses.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Necromancer" &&
        data.activeSkills.some((s) =>
          s.name.toLowerCase().includes("offering"),
        )
      );
    },
  },

  {
    id: "hierophant-totem",
    name: "Hierophant Totem Synergy",
    category: "offensive",
    severity: "notable",
    description: "Hierophant with totem skills",
    explanation:
      "Hierophant's Pursuit of Faith and Ritual of Awakening grant extra " +
      "totems, totem placement speed, and mana/ES recovery per totem. " +
      "Core for totem builds.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Hierophant" &&
        hasSkillFlag(data, "totem")
      );
    },
  },

  {
    id: "gladiator-bleed-block",
    name: "Gladiator Bleed / Block",
    category: "offensive",
    severity: "info",
    description: "Gladiator ascendancy for bleed or block",
    explanation:
      "Gladiator excels at bleed builds with Gratuitous Violence (explode) " +
      "and block builds with Painforged. Strong for bleed or max-block.",
    detect(data) {
      return data.ascendancy.ascendClassName === "Gladiator";
    },
  },

  {
    id: "saboteur-mine-trap",
    name: "Saboteur Mine / Trap Synergy",
    category: "offensive",
    severity: "notable",
    description: "Saboteur with mine or trap skills",
    explanation:
      "Saboteur enhances mines and traps with extra throwing speed, " +
      "reduced mana cost, blind, and regeneration. Core for mine/trap builds.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Saboteur" &&
        (hasSkillFlag(data, "mine") || hasSkillFlag(data, "trap"))
      );
    },
  },

  {
    id: "occultist-curse-stack",
    name: "Occultist Curse Stacking",
    category: "offensive",
    severity: "notable",
    description: "Occultist with curse support or conditions",
    explanation:
      "Occultist's Malediction allows an extra curse and provides damage " +
      "per curse. Powerful for multi-curse setups.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Occultist" &&
        (data.conditions.some((c) => c.toLowerCase().includes("curse")) ||
          data.supports.some((s) => s.toLowerCase().includes("curse")))
      );
    },
  },

  {
    id: "guardian-aura-stack",
    name: "Guardian Aura Stacking",
    category: "offensive",
    severity: "critical",
    description: "Guardian with 4+ active auras",
    explanation:
      "Guardian's Radiant Crusade and Unwavering Crusade enhance aura " +
      "effect and provide massive bonuses per aura. Core for aura-stacking " +
      "support.",
    detect(data) {
      const auraNames = [
        "Determination", "Grace", "Discipline", "Hatred", "Anger",
        "Wrath", "Zealotry", "Malevolence", "Pride", "Haste",
        "Vitality", "Clarity", "Purity",
      ];
      const auraCount = data.activeSkills.filter((s) =>
        auraNames.some((a) => s.name.includes(a)),
      ).length;
      return (
        data.ascendancy.ascendClassName === "Guardian" && auraCount >= 4
      );
    },
  },

  {
    id: "trickster-es-sustain",
    name: "Trickster ES Sustain",
    category: "offensive",
    severity: "notable",
    description: "Trickster with 3000+ Energy Shield",
    explanation:
      "Trickster provides ES recovery on kill, ghost shroud ES recovery " +
      "on hit, and action speed. Excellent ES sustain for hybrid or CI.",
    detect(data) {
      return (
        data.ascendancy.ascendClassName === "Trickster" &&
        stat(data, "EnergyShield") > 3000
      );
    },
  },

  {
    id: "chieftain-fire-convert",
    name: "Chieftain Fire Conversion",
    category: "offensive",
    severity: "notable",
    description: "Chieftain with fire conversion",
    explanation:
      "Chieftain provides phys-to-fire conversion, fire leech, and " +
      "covered in ash. Core for fire conversion melee builds.",
    detect(data) {
      if (data.ascendancy.ascendClassName !== "Chieftain") return false;
      const fireEntry = data.conversionTable["Fire"];
      if (!fireEntry) return false;
      const totalConvToFire = Object.values(fireEntry.conversion).reduce(
        (sum, v) => sum + v,
        0,
      );
      return totalConvToFire > 0;
    },
  },

  // --- Support Combo Synergies (offensive) ---

  {
    id: "awakened-support-bonus",
    name: "Awakened Support Gem",
    category: "offensive",
    severity: "info",
    description: "Awakened support gem detected",
    explanation:
      "Awakened support gems provide enhanced effects and sometimes +1 " +
      "gem level to supported active gems. Premium upgrade over regular " +
      "supports.",
    detect(data) {
      return data.supports.some((s) =>
        s.toLowerCase().includes("awakened"),
      );
    },
  },

  {
    id: "empower-scaling",
    name: "Empower Support",
    category: "offensive",
    severity: "notable",
    description: "Empower support for gem level scaling",
    explanation:
      "Empower adds gem levels to the supported active skill. Extremely " +
      "powerful for skills with strong per-level damage scaling.",
    detect(data) {
      return hasSupport(data, "Empower");
    },
  },

  {
    id: "brutality-pure-phys",
    name: "Brutality Pure Physical",
    category: "offensive",
    severity: "notable",
    description: "Brutality with pure physical damage",
    explanation:
      "Brutality prevents dealing non-physical damage but grants massive " +
      "more physical damage. Optimal when the build is pure physical.",
    detect(data) {
      if (!hasSupport(data, "Brutality")) return false;
      const physEntry = data.conversionTable["Physical"];
      if (!physEntry) return true;
      return physEntry.mult > 0.9;
    },
  },

  {
    id: "chain-fork-proj",
    name: "Chain / Fork Projectiles",
    category: "offensive",
    severity: "info",
    description: "Chain or Fork with projectile skills",
    explanation:
      "Chain/Fork support causes projectiles to hit multiple targets " +
      "sequentially, greatly improving clear speed for projectile builds.",
    detect(data) {
      return (
        (hasSupport(data, "Chain") || hasSupport(data, "Fork")) &&
        hasSkillFlag(data, "projectile")
      );
    },
  },

  {
    id: "unleash-spell",
    name: "Unleash Support",
    category: "offensive",
    severity: "info",
    description: "Unleash for burst spell casts",
    explanation:
      "Unleash stores spell casts and releases them all at once, " +
      "providing burst damage windows for self-cast spell builds.",
    detect(data) {
      return hasSupport(data, "Unleash");
    },
  },

  // --- Unique Item Synergies (offensive) ---

  {
    id: "crown-of-eyes-spell-dmg",
    name: "Crown of Eyes",
    category: "offensive",
    severity: "notable",
    description: "Crown of Eyes for spell-to-attack scaling",
    explanation:
      "Crown of Eyes applies increases and reductions to spell damage to " +
      "attack damage at 150%. Powerful for attack builds that can stack " +
      "spell damage.",
    detect(data) {
      return hasUnique(data, "Crown of Eyes");
    },
  },

  {
    id: "doryani-prototype-lightning",
    name: "Doryani's Prototype",
    category: "offensive",
    severity: "critical",
    description: "Doryani's Prototype for negative lightning resistance",
    explanation:
      "Doryani's Prototype makes enemies' lightning resistance equal to " +
      "your lightning resistance. With negative self-lightning-res, enemy " +
      "res goes deeply negative.",
    detect(data) {
      return hasUnique(data, "Doryani's Prototype");
    },
  },

  // --- Condition-Based Synergies (offensive) ---

  {
    id: "low-life-active",
    name: "Low Life Active",
    category: "offensive",
    severity: "notable",
    description: "Low Life condition for Pain Attunement and more",
    explanation:
      "Low Life condition is active, enabling Pain Attunement (30% more " +
      "spell damage) and various low-life specific bonuses.",
    detect(data) {
      // Only trigger on explicit LowLife condition, or if LifeUnreserved is
      // actually present and below 35% of Life (avoid false positive when
      // LifeUnreserved is 0/missing from stats)
      if (hasCondition(data, "LowLife")) return true;
      const lifeUnres = stat(data, "LifeUnreserved");
      const life = stat(data, "Life");
      return lifeUnres > 0 && life > 0 && lifeUnres < life * 0.35;
    },
  },

  {
    id: "full-life-active",
    name: "Full Life Active",
    category: "offensive",
    severity: "info",
    description: "Full Life condition active",
    explanation:
      "Full Life condition is active, enabling bonuses from Close to " +
      "Perfection, etc.",
    detect(data) {
      return hasCondition(data, "FullLife");
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

  // --- New Defensive Keystone Rules ---

  {
    id: "iron-reflexes-evasion",
    name: "Iron Reflexes + High Evasion",
    category: "defensive",
    severity: "notable",
    description: "Iron Reflexes converting 10000+ evasion to armour",
    explanation:
      "Iron Reflexes converts all evasion to armour. With high evasion " +
      "rating, this provides massive armour for physical damage reduction.",
    detect(data) {
      return (
        hasKeystone(data, "Iron Reflexes") &&
        stat(data, "Evasion") > 10000
      );
    },
  },

  {
    id: "wind-dancer-evasion",
    name: "Wind Dancer",
    category: "defensive",
    severity: "info",
    description: "Wind Dancer for conditional damage reduction",
    explanation:
      "Wind Dancer grants less damage taken if you haven't been hit " +
      "recently and more evasion if you have. Layers well with evasion " +
      "builds.",
    detect(data) {
      return (
        hasKeystone(data, "Wind Dancer") ||
        hasCondition(data, "WindDancer")
      );
    },
  },

  {
    id: "wicked-ward-es",
    name: "Wicked Ward + High ES",
    category: "defensive",
    severity: "notable",
    description: "Wicked Ward with 3000+ Energy Shield",
    explanation:
      "Wicked Ward prevents ES recharge from being interrupted. Ensures " +
      "ES recharge completes fully once started, powerful for ES-based " +
      "builds.",
    detect(data) {
      return (
        hasKeystone(data, "Wicked Ward") &&
        stat(data, "EnergyShield") > 3000
      );
    },
  },

  {
    id: "zealots-oath-regen",
    name: "Zealot's Oath + High Regen",
    category: "defensive",
    severity: "notable",
    description: "Zealot's Oath with 500+ life regen applied to ES",
    explanation:
      "Zealot's Oath applies life regeneration to ES instead. High life " +
      "regen from tree/gear becomes powerful ES sustain.",
    detect(data) {
      return (
        hasKeystone(data, "Zealot's Oath") &&
        stat(data, "LifeRegenRecovery") > 500
      );
    },
  },

  {
    id: "ghost-reaver-leech",
    name: "Ghost Reaver ES Leech",
    category: "defensive",
    severity: "notable",
    description: "Ghost Reaver for life leech applied to ES",
    explanation:
      "Ghost Reaver applies life leech to ES. Combined with leech " +
      "sources, provides strong ES recovery during combat.",
    detect(data) {
      return hasKeystone(data, "Ghost Reaver");
    },
  },

  {
    id: "pain-attunement-low-life",
    name: "Pain Attunement Active",
    category: "offensive",
    severity: "critical",
    description: "Pain Attunement with low life status confirmed",
    explanation:
      "Pain Attunement grants 30% more spell damage while on low life. " +
      "Active low-life status confirms this massive damage multiplier " +
      "is working.",
    detect(data) {
      return (
        hasKeystone(data, "Pain Attunement") &&
        (hasCondition(data, "LowLife") ||
          stat(data, "LifeUnreserved") < stat(data, "Life") * 0.5)
      );
    },
  },

  {
    id: "eldritch-battery-mom",
    name: "Eldritch Battery + MoM",
    category: "defensive",
    severity: "notable",
    description: "Eldritch Battery combined with Mind over Matter",
    explanation:
      "Eldritch Battery makes ES protect mana. Combined with MoM, ES " +
      "absorbs 40% of damage taken as a regenerating mana/ES buffer.",
    detect(data) {
      return (
        hasKeystone(data, "Eldritch Battery") &&
        hasKeystone(data, "Mind over Matter")
      );
    },
  },

  {
    id: "versatile-combatant-block",
    name: "Versatile Combatant + High Block",
    category: "defensive",
    severity: "notable",
    description: "Versatile Combatant with 40%+ block chance",
    explanation:
      "Versatile Combatant sets spell block equal to attack block. High " +
      "attack block thus provides equally high spell block.",
    detect(data) {
      return (
        hasKeystone(data, "Versatile Combatant") &&
        stat(data, "BlockChance") > 40
      );
    },
  },

  {
    id: "aegis-aurora-block",
    name: "Aegis Aurora",
    category: "defensive",
    severity: "critical",
    description: "Aegis Aurora for ES recovery on block",
    explanation:
      "Aegis Aurora recovers ES equal to 2% of armour on block. With " +
      "high armour and block, this provides near-infinite ES sustain.",
    detect(data) {
      return hasUnique(data, "Aegis Aurora");
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

  // --- New Unique Item Synergies (utility) ---

  {
    id: "shavronnes-low-life",
    name: "Shavronne's Wrappings",
    category: "utility",
    severity: "critical",
    description: "Shavronne's Wrappings for safe low-life",
    explanation:
      "Shavronne's prevents chaos damage from bypassing ES, enabling " +
      "low-life builds that use Pain Attunement for 30% more spell damage.",
    detect(data) {
      return (
        hasUnique(data, "Shavronne's Wrappings") ||
        hasUnique(data, "Shav's Wrappings")
      );
    },
  },

  {
    id: "ashes-of-stars",
    name: "Ashes of the Stars",
    category: "utility",
    severity: "critical",
    description: "Ashes of the Stars for gem level and quality",
    explanation:
      "Ashes of the Stars grants +1 gem level, 20% quality to all skill " +
      "gems, and reservation efficiency. One of the most powerful " +
      "offensive amulets.",
    detect(data) {
      return hasUnique(data, "Ashes of the Stars");
    },
  },

  // --- New Condition-Based Synergies (utility) ---

  {
    id: "on-kill-stacking",
    name: "On-Kill Effect Stacking",
    category: "utility",
    severity: "info",
    description: "Multiple on-kill effects detected",
    explanation:
      "Multiple on-kill effects detected. These builds snowball in " +
      "pack-dense content but may lose buffs against bosses.",
    detect(data) {
      const killConditions = data.conditions.filter(
        (c) =>
          c.toLowerCase().includes("kill") ||
          c.toLowerCase().includes("killedrecently"),
      );
      return killConditions.length > 2;
    },
  },

  {
    id: "aura-stacking",
    name: "Aura Stacking",
    category: "utility",
    severity: "notable",
    description: "5+ active auras for layered bonuses",
    explanation:
      "5+ auras active, providing layered offensive and defensive bonuses. " +
      "Aura effect scaling multiplies all aura benefits.",
    detect(data) {
      const auraNames = [
        "Determination", "Grace", "Discipline", "Hatred", "Anger",
        "Wrath", "Zealotry", "Malevolence", "Pride", "Haste",
        "Vitality", "Clarity", "Purity",
      ];
      const auraCount = data.activeSkills.filter((s) =>
        auraNames.some((a) => s.name.includes(a)),
      ).length;
      return auraCount >= 5;
    },
  },

  {
    id: "blood-magic-aura",
    name: "Blood Magic",
    category: "utility",
    severity: "info",
    description: "Blood Magic for life-based reservation",
    explanation:
      "Blood Magic reserves skills on life instead of mana. Enables " +
      "life-based aura setups and frees mana entirely.",
    detect(data) {
      return hasKeystone(data, "Blood Magic");
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
