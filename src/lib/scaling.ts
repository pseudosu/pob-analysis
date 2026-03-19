// ---------------------------------------------------------------------------
// Scaling Advisor — tests which stat investments yield the best DPS/EHP gains
// ---------------------------------------------------------------------------

const api = (window as any).api

export interface ScalingTest {
  id: string
  name: string
  description: string
  category: 'offensive' | 'defensive'
  mods: Array<{ stat: string; type: string; value: number }>
}

export interface ScalingResult {
  test: ScalingTest
  dpsGain: number
  dpsGainPct: number
  ehpGain: number
  ehpGainPct: number
}

// ---- Offensive scaling tests ------------------------------------------------

export const OFFENSIVE_TESTS: ScalingTest[] = [
  {
    id: 'more-damage-10',
    name: '+10% More Damage',
    description: 'A 10% more damage multiplier (e.g. from a support gem)',
    category: 'offensive',
    mods: [{ stat: 'Damage', type: 'MORE', value: 10 }],
  },
  {
    id: 'inc-damage-10',
    name: '+10% Increased Damage',
    description: '10% increased damage from passives or gear',
    category: 'offensive',
    mods: [{ stat: 'Damage', type: 'INC', value: 10 }],
  },
  {
    id: 'crit-multi-10',
    name: '+10% Crit Multiplier',
    description: '+10% to critical strike multiplier',
    category: 'offensive',
    mods: [{ stat: 'CritMultiplier', type: 'BASE', value: 10 }],
  },
  {
    id: 'crit-chance-1',
    name: '+1% Base Crit Chance',
    description: '+1% to critical strike chance',
    category: 'offensive',
    mods: [{ stat: 'CritChance', type: 'BASE', value: 1 }],
  },
  {
    id: 'attack-speed-10',
    name: '+10% Attack/Cast Speed',
    description: '10% increased attack and cast speed',
    category: 'offensive',
    mods: [{ stat: 'Speed', type: 'INC', value: 10 }],
  },
  {
    id: 'flat-phys-20',
    name: '+10-20 Physical Damage',
    description: 'Adds 10 to 20 physical damage to attacks/spells',
    category: 'offensive',
    mods: [
      { stat: 'PhysicalMin', type: 'BASE', value: 10 },
      { stat: 'PhysicalMax', type: 'BASE', value: 20 },
    ],
  },
  {
    id: 'flat-light-20',
    name: '+10-20 Lightning Damage',
    description: 'Adds 10 to 20 lightning damage',
    category: 'offensive',
    mods: [
      { stat: 'LightningMin', type: 'BASE', value: 10 },
      { stat: 'LightningMax', type: 'BASE', value: 20 },
    ],
  },
  {
    id: 'flat-cold-20',
    name: '+10-20 Cold Damage',
    description: 'Adds 10 to 20 cold damage',
    category: 'offensive',
    mods: [
      { stat: 'ColdMin', type: 'BASE', value: 10 },
      { stat: 'ColdMax', type: 'BASE', value: 20 },
    ],
  },
  {
    id: 'flat-fire-20',
    name: '+10-20 Fire Damage',
    description: 'Adds 10 to 20 fire damage',
    category: 'offensive',
    mods: [
      { stat: 'FireMin', type: 'BASE', value: 10 },
      { stat: 'FireMax', type: 'BASE', value: 20 },
    ],
  },
  {
    id: 'flat-chaos-20',
    name: '+10-20 Chaos Damage',
    description: 'Adds 10 to 20 chaos damage',
    category: 'offensive',
    mods: [
      { stat: 'ChaosMin', type: 'BASE', value: 10 },
      { stat: 'ChaosMax', type: 'BASE', value: 20 },
    ],
  },
  {
    id: 'gem-level-1',
    name: '+1 All Gem Levels',
    description: '+1 to level of all skill gems',
    category: 'offensive',
    mods: [{ stat: 'GemLevel', type: 'BASE', value: 1 }],
  },
  {
    id: 'penetration-10',
    name: '+10% Ele Penetration',
    description: '10% elemental penetration',
    category: 'offensive',
    mods: [{ stat: 'ElementalPenetration', type: 'BASE', value: 10 }],
  },
]

// ---- Defensive scaling tests ------------------------------------------------

