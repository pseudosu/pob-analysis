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
    | "mitigation";
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

  return sortDangers(dangers);
}
