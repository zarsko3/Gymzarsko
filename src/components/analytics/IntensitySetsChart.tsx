import { useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import type { WorkoutMetrics } from '../../types'
import { getIntensitySetsData } from '../../services/workoutAnalyticsService'

interface IntensitySetsChartProps {
  metrics: WorkoutMetrics[]
}

function IntensitySetsChart({ metrics }: IntensitySetsChartProps) {
  const chartData = useMemo(() => {
    return getIntensitySetsData(metrics)
  }, [metrics])
  
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xs">
        No data
      </div>
    )
  }
  
  // Color scale based on date (newer = brighter)
  const getColor = (date: Date) => {
    const now = new Date()
    const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff < 7) return '#34D399' // primary-500
    if (daysDiff < 30) return '#10B981' // green-500
    return '#6B7280' // gray-500
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <XAxis 
          type="number"
          dataKey="sets"
          name="Sets"
          tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          axisLine={false}
          tickLine={false}
          domain={['dataMin - 2', 'dataMax + 2']}
        />
        <YAxis 
          type="number"
          dataKey="intensity"
          name="Intensity"
          tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          axisLine={false}
          tickLine={false}
          width={35}
          tickFormatter={(value) => `${Math.round(value)}kg`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'Intensity') return [`${value.toFixed(1)} kg`, 'Intensity']
            if (name === 'Sets') return [value, 'Sets']
            return [value, name]
          }}
          labelFormatter={(label) => `Date: ${label}`}
          cursor={{ strokeDasharray: '3 3' }}
        />
        <Scatter dataKey="intensity" fill="var(--primary-500)">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.date)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export default IntensitySetsChart

