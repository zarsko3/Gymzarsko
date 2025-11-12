import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import type { WorkoutMetrics, CompareMode } from '../../types'
import { getVolumeTrendData } from '../../services/workoutAnalyticsService'

interface VolumeTrendChartProps {
  metrics: WorkoutMetrics[]
  compareMode: CompareMode
}

function VolumeTrendChart({ metrics, compareMode }: VolumeTrendChartProps) {
  const { chartData, comparisonData } = useMemo(() => {
    return getVolumeTrendData(metrics, compareMode)
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
          <linearGradient id="gradLineVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-strong)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity=".2" />
          </linearGradient>
          <linearGradient id="gradFillVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity=".18" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <XAxis dataKey="dateLabel" hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: '#0f1726',
            border: '1px solid rgba(255,255,255,.06)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => {
            const nf = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
            return [`${nf.format(value)} kg`, 'Volume']
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        {comparisonData && (
          <ReferenceLine
            y={comparisonData[0]?.value}
            stroke="rgba(255,255,255,.2)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
        )}
        <Area
          type="monotone"
          dataKey="volume"
          stroke="url(#gradLineVolume)"
          strokeWidth={3}
          fill="url(#gradFillVolume)"
          dot={{ r: 3, strokeWidth: 2, fill: 'var(--accent-strong)' }}
          activeDot={{ r: 5, fill: 'var(--accent-strong)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default VolumeTrendChart

