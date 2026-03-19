import { useState, useEffect } from 'react'

const api = (window as any).api

interface RecoveryData {
  life: {
    pool: number
    unreserved: number
    regen: number
    leechRate: number
    maxLeechRate: number
    onBlock: number
    onSuppress: number
    recoveryRateMod: number
    netRegen: number
    recoupAvg: number
  }
  energyShield: {
    pool: number
    recharge: number
    rechargeDelay: number
    regen: number
    leechRate: number
  }
  mana: {
    pool: number
    unreserved: number
    regen: number
  }
  ward: {
    pool: number
  }
  totalLifeRecoveryPerSecond: number
  timeToRecover50Pct: number
}

const DPS_TIERS = [
  { label: 'T16 Map', dps: 3000, color: '#4ADE80' },
  { label: 'Maven', dps: 5000, color: '#E8D23A' },
  { label: 'Uber Boss', dps: 10000, color: '#EF4444' },
]

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function fmtTime(seconds: number): string {
  if (seconds <= 0) return '\u221E'
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`
  return `${seconds.toFixed(2)}s`
}

export function RecoverySufficiency() {
  const [data, setData] = useState<RecoveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLoading(true)
      setError(null)
      try {
        const result = await api.pob.getRecoveryAnalysis()
        if (!cancelled) setData(result)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to fetch recovery data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="panel p-6">
        <h2 className="text-poe-gold font-semibold text-lg mb-4">Recovery Sufficiency</h2>
        <div className="text-poe-muted text-sm text-center py-8">Loading recovery data...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="panel p-6">
        <h2 className="text-poe-gold font-semibold text-lg mb-4">Recovery Sufficiency</h2>
        <div className="text-red-400 text-sm text-center py-8">{error || 'No recovery data available'}</div>
      </div>
    )
  }

  const life = data.life
  const es = data.energyShield
  const mana = data.mana

  // Build life recovery breakdown segments
  const lifeSegments: Array<{ label: string; value: number; color: string }> = []
  if (life.regen > 0) lifeSegments.push({ label: 'Regen', value: life.regen, color: '#4ADE80' })
  if (life.leechRate > 0) lifeSegments.push({ label: 'Leech', value: life.leechRate, color: '#F87171' })
  if (life.recoupAvg > 0) lifeSegments.push({ label: 'Recoup', value: life.recoupAvg, color: '#A78BFA' })
  if (life.onBlock > 0) lifeSegments.push({ label: 'On Block', value: life.onBlock, color: '#60A5FA' })
  if (life.onSuppress > 0) lifeSegments.push({ label: 'On Suppress', value: life.onSuppress, color: '#38BDF8' })

  const totalLifeRecovery = data.totalLifeRecoveryPerSecond
  const maxSegmentTotal = Math.max(totalLifeRecovery, 1)

  // Sustainability gauge
  const maxTierDps = DPS_TIERS[DPS_TIERS.length - 1].dps
  const gaugeMax = Math.max(maxTierDps * 1.2, totalLifeRecovery * 1.1)

  return (
    <div className="panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-poe-gold font-semibold text-lg">Recovery Sufficiency</h2>
        <span className="text-xs text-poe-muted/60">
          Pool: {life.unreserved.toLocaleString()} / {life.pool.toLocaleString()} Life
        </span>
      </div>

      {/* Life Recovery Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider">Life Recovery</div>
          <div className="text-sm font-bold text-poe-gold tabular-nums">{fmt(totalLifeRecovery)}/s total</div>
        </div>

        {lifeSegments.length > 0 ? (
          <>
            {/* Stacked horizontal bar */}
            <div className="h-6 rounded overflow-hidden flex bg-poe-border/10">
              {lifeSegments.map(seg => {
                const pct = (seg.value / maxSegmentTotal) * 100
                return (
                  <div
                    key={seg.label}
                    className="h-full flex items-center justify-center text-[10px] font-medium text-black/80 overflow-hidden whitespace-nowrap"
                    style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: seg.color }}
                    title={`${seg.label}: ${fmt(seg.value)}/s`}
                  >
                    {pct > 12 ? `${fmt(seg.value)}/s` : ''}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-1.5">
              {lifeSegments.map(seg => (
                <span key={seg.label} className="flex items-center gap-1 text-[10px] text-poe-muted/60">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
                  {seg.label}: {fmt(seg.value)}/s
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="text-xs text-poe-muted/50 py-2">No life recovery sources detected</div>
        )}
      </div>

      {/* 50% Recovery Time */}
      <div className="bg-black/30 rounded-lg p-5 border border-poe-border/50 text-center">
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Time to Recover 50% Life</div>
        <div className="text-4xl font-bold tabular-nums" style={{
          color: data.timeToRecover50Pct <= 1 ? '#4ADE80'
            : data.timeToRecover50Pct <= 3 ? '#E8D23A'
            : '#EF4444'
        }}>
          {fmtTime(data.timeToRecover50Pct)}
        </div>
        <div className="text-[10px] text-poe-muted/50 mt-1">
          {data.timeToRecover50Pct <= 1 ? 'Excellent recovery'
            : data.timeToRecover50Pct <= 3 ? 'Moderate recovery'
            : 'Slow recovery — consider more sustain'}
        </div>
      </div>

      {/* Sustainability Gauge */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Sustainability vs Content</div>
        <div className="relative bg-black/20 rounded p-3 border border-poe-border/20">
          {/* Recovery bar */}
          <div className="h-5 bg-poe-border/10 rounded-full overflow-hidden relative mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((totalLifeRecovery / gaugeMax) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #4ADE80, #22D3EE)',
              }}
            />
            {/* Tier markers */}
            {DPS_TIERS.map(tier => {
              const pos = (tier.dps / gaugeMax) * 100
              return (
                <div
                  key={tier.label}
                  className="absolute top-0 h-full w-0.5"
                  style={{ left: `${pos}%`, backgroundColor: tier.color + '80' }}
                  title={`${tier.label}: ${tier.dps.toLocaleString()} DPS`}
                />
              )
            })}
          </div>

          {/* Tier labels */}
          <div className="space-y-1">
            {DPS_TIERS.map(tier => {
              const sustained = totalLifeRecovery >= tier.dps
              return (
                <div key={tier.label} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-center" style={{ color: sustained ? '#4ADE80' : tier.color }}>
                    {sustained ? '\u2713' : '\u2717'}
                  </span>
                  <span className="text-poe-muted/70 w-20">{tier.label}</span>
                  <span className="text-poe-muted/50 tabular-nums">~{tier.dps.toLocaleString()} DPS</span>
                  <span className="ml-auto text-[10px] tabular-nums" style={{ color: sustained ? '#4ADE80' : tier.color }}>
                    {sustained
                      ? `+${fmt(totalLifeRecovery - tier.dps)}/s surplus`
                      : `-${fmt(tier.dps - totalLifeRecovery)}/s deficit`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ES Recovery */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Energy Shield Recovery</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-black/30 rounded p-3 border border-poe-border/30 text-center">
            <div className="text-sm font-semibold text-blue-300 tabular-nums">{fmt(es.pool)}</div>
            <div className="text-[10px] text-poe-muted/70">ES Pool</div>
          </div>
          <div className="bg-black/30 rounded p-3 border border-poe-border/30 text-center">
            <div className="text-sm font-semibold text-blue-300 tabular-nums">{fmt(es.recharge)}/s</div>
            <div className="text-[10px] text-poe-muted/70">Recharge Rate</div>
          </div>
          <div className="bg-black/30 rounded p-3 border border-poe-border/30 text-center">
            <div className="text-sm font-semibold text-blue-300 tabular-nums">{es.rechargeDelay.toFixed(2)}s</div>
            <div className="text-[10px] text-poe-muted/70">Recharge Delay</div>
          </div>
        </div>
        {(es.regen > 0 || es.leechRate > 0) && (
          <div className="flex gap-3 mt-2">
            {es.regen > 0 && (
              <span className="text-[10px] text-poe-muted/50">Regen: {fmt(es.regen)}/s</span>
            )}
            {es.leechRate > 0 && (
              <span className="text-[10px] text-poe-muted/50">Leech: {fmt(es.leechRate)}/s</span>
            )}
          </div>
        )}
      </div>

      {/* Mana */}
      <div>
        <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Mana</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/30 rounded p-3 border border-poe-border/30 text-center">
            <div className="text-sm font-semibold text-blue-400 tabular-nums">
              {mana.unreserved.toLocaleString()} / {mana.pool.toLocaleString()}
            </div>
            <div className="text-[10px] text-poe-muted/70">Unreserved / Total</div>
          </div>
          <div className="bg-black/30 rounded p-3 border border-poe-border/30 text-center">
            <div className="text-sm font-semibold text-blue-400 tabular-nums">{fmt(mana.regen)}/s</div>
            <div className="text-[10px] text-poe-muted/70">Mana Regen</div>
          </div>
        </div>
      </div>

      {/* Recovery Rate Modifier */}
      {life.recoveryRateMod !== 0 && (
        <div className="text-xs text-poe-muted/50 text-center border-t border-poe-border/20 pt-3">
          Life Recovery Rate Modifier: <span className="text-poe-gold tabular-nums">
            {life.recoveryRateMod > 0 ? '+' : ''}{life.recoveryRateMod.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  )
}
