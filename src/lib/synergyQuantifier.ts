// ---------------------------------------------------------------------------
// Synergy Quantifier — calculates actual DPS/EHP impact of detected synergies
// by disabling the relevant build element and measuring the delta.
// ---------------------------------------------------------------------------

import type { DetectedSynergy, SynergyData } from './synergies'

const api = (window as any).api

// Maps synergy rule IDs to what should be disabled to measure their impact.
// Returns null if the synergy can't be easily quantified.
interface QuantifyJob {
  synergyId: string
  calcParams: Record<string, unknown>
}

/**
 * Build calc_with jobs for each quantifiable synergy.
 */
function buildQuantifyJobs(
  synergies: DetectedSynergy[],
  synergyData: SynergyData
): QuantifyJob[] {
  const jobs: QuantifyJob[] = []

  for (const s of synergies) {
    const job = getJobForSynergy(s, synergyData)
    if (job) jobs.push(job)
  }

  return jobs
}

function getJobForSynergy(
  synergy: DetectedSynergy,
  data: SynergyData
): QuantifyJob | null {
  const id = synergy.rule.id

  // --- Support gem synergies: disable the support gem ---
  const supportGemMap: Record<string, string> = {
    'trinity-multi-element': 'Trinity',
    'impale-stacking': 'Impale',
    'archmage-high-mana': 'Archmage',
    'spell-echo-detected': 'Spell Echo',
    'multistrike-detected': 'Multistrike',
    'gmp-detected': 'Greater Multiple Projectiles',
    'mirage-archer-bow': 'Mirage Archer',
    'brutality-pure-phys': 'Brutality',
    'chain-fork-proj': 'Chain',
    'unleash-spell': 'Unleash',
    'empower-scaling': 'Empower',
  }

  if (supportGemMap[id]) {
    // Find the support gem name in the data
    const gemName = supportGemMap[id]
    const matchingSupport = data.supports.find(s =>
      s.toLowerCase().includes(gemName.toLowerCase())
    )
    if (matchingSupport) {
      return {
        synergyId: id,
        calcParams: { disableGem: { name: matchingSupport } }
      }
    }
  }

  // --- Keystone synergies: remove the keystone node ---
  const keystoneMap: Record<string, string> = {
    'elemental-overload-low-crit': 'Elemental Overload',
    'point-blank-projectile': 'Point Blank',
    'ci-ghost-dance': 'Chaos Inoculation',
    'mind-over-matter': 'Mind over Matter',
    'glancing-blows-block': 'Glancing Blows',
    'acrobatics-phase': 'Acrobatics',
    'divine-shield': 'Divine Shield',
    'avatar-of-fire-conversion': 'Avatar of Fire',
    'iron-will-str-stack': 'Iron Will',
    'perfect-agony-crit': 'Perfect Agony',
    'elemental-equilibrium': 'Elemental Equilibrium',
    'resolute-technique-no-crit': 'Resolute Technique',
    'crimson-dance-bleed': 'Crimson Dance',
    'precise-technique': 'Precise Technique',
    'iron-reflexes-evasion': 'Iron Reflexes',
    'wicked-ward-es': 'Wicked Ward',
    'zealots-oath-regen': "Zealot's Oath",
    'ghost-reaver-leech': 'Ghost Reaver',
    'pain-attunement-low-life': 'Pain Attunement',
    'eldritch-battery-mom': 'Eldritch Battery',
    'versatile-combatant-block': 'Versatile Combatant',
    'blood-magic-aura': 'Blood Magic',
    'call-to-arms': 'Call to Arms',
    'wind-dancer-evasion': 'Wind Dancer',
  }

  if (keystoneMap[id]) {
    return {
      synergyId: id,
      calcParams: { removeNode: keystoneMap[id] }
    }
  }

  // --- Unique item synergies: unequip the item slot ---
  const uniqueSlotMap: Record<string, string> = {
    'headhunter-equipped': 'Belt',
    'mageblood-equipped': 'Belt',
    'badge-of-the-brotherhood': 'Amulet',
    'crown-of-eyes-spell-dmg': 'Helmet',
    'ashes-of-stars': 'Amulet',
    'aegis-aurora-block': 'Weapon 2',  // shield slot
    'doryani-prototype-lightning': 'Body Armour',
  }

  if (uniqueSlotMap[id]) {
    return {
      synergyId: id,
      calcParams: { unequipSlot: uniqueSlotMap[id] }
    }
  }

  // --- Totem/mine/trap support: disable the deployment support ---
  const deploymentMap: Record<string, string> = {
    'totem-playstyle': 'Spell Totem',
    'mine-playstyle': 'High-Impact Mine',
    'trap-playstyle': 'Trap',
  }

  if (deploymentMap[id]) {
    const gemName = deploymentMap[id]
    const match = data.supports.find(s =>
      s.toLowerCase().includes(gemName.toLowerCase())
    )
    if (match) {
      return {
        synergyId: id,
        calcParams: { disableGem: { name: match } }
      }
    }
  }

  // Can't quantify this synergy
  return null
}

/**
 * Quantify detected synergies by measuring DPS/EHP impact.
 * Returns the synergies array with dpsImpact/ehpImpact filled in.
 */
export async function quantifySynergies(
  synergies: DetectedSynergy[],
  synergyData: SynergyData,
  baselineDps: number,
  baselineEhp: number,
  onProgress?: (done: number, total: number) => void
): Promise<DetectedSynergy[]> {
  const jobs = buildQuantifyJobs(synergies, synergyData)

  if (jobs.length === 0) return synergies

  // Build batch calc jobs
  const batchJobs = jobs.map(j => j.calcParams)

  let results: any[]
  try {
    // Try parallel batch first for speed
    const resp = await api.pob.parallelBatchCalc(batchJobs)
    results = resp.ok ? resp.results : []
  } catch {
    try {
      // Fall back to serial batch
      const resp = await api.pob.batchCalc(batchJobs)
      results = resp.ok ? resp.results : []
    } catch {
      return synergies
    }
  }

  // Map results back to synergies
  const impactMap = new Map<string, { dps: number; ehp: number }>()

  for (let i = 0; i < jobs.length; i++) {
    const result = results[i]
    if (!result) continue

    const withoutDps = result.CombinedDPS ?? result.FullDPS ?? result.TotalDPS ?? 0
    const withoutEhp = result.TotalEHP ?? 0

    impactMap.set(jobs[i].synergyId, {
      dps: baselineDps - withoutDps,
      ehp: baselineEhp - withoutEhp,
    })

    if (onProgress) onProgress(i + 1, jobs.length)
  }

  // Attach impacts to synergies
  return synergies.map(s => {
    const impact = impactMap.get(s.rule.id)
    if (!impact) return s
    return {
      ...s,
      dpsImpact: Math.round(impact.dps),
      dpsImpactPct: baselineDps > 0 ? (impact.dps / baselineDps) * 100 : 0,
      ehpImpact: Math.round(impact.ehp),
    }
  })
}
