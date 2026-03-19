import { useState, useCallback } from 'react'

const api = (window as any).api

interface RampStage {
  label: string
  stats: {
    CombinedDPS?: number
    FullDPS?: number
    TotalDPS?: number
    Life?: number
    EnergyShield?: number
    [key: string]: number | undefined
  }
}

interface RampData {
  stages: RampStage[]
}

const BAR_COLORS = [
  'linear-gradient(180deg, #6B7280 0%, #374151 100%)',   // Base — dim grey
  'linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)',   // Charges — blue
  'linear-gradient(180deg, #FBBF24 0%, #D97706 100%)',   // Flasks — amber
  'linear-gradient(180deg, #F87171 0%, #DC2626 100%)',   // Buffs — red
]

const BAR_GLOW = [
  'rgba(107, 114, 128, 0.3)',
  'rgba(96, 165, 250, 0.3)',
  'rgba(251, 191, 36, 0.3)',
  'rgba(248, 113, 113, 0.3)',
]

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function getDps(stage: RampStage): number {
  return stage.stats.CombinedDPS || stage.stats.FullDPS || stage.stats.TotalDPS || 0
}

export function DpsRampTimeline() {
  const [data, setData] = useState<RampData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalc = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.pob.calcRampTimeline()
      setData(result)
    } catch (e: any) {
      setError(e?.message || 'Failed to calculate ramp timeline')
    } finally {
      setLoading(false)
    }
  }, [])

  const stages = data?.stages || []
  const maxDps = Math.max(1, ...stages.map(getDps))

  // Sustained = Stage index 2 (charges + flasks), Peak = last stage (all buffs)
  const sustainedDps = stages.length >= 3 ? getDps(stages[2]) : stages.length > 0 ? getDps(stages[stages.length - 1]) : 0
  const peakDps = stages.length > 0 ? getDps(stages[stages.length - 1]) : 0

  return (
    <div className="panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-poe-gold font-semibold text-lg">DPS Ramp Timeline</h2>
        <button
          onClick={handleCalc}
          disabled={loading}
          className="text-xs px-4 py-1.5 rounded bg-poe-gold/10 text-poe-gold border border-poe-gold/30 hover:bg-poe-gold/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate Ramp'}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm text-center py-4">{error}</div>
      )}

      {!data && !loading && !error && (
        <div className="text-poe-muted text-sm text-center py-8">
          Click "Calculate Ramp" to see how your DPS builds up across buff stages.
        </div>
      )}

      {loading && !data && (
        <div className="text-poe-muted text-sm text-center py-8">Calculating ramp stages...</div>
      )}

      {data && stages.length > 0 && (
        <>
          {/* CSS Bar Chart */}
          <div>
            <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-3">Stage DPS Comparison</div>
            <div className="flex items-end justify-center gap-4" style={{ height: '200px' }}>
              {stages.map((stage, i) => {
                const dps = getDps(stage)
                const heightPct = Math.max((dps / maxDps) * 100, 3)
                const barColor = BAR_COLORS[i] || BAR_COLORS[BAR_COLORS.length - 1]
                const glow = BAR_GLOW[i] || BAR_GLOW[BAR_GLOW.length - 1]

                return (
                  <div key={i} className="flex flex-col items-center flex-1 max-w-[120px] h-full justify-end">
                    {/* DPS label above bar */}
                    <div className="text-xs font-bold text-poe-gold tabular-nums mb-1.5 whitespace-nowrap">
                      {fmt(dps)}
                    </div>

                    {/* Bar */}
                    <div
                      className="w-full rounded-t transition-all duration-700 ease-out"
                      style={{
                        height: `${heightPct}%`,
                        background: barColor,
                        boxShadow: `0 0 12px ${glow}`,
                        minHeight: '8px',
                      }}
                    />

                    {/* Stage label below */}
                    <div className="text-[10px] text-poe-muted/70 mt-1.5 text-center truncate w-full">
                      {stage.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stage Breakdown Table */}
          <div>
            <div className="text-[10px] text-poe-muted/70 uppercase tracking-wider mb-2">Stage Breakdown</div>
            <div className="bg-black/20 rounded border border-poe-border/20 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-poe-border/20 text-[10px] text-poe-muted/50 uppercase tracking-wider">
                <span>Stage</span>
                <span className="text-right">DPS</span>
                <span className="text-right">Delta</span>
                <span className="text-right">% Gain</span>
              </div>

              {/* Table rows */}
              {stages.map((stage, i) => {
                const dps = getDps(stage)
                const prevDps = i > 0 ? getDps(stages[i - 1]) : 0
                const delta = i > 0 ? dps - prevDps : 0
                const pctGain = i > 0 && prevDps > 0 ? ((dps - prevDps) / prevDps) * 100 : 0
                const isPositive = delta > 0

                return (
                  <div
                    key={i}
                    className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-poe-border/10 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-sm shrink-0"
                        style={{ background: BAR_COLORS[i] || BAR_COLORS[BAR_COLORS.length - 1] }}
                      />
                      <span className="text-sm text-poe-text truncate">{stage.label}</span>
                    </div>
                    <span className="text-sm text-poe-text text-right tabular-nums font-medium">
                      {fmt(dps)}
                    </span>
                    <span
                      className="text-sm text-right tabular-nums font-medium"
                      style={{ color: i === 0 ? '#9CA3AF' : isPositive ? '#4ADE80' : '#F87171' }}
                    >
                      {i === 0 ? '\u2014' : `${isPositive ? '+' : ''}${fmt(delta)}`}
                    </span>
                    <span
                      className="text-sm text-right tabular-nums"
                      style={{ color: i === 0 ? '#9CA3AF' : isPositive ? '#4ADE80' : '#F87171' }}
                    >
                      {i === 0 ? '\u2014' : `${isPositive ? '+' : ''}${pctGain.toFixed(1)}%`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer: Sustained vs Peak */}
          <div className="flex gap-3 pt-2 border-t border-poe-border/20">
            <div className="flex-1 bg-black/30 rounded p-3 border border-poe-border/40 text-center">
              <div className="text-lg font-bold text-blue-300 tabular-nums">{fmt(sustainedDps)}</div>
              <div className="text-[10px] text-poe-muted/70">Sustained DPS</div>
              <div className="text-[9px] text-poe-muted/50 mt-0.5">Charges + Flasks</div>
            </div>
            <div className="flex-1 bg-black/30 rounded p-3 border border-poe-border/40 text-center">
              <div className="text-lg font-bold text-red-400 tabular-nums">{fmt(peakDps)}</div>
              <div className="text-[10px] text-poe-muted/70">Peak DPS</div>
              <div className="text-[9px] text-poe-muted/50 mt-0.5">All Buffs Active</div>
            </div>
          </div>
        </>
      )}

      {data && stages.length === 0 && (
        <div className="text-poe-muted text-sm text-center py-8">
          No ramp stages returned. The build may not have configurable buff stages.
        </div>
      )}
    </div>
  )
}