export const DEFENSIVE_TESTS: ScalingTest[] = [
  {
    id: 'flat-life-100',
    name: '+100 Flat Life',
    description: '+100 to maximum life',
    category: 'defensive',
    mods: [{ stat: 'Life', type: 'BASE', value: 100 }],
  },
  {
    id: 'inc-life-10',
    name: '+10% Increased Life',
    description: '10% increased maximum life',
    category: 'defensive',
    mods: [{ stat: 'Life', type: 'INC', value: 10 }],
  },
  {
    id: 'flat-es-200',
    name: '+200 Flat ES',
    description: '+200 to maximum energy shield',
    category: 'defensive',
    mods: [{ stat: 'EnergyShield', type: 'BASE', value: 200 }],
  },
  {
    id: 'inc-es-10',
    name: '+10% Increased ES',
    description: '10% increased maximum energy shield',
    category: 'defensive',
    mods: [{ stat: 'EnergyShield', type: 'INC', value: 10 }],
  },
  {
    id: 'max-res-1',
    name: '+1% Max All Res',
    description: '+1% to maximum fire/cold/lightning resistance',
    category: 'defensive',
    mods: [
      { stat: 'FireResistMax', type: 'BASE', value: 1 },
      { stat: 'ColdResistMax', type: 'BASE', value: 1 },
      { stat: 'LightningResistMax', type: 'BASE', value: 1 },
    ],
  },
  {
    id: 'flat-armour-500',
    name: '+500 Flat Armour',
    description: '+500 to armour',
    category: 'defensive',
    mods: [{ stat: 'Armour', type: 'BASE', value: 500 }],
  },
  {
    id: 'inc-evasion-10',
    name: '+10% Increased Evasion',
    description: '10% increased evasion rating',
    category: 'defensive',
    mods: [{ stat: 'Evasion', type: 'INC', value: 10 }],
  },
  {
    id: 'spell-suppress-5',
    name: '+5% Spell Suppression',
    description: '+5% chance to suppress spell damage',
    category: 'defensive',
    mods: [{ stat: 'SpellSuppressionChance', type: 'BASE', value: 5 }],
  },
]

// ---- Runner -----------------------------------------------------------------

export async function runScalingTests(
  category: 'offensive' | 'defensive',
  baselineDps: number,
  baselineEhp: number,
  onProgress?: (done: number, total: number) => void
): Promise<ScalingResult[]> {
  const tests = category === 'offensive' ? OFFENSIVE_TESTS : DEFENSIVE_TESTS

  // Fetch actual baseline via a no-op calcWith to get accurate TotalEHP and DPS
  try {
    const baselineResult = await api.pob.calcWith({})
    if (baselineResult) {
      const bDps = baselineResult.CombinedDPS ?? baselineResult.FullDPS ?? baselineResult.TotalDPS ?? 0
      const bEhp = baselineResult.TotalEHP ?? 0
      if (bDps > 0) baselineDps = bDps
      if (bEhp > 0) baselineEhp = bEhp
    }
  } catch { /* use passed-in values */ }

  // Build batch calc jobs — each job uses addMods
  const jobs = tests.map(t => ({ addMods: t.mods }))

  let results: any[]
  try {
    const resp = await api.pob.batchCalc(jobs)
    results = resp.ok ? resp.results : []
  } catch {
    // Serial fallback
    results = []
    for (let i = 0; i < jobs.length; i++) {
      try {
        const r = await api.pob.calcWith(jobs[i])
        results.push(r)
      } catch {
        results.push(null)
      }
      if (onProgress) onProgress(i + 1, tests.length)
    }
  }

  const scalingResults: ScalingResult[] = []

  for (let i = 0; i < tests.length; i++) {
    const r = results[i]
    if (!r) continue

    const newDps = r.CombinedDPS ?? r.FullDPS ?? r.TotalDPS ?? 0
    const newEhp = r.TotalEHP ?? 0

    scalingResults.push({
      test: tests[i],
      dpsGain: newDps - baselineDps,
      dpsGainPct: baselineDps > 0 ? ((newDps - baselineDps) / baselineDps) * 100 : 0,
      ehpGain: newEhp - baselineEhp,
      ehpGainPct: baselineEhp > 0 ? ((newEhp - baselineEhp) / baselineEhp) * 100 : 0,
    })
  }

  // Sort by gain (descending)
  if (category === 'offensive') {
    scalingResults.sort((a, b) => b.dpsGainPct - a.dpsGainPct)
  } else {
    scalingResults.sort((a, b) => b.ehpGainPct - a.ehpGainPct)
  }

  return scalingResults
}
