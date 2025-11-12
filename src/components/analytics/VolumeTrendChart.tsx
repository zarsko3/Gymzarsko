import { useMemo } from 'react'
import type { WorkoutMetrics, CompareMode } from '../../types'
import { getVolumeTrendData } from '../../services/workoutAnalyticsService'
import CurvyMetricChart from './CurvyMetricChart'

interface VolumeTrendChartProps {
  metrics: WorkoutMetrics[]
  compareMode: CompareMode
}

function VolumeTrendChart({ metrics, compareMode }: VolumeTrendChartProps) {
  const { chartData, comparisonData } = useMemo(() => {
    return getVolumeTrendData(metrics, compareMode)
  }, [metrics, compareMode])
  
  return (
    <CurvyMetricChart
      data={chartData}
      metric="volume"
      compare={comparisonData}
      height={200}
    />
  )
}

export default VolumeTrendChart

