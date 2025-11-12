import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
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
      <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xs">
        No data
      </div>
    )
  }
  
  const formatDuration = (value: number) => {
    const hours = Math.floor(value / 60)
    const minutes = Math.round(value % 60)
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id="durationGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="densityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="dateLabel" 
          tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          yAxisId="duration"
          tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          axisLine={false}
          tickLine={false}
          width={30}
          tickFormatter={formatDuration}
        />
        <YAxis 
          yAxisId="density"
          orientation="right"
          tick={{ fontSize: 10, fill: '#10B981' }}
          axisLine={false}
          tickLine={false}
          width={35}
          tickFormatter={(value) => `${value.toFixed(1)}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'Duration') return [formatDuration(value), 'Duration']
            if (name === 'Density') return [`${value.toFixed(1)} kg/min`, 'Volume/min']
            return [value, name]
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Area
          yAxisId="duration"
          type="monotone"
          dataKey="duration"
          stroke="var(--primary-500)"
          fillOpacity={1}
          fill="url(#durationGradient)"
          strokeWidth={2}
        />
        <Area
          yAxisId="density"
          type="monotone"
          dataKey="density"
          stroke="#10B981"
          fillOpacity={0.5}
          fill="url(#densityGradient)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default DurationDensityChart

