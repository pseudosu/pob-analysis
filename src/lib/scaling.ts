// ---------------------------------------------------------------------------
// Scaling Advisor — tests which stat investments yield the best DPS/EHP gains
// ---------------------------------------------------------------------------

const api = (window as any).api

export interface ScalingTest {
  id: string
  name: string
  description: string
  category: 'offensive' | 'defensive'
  mods: Array<{ text?: string; stat?: string; type?: string; value?: number }>
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
    mods: [{ text: '10% more Damage' }],
  },
  {
    id: 'inc-damage-10',
    name: '+10% Increased Damage',
    description: '10% increased damage from passives or gear',
    category: 'offensive',
    mods: [{ text: '10% increased Damage' }],
  },
  {
    id: 'crit-multi-10',
    name: '+10% Crit Multiplier',
    description: '+10% to critical strike multiplier',
    category: 'offensive',
    mods: [{ text: '+10% to Critical Strike Multiplier' }],
  },
  {
    id: 'crit-chance-1',
    name: '+1% Base Crit Chance',
    description: '+1% to critical strike chance',
    category: 'offensive',
    mods: [{ text: '+1% to Critical Strike Chance' }],
  },
  {
    id: 'attack-speed-10',
    name: '+10% Attack/Cast Speed',
    description: '10% increased attack and cast speed',
    category: 'offensive',
    mods: [{ text: '10% increased Attack and Cast Speed' }],
  },
  {
    id: 'flat-phys-20',
    name: '+10-20 Physical Damage',
    description: 'Adds 10 to 20 physical damage to attacks',
    category: 'offensive',
    mods: [{ text: 'Adds 10 to 20 Physical Damage to Attacks' }],
  },
  {
    id: 'flat-light-20',
    name: '+10-20 Lightning Damage',
    description: 'Adds 10 to 20 lightning damage to attacks',
    category: 'offensive',
    mods: [{ text: 'Adds 10 to 20 Lightning Damage to Attacks' }],
  },
  {
    id: 'flat-cold-20',
    name: '+10-20 Cold Damage',
    description: 'Adds 10 to 20 cold damage to attacks',
    category: 'offensive',
    mods: [{ text: 'Adds 10 to 20 Cold Damage to Attacks' }],
  },
  {
    id: 'flat-fire-20',
    name: '+10-20 Fire Damage',
    description: 'Adds 10 to 20 fire damage to attacks',
    category: 'offensive',
    mods: [{ text: 'Adds 10 to 20 Fire Damage to Attacks' }],
  },
  {
    id: 'flat-chaos-20',
    name: '+10-20 Chaos Damage',
    description: 'Adds 10 to 20 chaos damage to attacks',
    category: 'offensive',
    mods: [{ text: 'Adds 10 to 20 Chaos Damage to Attacks' }],
  },
  {
    id: 'gem-level-1',
    name: '+1 All Gem Levels',
    description: '+1 to level of all skill gems',
    category: 'offensive',
    mods: [{ text: '+1 to Level of all Skill Gems' }],
  },
  {
    id: 'penetration-10',
    name: '+10% Ele Penetration',
    description: '10% elemental penetration',
    category: 'offensive',
    mods: [{ text: 'Damage Penetrates 10% Elemental Resistances' }],
  },
]

// ---- Defensive scaling tests ------------------------------------------------

export const DEFENSIVE_TESTS: ScalingTest[] = [
  {
    id: 'flat-life-100',
    name: '+100 Flat Life',
    description: '+100 to maximum life',
    category: 'defensive',
    mods: [{ text: '+100 to maximum Life' }],
  },
  {
    id: 'inc-life-10',
    name: '+10% Increased Life',
    description: '10% increased maximum life',
    category: 'defensive',
    mods: [{ text: '10% increased maximum Life' }],
  },
  {
    id: 'flat-es-200',
    name: '+200 Flat ES',
    description: '+200 to maximum energy shield',
    category: 'defensive',
    mods: [{ text: '+200 to maximum Energy Shield' }],
  },
  {
    id: 'inc-es-10',
    name: '+10% Increased ES',
    description: '10% increased maximum energy shield',
    category: 'defensive',
    mods: [{ text: '10% increased maximum Energy Shield' }],
  },
  {
    id: 'max-res-1',
    name: '+1% Max All Res',
    description: '+1% to maximum fire/cold/lightning resistance',
    category: 'defensive',
    mods: [
      { text: '+1% to maximum Fire Resistance' },
      { text: '+1% to maximum Cold Resistance' },
      { text: '+1% to maximum Lightning Resistance' },
    ],
  },
  {
    id: 'flat-armour-500',
    name: '+500 Flat Armour',
    description: '+500 to armour',
    category: 'defensive',
    mods: [{ text: '+500 to Armour' }],
  },
  {
    id: 'inc-evasion-10',
    name: '+10% Increased Evasion',
    description: '10% increased evasion rating',
    category: 'defensive',
    mods: [{ text: '10% increased Evasion Rating' }],
  },
  {
    id: 'spell-suppress-5',
    name: '+5% Spell Suppression',
    description: '+5% chance to suppress spell damage',
    category: 'defensive',
    mods: [{ text: '+5% chance to Suppress Spell Damage' }],
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
