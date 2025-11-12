import { useMemo } from 'react'
import { AreaChart, Area, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { WorkoutMetrics, CompareMode } from '../../types'
import { getDurationDensityData } from '../../services/workoutAnalyticsService'

interface DurationDensityChartProps {
  metrics: WorkoutMetrics[]
  compareMode: CompareMode
}

function DurationDensityChart({ metrics, compareMode }: DurationDensityChartProps) {
  const { chartData } = useMemo(() => {
    return getDurationDensityData(metrics, compareMode)
  }, [metrics, compareMode])
  
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[var(--text-dim)] text-xs">
        No data
      </div>
    )
  }
  
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradLineDuration" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-strong)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity=".2" />
          </linearGradient>
          <linearGradient id="gradFillDuration" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity=".18" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <XAxis hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: '#0f1726',
            border: '1px solid rgba(255,255,255,.06)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'density') return [`${value.toFixed(1)} kg/min`, 'Volume/min']
            if (name === 'duration') {
              const hours = Math.floor(value / 60)
              const minutes = Math.round(value % 60)
              const formatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
              return [formatted, 'Duration']
            }
            return [value, name]
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        {/* Density as area (primary) */}
        <Area
          type="monotone"
          dataKey="density"
          stroke="url(#gradLineDuration)"
          strokeWidth={3}
          fill="url(#gradFillDuration)"
          dot={false}
          activeDot={{ r: 5, fill: 'var(--accent-strong)' }}
        />
        {/* Duration as thin dashed overlay */}
        <Line
          type="monotone"
          dataKey="duration"
          stroke="rgba(255,255,255,.3)"
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default DurationDensityChart

