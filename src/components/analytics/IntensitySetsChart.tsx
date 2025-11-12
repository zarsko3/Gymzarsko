import { useMemo } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
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
      <div className="w-full h-full flex items-center justify-center text-[var(--text-dim)] text-xs">
        No data
      </div>
    )
  }
  
  return (
    <div className="w-full">
      {/* Legend dots */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-[var(--text-dim)] mb-2">
        <div className="flex items-center gap-1">
          <span className="text-[var(--accent)]">●</span>
          <span>Intensity</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-white/20">█</span>
          <span>Sets</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <ComposedChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradLineIntensity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-strong)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity=".2" />
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
              if (name === 'intensity') return [`${value.toFixed(1)} kg`, 'Intensity']
              if (name === 'sets') return [value, 'Sets']
              return [value, name]
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Bar
            dataKey="sets"
            barSize={6}
            radius={[3, 3, 0, 0]}
            fill="rgba(255,255,255,.06)"
          />
          <Line
            type="monotone"
            dataKey="intensity"
            stroke="url(#gradLineIntensity)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: 'var(--accent-strong)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default IntensitySetsChart

