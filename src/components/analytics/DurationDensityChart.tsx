import { useMemo } from 'react'
import { AreaChart, Area, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { WorkoutMetrics, CompareMode } from '../../types'
import { getDensityData, getDurationDensityData } from '../../services/workoutAnalyticsService'
import CurvyMetricChart from './CurvyMetricChart'

interface DurationDensityChartProps {
  metrics: WorkoutMetrics[]
  compareMode: CompareMode
}

function DurationDensityChart({ metrics, compareMode }: DurationDensityChartProps) {
  const { chartData: densityData, comparisonData } = useMemo(() => {
    return getDensityData(metrics, compareMode)
  }, [metrics, compareMode])
  
  const { chartData: durationData } = useMemo(() => {
    return getDurationDensityData(metrics, compareMode)
  }, [metrics, compareMode])
  
  // Primary: density with compare line
  // Overlay: duration as thin dashed line
  return (
    <div className="relative w-full" style={{ height: 200 }}>
      <CurvyMetricChart
        data={densityData}
        metric="density"
        compare={comparisonData}
        height={200}
      />
      {/* Duration overlay */}
      {durationData.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={durationData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <XAxis hide />
              <YAxis hide />
              <Line
                type="monotone"
                dataKey="duration"
                stroke="rgba(181,140,255,0.4)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default DurationDensityChart

