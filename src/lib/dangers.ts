// ---------------------------------------------------------------------------
// Danger analysis engine for Path of Exile builds
// Inspects defensive layers and flags vulnerabilities.
// ---------------------------------------------------------------------------

export interface Danger {
  id: string;
  severity: "critical" | "warning" | "info";
  category:
    | "resistance"
    | "oneshot"
    | "ailment"
    | "recovery"
    | "mitigation"
    | "utility";
  title: string;
  description: string;
  value?: string;
  suggestion?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<Danger["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const CATEGORY_ORDER: Record<Danger["category"], number> = {
  resistance: 0,
  oneshot: 1,
  ailment: 2,
  recovery: 3,
  mitigation: 4,
  utility: 5,
};

function sortDangers(dangers: Danger[]): Danger[] {
  return dangers.sort((a, b) => {
    const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
  });
}

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString("en-US") : String(n);
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

function checkResistances(data: any, out: Danger[]): void {
  const elements: Array<"Fire" | "Cold" | "Lightning"> = [
    "Fire",
    "Cold",
    "Lightning",
  ];

  for (const elem of elements) {
    const r = data.resists?.[elem];
    if (!r) continue;

    // CRITICAL: negative resistance
    if (r.current < 0) {
      out.push({
        id: `negative-${elem.toLowerCase()}-res`,
        severity: "critical",
        category: "resistance",
        title: `Negative ${elem} Resistance`,
        description: `${elem} resistance is ${r.current}%. Incoming ${elem.toLowerCase()} damage is amplified.`,
        value: `${r.current}%`,
        suggestion: `Cap ${elem.toLowerCase()} resistance to at least 75%.`,
      });
    }
    // WARNING: uncapped (0 .. 74)
    else if (r.current < 75) {
      out.push({
        id: `uncapped-${elem.toLowerCase()}-res`,
        severity: "warning",
        category: "resistance",
        title: `Uncapped ${elem} Resistance`,
        description: `${elem} resistance is only ${r.current}%, below the 75% cap.`,
        value: `${r.current}%`,
        suggestion: `Increase ${elem.toLowerCase()} resistance to 75%.`,
      });
    }

    // INFO: overcapped
    if (r.overcap > 0) {
      out.push({
        id: `overcap-${elem.toLowerCase()}-res`,
        severity: "info",
        category: "resistance",
        title: `${elem} Resistance Overcapped`,
        description: `${elem} resistance has ${r.overcap}% overcap, protecting against elemental weakness curses.`,
        value: `+${r.overcap}%`,
      });
    }
  }

  // Chaos resistance
  const chaos = data.resists?.Chaos;
  const ci = !!data.chaosInoculation;

  if (chaos && !ci) {
    if (chaos.current < 0) {
      out.push({
        id: "negative-chaos-res",
        severity: "critical",
        category: "resistance",
        title: "Negative Chaos Resistance",
        description:
          "Chaos resistance is negative. Chaos damage bypasses ES and hits life directly.",
        value: `${chaos.current}%`,
        suggestion:
          "Raise chaos resistance. Consider gear with chaos res or an amethyst flask.",
      });
    } else if (chaos.current < 30) {
      out.push({
        id: "low-chaos-res",
        severity: "warning",
        category: "resistance",
        title: "Low Chaos Resistance",
        description: `Chaos resistance is only ${chaos.current}%. Chaos damage bypasses energy shield.`,
        value: `${chaos.current}%`,
        suggestion:
          "Aim for at least 30% chaos resistance, ideally 75%.",
      });
    }
  }
}

function checkOneShot(data: any, out: Danger[]): void {
  const maxHit = data.maxHitTaken;

  // Physical hit threshold
  if (maxHit?.Physical != null && maxHit.Physical < 5000) {
    out.push({
      id: "low-phys-max-hit",
      severity: "critical",
      category: "oneshot",
      title: "Low Physical Max Hit Taken",
      description:
        "Many boss abilities deal 5000+ physical damage. The build cannot survive these hits.",
      value: fmt(maxHit.Physical),
      suggestion:
        "Increase armour, endurance charges, or physical damage reduction.",
    });
  }

  // Elemental hit thresholds
  const elements: Array<"Fire" | "Cold" | "Lightning" | "Chaos"> = [
    "Fire",
    "Cold",
    "Lightning",
    "Chaos",
  ];

  for (const elem of elements) {
    if (maxHit?.[elem] != null && maxHit[elem] < 8000) {
      out.push({
        id: `low-${elem.toLowerCase()}-max-hit`,
        severity: "critical",
        category: "oneshot",
        title: `Low ${elem} Max Hit Taken`,
        description: `Max ${elem.toLowerCase()} hit taken is below 8000. Large ${elem.toLowerCase()} hits from endgame bosses can one-shot.`,
        value: fmt(maxHit[elem]),
        suggestion: `Improve ${elem.toLowerCase()} mitigation or increase life/ES pool.`,
      });
    }
  }

  // Life pool check
  const life = data.pools?.lifeUnreserved ?? data.pools?.life ?? 0;
  const es = data.pools?.energyShield ?? 0;

  if (life < 3000 && es < 3000) {
    out.push({
      id: "low-life-pool",
      severity: "critical",
      category: "oneshot",
      title: "Very Low Life & ES Pool",
      description:
        "Both life and energy shield are below 3000. Very vulnerable to burst damage.",
      value: `Life: ${fmt(life)}, ES: ${fmt(es)}`,
      suggestion:
        "Invest in maximum life on gear and the passive tree, or build around energy shield.",
    });
  }

  // Very low chaos max hit (non-CI builds)
  const ci = !!data.chaosInoculation;
  if (maxHit?.Chaos != null && maxHit.Chaos < 3000 && !ci) {
    out.push({
      id: "very-low-chaos-max-hit",
      severity: "critical",
      category: "oneshot",
      title: "Very Low Chaos Max Hit Taken",
      description:
        "Chaos max hit is extremely low. Chaos damage bypasses energy shield and hits life directly.",
      value: fmt(maxHit.Chaos),
      suggestion:
        "Increase chaos resistance and life pool.",
    });
  }

  // Low total EHP
  const totalEhp = data.ehp?.total ?? 0;
  if (totalEhp > 0 && totalEhp < 30000) {
    out.push({
      id: "low-total-ehp",
      severity: "warning",
      category: "oneshot",
      title: "Low Total Effective HP",
      description:
        "Total effective HP is low for endgame content. Most endgame bosses deal hits requiring 50K+ EHP to survive.",
      value: fmt(totalEhp),
      suggestion:
        "Increase life/ES pool and mitigation layers.",
    });
  }
}

function checkAilments(data: any, out: Danger[]): void {
  const ailments = data.ailments;
  if (!ailments) return;

  const life = data.pools?.lifeUnreserved ?? data.pools?.life ?? 0;

  // CRITICAL: freeze immunity
  const freezeAvoid = ailments.Freeze?.avoidChance ?? 0;
  if (freezeAvoid < 100) {
    out.push({
      id: "no-freeze-immunity",
      severity: "critical",
      category: "ailment",
      title: "No Freeze Immunity",
      description:
        "Freeze is lethal in endgame. Without full avoidance the build can be frozen and killed.",
      value: `${freezeAvoid}% avoid`,
      suggestion:
        "Get 100% freeze avoidance via gear, flasks, or the passive tree.",
    });
  }

  // CRITICAL: stun immunity (low avoid AND low life)
  const stunAvoid = ailments.Stun?.avoidChance ?? 0;
  if (stunAvoid < 100 && life < 5000) {
    out.push({
      id: "no-stun-immunity",
      severity: "critical",
      category: "ailment",
      title: "Stun Vulnerable",
      description:
        "Can be stunlocked by rapid hits. Low life makes stun threshold very easy to reach.",
      value: `${stunAvoid}% avoid, ${fmt(life)} life`,
      suggestion:
        "Use Unwavering Stance, stun avoidance on gear, or increase life pool above 5000.",
    });
  }

  // CRITICAL: corrupting blood
  const cbAvoid = ailments.CorruptingBlood?.avoidChance ?? 0;
  if (cbAvoid < 100) {
    out.push({
      id: "no-cb-immunity",
      severity: "critical",
      category: "ailment",
      title: "No Corrupting Blood Immunity",
      description:
        "CB stacks are lethal vs certain content. Without immunity, stacks accumulate rapidly.",
      value: `${cbAvoid}% avoid`,
      suggestion:
        "Corrupt a jewel with 'Corrupted Blood cannot be inflicted on you'.",
    });
  }

  // WARNING: shock avoidance
  const shockAvoid = ailments.Shock?.avoidChance ?? 0;
  if (shockAvoid < 50) {
    out.push({
      id: "low-shock-avoid",
      severity: "warning",
      category: "ailment",
      title: "Low Shock Avoidance",
      description:
        "Shock increases damage taken significantly. Without avoidance the build is at risk.",
      value: `${shockAvoid}% avoid`,
      suggestion:
        "Get shock avoidance from gear, flasks, or the passive tree.",
    });
  }

  // WARNING: bleed avoidance
  const bleedAvoid = ailments.Bleed?.avoidChance ?? 0;
  if (bleedAvoid < 50) {
    out.push({
      id: "low-bleed-avoid",
      severity: "warning",
      category: "ailment",
      title: "Low Bleed Avoidance",
      description:
        "Bleeds deal heavy damage over time, especially while moving.",
      value: `${bleedAvoid}% avoid`,
      suggestion:
        "Get bleed avoidance or use a bleed-removal flask.",
    });
  }
}

function checkRecovery(data: any, out: Danger[]): void {
  const lifeRecovery = data.recovery?.Life;
  if (!lifeRecovery) return;

  const regen = lifeRecovery.regen ?? 0;
  const leech = lifeRecovery.leechRate ?? 0;

  if (regen < 100 && leech <= 0) {
    out.push({
      id: "no-life-recovery",
      severity: "warning",
      category: "recovery",
      title: "Minimal Life Recovery",
      description:
        "Life regeneration is very low and there is no leech. Sustained damage will drain the life pool.",
      value: `Regen: ${fmt(regen)}/s, Leech: ${fmt(leech)}/s`,
      suggestion:
        "Add life regeneration, life leech, or life gain on hit.",
    });
  }
}

function checkMitigation(data: any, out: Danger[]): void {
  const physRed = data.physicalReduction ?? 0;
  const evade =
    Math.max(
      data.avoidance?.meleeEvadeChance ?? 0,
      data.avoidance?.projectileEvadeChance ?? 0,
    ) / 100; // normalize to 0-1 for the 40% threshold comparison

  // WARNING: low physical reduction AND low evasion
  if (physRed < 20 && evade < 0.4) {
    out.push({
      id: "low-phys-mitigation",
      severity: "warning",
      category: "mitigation",
      title: "Low Physical Mitigation",
      description:
        "Both physical damage reduction and evasion are low. Physical hits will be very dangerous.",
      value: `Phys red: ${physRed}%, Evade: ${Math.round(evade * 100)}%`,
      suggestion:
        "Increase armour, evasion, endurance charges, or use Fortify.",
    });
  }

  // WARNING: no spell suppression
  const suppression = data.avoidance?.suppressionChance ?? 0;
  if (suppression < 50) {
    out.push({
      id: "low-spell-suppression",
      severity: "warning",
      category: "mitigation",
      title: "Low Spell Suppression",
      description:
        "Spell suppression is below 50%. Spell damage will hit for full effect.",
      value: `${suppression}%`,
      suggestion:
        "Get spell suppression on gear (Evasion bases) or the passive tree.",
    });
  }

  // INFO: capped spell suppression
  if (suppression >= 100) {
    out.push({
      id: "capped-spell-suppression",
      severity: "info",
      category: "mitigation",
      title: "Spell Suppression Capped",
      description:
        "Spell suppression is at 100%. All spell damage is halved.",
      value: `${suppression}%`,
    });
  }

  // INFO: high block chance
  const block = data.avoidance?.blockChance ?? 0;
  if (block > 50) {
    out.push({
      id: "high-block",
      severity: "info",
      category: "mitigation",
      title: "High Block Chance",
      description: `Attack block chance is ${block}%, providing strong hit avoidance.`,
      value: `${block}%`,
    });
  }

  const spellBlock = data.avoidance?.spellBlockChance ?? 0;
  if (spellBlock > 50) {
    out.push({
      id: "high-spell-block",
      severity: "info",
      category: "mitigation",
      title: "High Spell Block Chance",
      description: `Spell block chance is ${spellBlock}%, providing strong spell hit avoidance.`,
      value: `${spellBlock}%`,
    });
  }

  // No block, no spell block, no suppression
  if (block < 20 && spellBlock < 20 && suppression < 30) {
    out.push({
      id: "no-block-no-suppress",
      severity: "info",
      category: "mitigation",
      title: "No Hit Avoidance Layers",
      description:
        "No significant hit avoidance layers (block, spell block, or suppression). All hits land at full damage.",
      suggestion:
        "Invest in block chance, spell suppression, or spell block.",
    });
  }

  // High armour synergy info
  const armour = data.armour ?? 0;
  if (armour > 30000) {
    out.push({
      id: "high-armour-synergy",
      severity: "info",
      category: "mitigation",
      title: "High Armour",
      description:
        "High armour provides strong physical damage reduction, especially against smaller hits. Molten Shell scales well with this armour.",
      value: fmt(armour),
    });
  }

  // High evasion synergy info
  const evasion = data.evasion ?? 0;
  if (evasion > 30000) {
    out.push({
      id: "high-evasion-synergy",
      severity: "info",
      category: "mitigation",
      title: "High Evasion",
      description:
        "High evasion provides reliable attack avoidance. Grace aura and Wind Dancer synergize well with evasion.",
      value: fmt(evasion),
    });
  }
}

// ---------------------------------------------------------------------------
// Utility gap checks
// ---------------------------------------------------------------------------

function checkUtilityGaps(data: any, out: Danger[]): void {
  // No guard skill
  const guardSkills = data.guardSkills;
  if (!guardSkills || !Array.isArray(guardSkills) || guardSkills.length === 0) {
    out.push({
      id: "no-guard-skill",
      severity: "warning",
      category: "mitigation",
      title: "No Guard Skill",
      description:
        "No guard skill (Molten Shell, Steelskin, Immortal Call, etc.) detected. Guard skills provide burst physical damage mitigation on a cooldown.",
      suggestion:
        "Add a guard skill linked to Cast when Damage Taken for automated protection.",
    });
  }

  // No movement skill
  const movementSkills = data.movementSkills;
  if (
    !movementSkills ||
    !Array.isArray(movementSkills) ||
    movementSkills.length === 0
  ) {
    out.push({
      id: "no-movement-skill",
      severity: "info",
      category: "utility",
      title: "No Movement Skill",
      description:
        "No movement skill detected. Movement skills like Flame Dash, Dash, or Leap Slam are essential for dodging dangerous mechanics.",
      suggestion:
        "Add a movement skill for repositioning and dodging boss abilities.",
    });
  }
}

// ---------------------------------------------------------------------------
// Mana sustain checks
// ---------------------------------------------------------------------------

function checkManaSustain(data: any, out: Danger[]): void {
  const manaUnreserved = data.pools?.manaUnreserved ?? 0;
  const manaRegen = data.recovery?.Mana?.regen ?? 0;
  const keystones = data.keystones ?? [];
  const hasEldritchBattery = keystones.includes("Eldritch Battery");

  // Low unreserved mana
  if (manaUnreserved < 50 && !hasEldritchBattery) {
    out.push({
      id: "low-mana-unreserved",
      severity: "warning",
      category: "recovery",
      title: "Very Low Unreserved Mana",
      description:
        "Unreserved mana is below 50. May not be able to cast skills without going OOM.",
      value: fmt(manaUnreserved),
      suggestion:
        "Reduce mana reservation or add a mana flask. Consider Enlighten Support.",
    });
  }

  // No mana recovery
  if (manaRegen < 50 && manaUnreserved > 10) {
    out.push({
      id: "no-mana-recovery",
      severity: "warning",
      category: "recovery",
      title: "Low Mana Regeneration",
      description:
        "Mana regeneration is very low. Sustained skill use may drain mana.",
      value: `${fmt(manaRegen)}/s`,
      suggestion:
        "Add mana regeneration from gear, passive tree, or Clarity aura.",
    });
  }

  // Mind over Matter without enough unreserved mana
  const hasMoM = keystones.includes("Mind Over Matter");
  const totalMana = data.pools?.mana ?? 0;
  if (hasMoM && manaUnreserved < totalMana * 0.3) {
    out.push({
      id: "mom-low-mana",
      severity: "warning",
      category: "recovery",
      title: "Mind Over Matter with Low Unreserved Mana",
      description:
        "Mind Over Matter diverts damage to mana, but unreserved mana is too low to absorb meaningful hits. MoM is not providing effective protection.",
      value: `Unreserved: ${fmt(manaUnreserved)} / ${fmt(totalMana)} total`,
      suggestion:
        "Reserve less mana or increase total mana pool. MoM needs significant unreserved mana to function.",
    });
  }
}

// ---------------------------------------------------------------------------
// Extended recovery checks
// ---------------------------------------------------------------------------

function checkRecoveryExpanded(data: any, out: Danger[]): void {
  const es = data.pools?.energyShield ?? 0;
  const esRegen = data.recovery?.EnergyShield?.regen ?? 0;
  const esLeech = data.recovery?.EnergyShield?.leechRate ?? 0;
  const lifeRegen = data.recovery?.Life?.regen ?? 0;
  const lifeLeech = data.recovery?.Life?.leechRate ?? 0;
  const life = data.pools?.lifeUnreserved ?? data.pools?.life ?? 0;
  const keystones = data.keystones ?? [];

  // No ES recovery on substantial ES pool
  if (es > 2000 && esRegen < 100 && esLeech < 100) {
    out.push({
      id: "no-es-recovery",
      severity: "warning",
      category: "recovery",
      title: "No Energy Shield Recovery",
      description:
        "Energy shield pool is substantial but has minimal recovery. ES will not replenish effectively in combat.",
      suggestion:
        "Add ES recharge, leech, or regen. Consider Zealot's Oath or Ghost Reaver.",
    });
  }

  // Negative net regen (degenerating)
  if (lifeRegen < 0) {
    out.push({
      id: "negative-net-regen",
      severity: "critical",
      category: "recovery",
      title: "Negative Life Regeneration",
      description:
        "Net life regeneration is negative — the build is degenerating. Life is slowly draining even without enemy hits.",
      value: `${fmt(lifeRegen)}/s`,
      suggestion:
        "Address degen sources or increase life regeneration to offset.",
    });
  }

  // No leech source at all
  if (
    lifeLeech <= 0 &&
    esLeech <= 0 &&
    (life > 3000 || es > 3000)
  ) {
    out.push({
      id: "no-leech-source",
      severity: "info",
      category: "recovery",
      title: "No Leech Source",
      description:
        "No life or ES leech detected. Leech provides powerful sustain during combat, especially for attack builds.",
      suggestion:
        "Add leech via gear mods, passive nodes, or support gems.",
    });
  }

  // Large ES pool, low life, no ES sustain (ES-focused build without recovery)
  const hasWickedWard = keystones.includes("Wicked Ward");
  const hasGhostReaver = keystones.includes("Ghost Reaver");
  if (
    es > 5000 &&
    life < 2000 &&
    esRegen < 200 &&
    esLeech < 200 &&
    !hasWickedWard &&
    !hasGhostReaver
  ) {
    out.push({
      id: "es-no-sustain",
      severity: "warning",
      category: "recovery",
      title: "Large ES Pool Without Sustain",
      description:
        "Large ES pool with no meaningful ES recovery. Once ES is depleted, it may not recover fast enough in combat.",
      suggestion:
        "Add ES recharge, regen, or leech. Consider Wicked Ward or Zealot's Oath.",
    });
  }
}

// ---------------------------------------------------------------------------
// Defense balance checks
// ---------------------------------------------------------------------------

function checkDefenseBalance(data: any, out: Danger[]): void {
  const armour = data.armour ?? 0;
  const physRed = data.physicalReduction ?? 0;
  const evasion = data.evasion ?? 0;
  const block = data.avoidance?.blockChance ?? 0;
  const keystones = data.keystones ?? [];
  const hasFortify = keystones.includes("Fortify") || (data.fortify === true);

  // No physical mitigation layers
  if (
    armour < 5000 &&
    physRed < 10 &&
    evasion < 10000 &&
    block < 30 &&
    !hasFortify
  ) {
    out.push({
      id: "no-physical-mitigation-layers",
      severity: "warning",
      category: "mitigation",
      title: "No Physical Mitigation Layers",
      description:
        "No significant physical damage mitigation layers. Physical damage from endgame content will be devastating.",
      suggestion:
        "Invest in armour, evasion, block, or Fortify for physical mitigation.",
    });
  }

  // Over-invested in single defense layer
  if (armour > 50000 && evasion < 2000 && block < 20) {
    out.push({
      id: "over-invested-single-layer",
      severity: "info",
      category: "mitigation",
      title: "Single Defense Layer Focus",
      description:
        "Heavily invested in armour but lacking other defense layers. Diversifying defenses provides better overall survivability.",
      suggestion:
        "Consider adding a secondary defense layer like spell suppression, block, or evasion.",
    });
  }

  // Low life AND low ES (glass cannon)
  const life = data.pools?.lifeUnreserved ?? data.pools?.life ?? 0;
  const es = data.pools?.energyShield ?? 0;
  if (life > 1000 && life < 4000 && es < 1000 && armour < 10000 && evasion < 15000) {
    out.push({
      id: "glass-cannon",
      severity: "warning",
      category: "mitigation",
      title: "Glass Cannon Build",
      description:
        "Low life, low ES, and minimal armour/evasion. The build has very few defensive layers and relies on not being hit.",
      value: `Life: ${fmt(life)}, ES: ${fmt(es)}`,
      suggestion:
        "Invest in at least one major defensive layer: life, armour, evasion, or energy shield.",
    });
  }

  // CI build without high ES
  const ci = !!data.chaosInoculation;
  if (ci && es < 5000) {
    out.push({
      id: "ci-low-es",
      severity: "critical",
      category: "mitigation",
      title: "Chaos Inoculation with Low ES",
      description:
        "Chaos Inoculation sets life to 1. With energy shield below 5000, the build has an extremely small effective health pool.",
      value: `ES: ${fmt(es)}`,
      suggestion:
        "CI builds need at least 5000+ ES to function safely. Invest heavily in ES on gear and tree.",
    });
  }
}

// ---------------------------------------------------------------------------
// Additional ailment checks
// ---------------------------------------------------------------------------

function checkAdditionalAilments(data: any, out: Danger[]): void {
  const ailments = data.ailments;
  if (!ailments) return;

  const ci = !!data.chaosInoculation;

  // Ignite avoidance
  const igniteAvoid = ailments.Ignite?.avoidChance ?? 0;
  if (igniteAvoid < 50) {
    out.push({
      id: "no-ignite-avoidance",
      severity: "info",
      category: "ailment",
      title: "Low Ignite Avoidance",
      description:
        "Low ignite avoidance. Ignite deals fire damage over time that scales with the hit.",
      value: `${igniteAvoid}% avoid`,
      suggestion:
        "Consider ignite avoidance or an ignite-removing flask.",
    });
  }

  // Poison avoidance
  const poisonAvoid = ailments.Poison?.avoidChance ?? 0;
  if (poisonAvoid < 50 && !ci) {
    out.push({
      id: "no-poison-avoidance",
      severity: "info",
      category: "ailment",
      title: "Low Poison Avoidance",
      description:
        "Low poison avoidance. Poison stacks deal chaos damage over time, which bypasses energy shield.",
      value: `${poisonAvoid}% avoid`,
      suggestion:
        "Get poison avoidance or a poison-removing flask.",
    });
  }

  // Chill avoidance
  const chillAvoid = ailments.Chill?.avoidChance ?? 0;
  if (chillAvoid < 50) {
    out.push({
      id: "no-chill-avoidance",
      severity: "warning",
      category: "ailment",
      title: "Low Chill Avoidance",
      description:
        "Low chill avoidance. Chill reduces action speed, making the build slower and more vulnerable.",
      value: `${chillAvoid}% avoid`,
      suggestion:
        "Get chill avoidance from gear, flasks, or passive tree.",
    });
  }

  // Zero ailment protection across the board
  const freezeAvoid = ailments.Freeze?.avoidChance ?? 0;
  const shockAvoid = ailments.Shock?.avoidChance ?? 0;
  const bleedAvoid = ailments.Bleed?.avoidChance ?? 0;
  if (
    freezeAvoid < 30 &&
    shockAvoid < 30 &&
    bleedAvoid < 30 &&
    chillAvoid < 30
  ) {
    out.push({
      id: "zero-ailment-protection",
      severity: "critical",
      category: "ailment",
      title: "No Ailment Protection",
      description:
        "Almost no ailment protection across the board. The build is vulnerable to every ailment type simultaneously.",
      suggestion:
        "Invest in ailment avoidance. The Brine King pantheon and 'of Heat'/'of Grounding' flasks help.",
    });
  }
}

// ---------------------------------------------------------------------------
// Vulnerability checks
// ---------------------------------------------------------------------------

function checkVulnerabilities(data: any, out: Danger[]): void {
  // Reflect vulnerability
  out.push({
    id: "reflect-vulnerable",
    severity: "info",
    category: "mitigation",
    title: "Reflect Vulnerability",
    description:
      "No elemental or physical reflect immunity detected. Reflect maps can be dangerous without mitigation.",
    suggestion:
      "Use Sibyl's Lament ring, reflect pantheon, or Elementalist for reflect immunity.",
  });

  // Single damage type (informational)
  out.push({
    id: "single-damage-type",
    severity: "info",
    category: "mitigation",
    title: "Single Damage Type",
    description:
      "Build may deal only one damage type. Enemies with high resistance to that type will be very difficult.",
    suggestion:
      "Consider exposure, penetration, or a secondary damage source.",
  });

  // Curse vulnerability
  const keystones = data.keystones ?? [];
  const hasReducedCurseEffect =
    keystones.includes("Sanctum of Thought") || false;
  if (!hasReducedCurseEffect) {
    out.push({
      id: "curse-vulnerable",
      severity: "warning",
      category: "mitigation",
      title: "Curse Vulnerable",
      description:
        "No reduced effect of curses on you. Enemy curses like Enfeeble or Temporal Chains severely impact performance.",
      suggestion:
        "Get reduced curse effect from gear or use a curse-cleansing flask.",
    });
  }

  // Low chaos res with high ES (non-CI) — chaos damage bypasses ES
  const chaosRes = data.resists?.Chaos?.current ?? 0;
  const ci = !!data.chaosInoculation;
  const es = data.pools?.energyShield ?? 0;
  if (!ci && chaosRes < 0 && es > 3000) {
    out.push({
      id: "chaos-bypass-es",
      severity: "critical",
      category: "mitigation",
      title: "Chaos Damage Bypasses ES",
      description:
        "Negative chaos resistance with a large ES pool. Chaos damage bypasses energy shield and hits the life pool directly at amplified values.",
      value: `Chaos res: ${chaosRes}%, ES: ${fmt(es)}`,
      suggestion:
        "Prioritize chaos resistance. Even 0% chaos res significantly reduces incoming chaos damage.",
    });
  }

  // Elemental weakness map vulnerability (low overcap)
  const fireOC = data.resists?.Fire?.overcap ?? 0;
  const coldOC = data.resists?.Cold?.overcap ?? 0;
  const lightOC = data.resists?.Lightning?.overcap ?? 0;
  if (fireOC < 20 && coldOC < 20 && lightOC < 20) {
    out.push({
      id: "ele-weakness-vulnerable",
      severity: "info",
      category: "resistance",
      title: "Low Elemental Overcap",
      description:
        "All elemental resistances have less than 20% overcap. Elemental Weakness maps and curses will drop resistances below cap.",
      suggestion:
        "Aim for 30-40% overcap on each elemental resistance to handle Elemental Weakness map mod.",
    });
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function analyzeDangers(data: any): Danger[] {
  if (!data) return [];

  const dangers: Danger[] = [];

  checkResistances(data, dangers);
  checkOneShot(data, dangers);
  checkAilments(data, dangers);
  checkRecovery(data, dangers);
  checkMitigation(data, dangers);
  checkUtilityGaps(data, dangers);
  checkManaSustain(data, dangers);
  checkRecoveryExpanded(data, dangers);
  checkDefenseBalance(data, dangers);
  checkAdditionalAilments(data, dangers);
  checkVulnerabilities(data, dangers);

  return sortDangers(dangers);
}
