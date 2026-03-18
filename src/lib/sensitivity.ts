import type { Factor, BuildData } from '../types/pob'
import { getNotableIconUrl, getSlotIconFilename } from './icons'

type CalcResult = { ok: boolean; FullDPS?: number; CombinedDPS?: number; TotalDPS?: number; [k: string]: unknown }
type CalcWithFn = (params: object) => Promise<CalcResult>

function extractDps(result: CalcResult): number {
  if (!result.ok) return 0
  return (result.CombinedDPS as number) || (result.FullDPS as number) || (result.TotalDPS as number) || 0
}

interface Job {
  params: object
  factor: Omit<Factor, 'withoutDps' | 'impactPct' | 'impactAbs'>
  threshold: number // minimum impact % to include
}

/**
 * Run sensitivity analysis with streaming results.
 * Calls onFactor for each result as it arrives so the UI updates live.
 */
export async function runSensitivityAnalysis(
  build: BuildData,
  baselineDps: number,
  calcWith: CalcWithFn,
  onFactor: (factor: Factor) => void,
  onProgress?: (pct: number, label: string) => void
): Promise<void> {
  if (baselineDps <= 0) return
  const logLines: string[] = [`[${new Date().toISOString()}] Sensitivity starting, baselineDps=${baselineDps}`]

  // Build all jobs upfront
  const jobs: Job[] = []

  // 1. Gems — test all enabled gems in all groups
  const skillSets = build.skills?.skillSets
  if (skillSets?.[0]) {
    for (let groupIdx = 0; groupIdx < skillSets[0].length; groupIdx++) {
      const group = skillSets[0][groupIdx]
      if (!group?.enabled || !group.gems) continue
      const groupName = group.label || group.gems[0]?.nameSpec || `Group ${groupIdx + 1}`
      const groupSlot = group.slot || ''

      for (let gemIdx = 0; gemIdx < group.gems.length; gemIdx++) {
        const gem = group.gems[gemIdx]
        if (!gem.enabled) continue

        jobs.push({
          params: { disableGem: { groupIdx, gemName: gem.nameSpec, skillId: gem.skillId, gemIdx } },
          factor: {
            id: `gem-${groupIdx}-${gemIdx}`,
            category: 'gem',
            name: gem.nameSpec,
            detail: `L${gem.level}${gem.quality > 0 ? `/Q${gem.quality}` : ''}`,
            groupLabel: groupSlot ? `${groupName} [${groupSlot}]` : groupName,
            baselineDps,
            gemColor: (gem as any).color || 0,
          },
          threshold: 0,
        })
      }
    }
  }

  // 2. Items
  const slots = (build.items?.slots || []) as Array<{name: string; itemId?: number; itemName?: string}>
  for (const slot of slots) {
    if (!slot.itemId || slot.itemId === 0) continue
    const displayName = slot.itemName || slot.name
    jobs.push({
      params: { unequipSlot: slot.name },
      factor: {
        id: `item-${slot.name}`,
        category: 'item',
        slotIcon: getSlotIconFilename(slot.name),
        name: displayName,
        slot: slot.name,
        baselineDps,
      },
      threshold: 0.1,
    })
  }

  // 3. Notables
  const notables = (build.tree as Record<string, unknown>)?.notables as Array<{id: number; name: string; type: string; icon?: string; sprite?: {x: number; y: number; w: number; h: number}}> | undefined
  if (notables) {
    for (const notable of notables) {
      jobs.push({
        params: { removeNode: notable.id },
        factor: {
          id: `node-${notable.id}`,
          category: 'notable',
          name: notable.name,
          detail: notable.type === 'keystone' ? 'Keystone' : 'Notable',
          sprite: notable.sprite,
          baselineDps,
        },
        threshold: 0.1,
      })
    }
  }

  logLines.push(`  ${jobs.length} jobs queued`)

  // Try parallel batch first (multiple LuaJIT workers), fall back to chunked serial
  const parallelFn = (window as any).api?.pob?.parallelBatchCalc
  const batchFn = (window as any).api?.pob?.batchCalc

  if (parallelFn && jobs.length > 10) {
    onProgress?.(5, `Spawning workers for ${jobs.length} jobs...`)
    try {
      const result = await parallelFn(jobs.map(j => j.params)) as { ok: boolean; results?: CalcResult[]; workerCount?: number }
      if (result.ok && result.results) {
        logLines.push(`  Parallel mode: ${result.workerCount} workers`)
        for (let i = 0; i < jobs.length; i++) {
          const job = jobs[i]
          const r = result.results[i]
          if (!r || !r.ok) continue
          const dpsWithout = extractDps(r)
          const impactAbs = baselineDps - dpsWithout
          const impactPct = (impactAbs / baselineDps) * 100
          logLines.push(`  ${job.factor.name} [${job.factor.category}]: dpsWithout=${dpsWithout.toFixed(0)} impact=${impactAbs.toFixed(0)} (${impactPct.toFixed(1)}%)`)
          if (Math.abs(impactPct) >= job.threshold) {
            onFactor({ ...job.factor, withoutDps: dpsWithout, impactPct, impactAbs })
          }
        }
        logLines.push(`\nDone (parallel). ${jobs.length} jobs.`)
        ;(window as any).__sensitivityLog = logLines.join('\n')
        onProgress?.(100, 'Done')
        return
      }
    } catch { /* fall through to chunked */ }
  }

  const CHUNK_SIZE = 5

  if (batchFn) {
    for (let chunkStart = 0; chunkStart < jobs.length; chunkStart += CHUNK_SIZE) {
      const chunk = jobs.slice(chunkStart, chunkStart + CHUNK_SIZE)
      const pct = Math.min((chunkStart / jobs.length) * 100, 99)
      onProgress?.(pct, `${chunk[0].factor.name}...`)

      try {
        const batchResult = await batchFn(chunk.map(j => j.params)) as { ok: boolean; results?: CalcResult[] }
        if (batchResult.ok && batchResult.results) {
          for (let i = 0; i < chunk.length; i++) {
            const job = chunk[i]
            const result = batchResult.results[i]
            if (!result || !result.ok) continue

            const dpsWithout = extractDps(result)
            const impactAbs = baselineDps - dpsWithout
            const impactPct = (impactAbs / baselineDps) * 100

            logLines.push(`  ${job.factor.name} [${job.factor.category}]: dpsWithout=${dpsWithout.toFixed(0)} impact=${impactAbs.toFixed(0)} (${impactPct.toFixed(1)}%)`)

            if (Math.abs(impactPct) >= job.threshold) {
              onFactor({ ...job.factor, withoutDps: dpsWithout, impactPct, impactAbs })
            }
          }
        }
      } catch { /* skip chunk */ }
    }
  } else {
    // Fallback: sequential
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      onProgress?.(Math.min((i / jobs.length) * 100, 99), `${job.factor.name}...`)
      try {
        const result = await calcWith(job.params)
        const dpsWithout = extractDps(result)
        const impactAbs = baselineDps - dpsWithout
        const impactPct = (impactAbs / baselineDps) * 100
        logLines.push(`  ${job.factor.name}: dpsWithout=${dpsWithout.toFixed(0)} impact=${impactAbs.toFixed(0)} (${impactPct.toFixed(1)}%)`)
        if (Math.abs(impactPct) >= job.threshold) {
          onFactor({ ...job.factor, withoutDps: dpsWithout, impactPct, impactAbs })
        }
      } catch { /* skip */ }
    }
  }

  logLines.push(`\nDone. ${jobs.length} jobs processed.`)
  ;(window as any).__sensitivityLog = logLines.join('\n')
  onProgress?.(100, 'Done')
}

export function getImpactTier(pct: number): 'critical' | 'major' | 'moderate' | 'minor' {
  if (pct >= 30) return 'critical'
  if (pct >= 15) return 'major'
  if (pct >= 5) return 'moderate'
  return 'minor'
}

export const TIER_COLORS = {
  critical: '#E55',
  major: '#E89B3A',
  moderate: '#AF9A5A',
  minor: '#7A6A4A'
} as const
