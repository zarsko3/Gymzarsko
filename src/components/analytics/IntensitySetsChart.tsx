import { useMemo } from 'react'
import type { WorkoutMetrics, CompareMode } from '../../types'
import { getIntensityData } from '../../services/workoutAnalyticsService'
import CurvyMetricChart from './CurvyMetricChart'

interface IntensitySetsChartProps {
  metrics: WorkoutMetrics[]
  compareMode: CompareMode
}

function IntensitySetsChart({ metrics, compareMode }: IntensitySetsChartProps) {
  const { chartData, comparisonData } = useMemo(() => {
    return getIntensityData(metrics, compareMode)
  }, [metrics, compareMode])
  
  // For ultra-minimal, just show the intensity line
  // Sets can be shown as faint bars if desired, but keeping it minimal for now
  return (
    <CurvyMetricChart
      data={chartData}
      metric="intensity"
      compare={comparisonData}
      height={220}
      unit="KG"
    />
  )
}

export default IntensitySetsChart

