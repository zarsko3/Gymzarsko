import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
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
      <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xs">
        No data
      </div>
    )
  }
  
  const maxVolume = Math.max(...chartData.map(d => d.volume), 1)
  const formatVolume = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return Math.round(value).toString()
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <XAxis 
          dataKey="dateLabel" 
          tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          axisLine={false}
          tickLine={false}
          width={30}
          tickFormatter={formatVolume}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`${formatVolume(value)} kg`, 'Volume']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        {comparisonData && (
          <ReferenceLine
            y={comparisonData[0]?.value}
            stroke="var(--text-secondary)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
        )}
        <Line
          type="monotone"
          dataKey="volume"
          stroke="var(--primary-500)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--primary-500)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default VolumeTrendChart

