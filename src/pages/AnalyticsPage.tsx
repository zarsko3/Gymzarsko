import { useState, useEffect, useMemo } from 'react'
import { startOfDay, endOfDay, subDays } from 'date-fns'
import type { FilterOptions, CompareMode } from '../types'
import {
  filterWorkouts,
  getAllWorkoutMetrics,
  compareWorkouts,
} from '../services/workoutAnalyticsService'
import { fmtKg, fmtMin, deltaPill } from '../utils/numberFormatters'
import AnalyticsFilters from '../components/analytics/AnalyticsFilters'
import StatCard from '../components/analytics/StatCard'
import VolumeTrendChart from '../components/analytics/VolumeTrendChart'
import IntensitySetsChart from '../components/analytics/IntensitySetsChart'
import DurationDensityChart from '../components/analytics/DurationDensityChart'
import WeekdayConsistency from '../components/analytics/WeekdayConsistency'
import { useWorkoutsSubscription } from '../hooks/useWorkoutsSubscription'
import { useToast } from '../hooks/useToast'

function AnalyticsPage() {
  const today = new Date()
  const { workouts: allWorkouts, isLoading, error } = useWorkoutsSubscription()
  const { showToast } = useToast()
  
  // Filter and comparison state
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: startOfDay(subDays(today, 29)), // 30 days
      end: endOfDay(today),
    },
    workoutType: 'all',
  })
  const [compareMode, setCompareMode] = useState<CompareMode>('last-vs-average')
  
  useEffect(() => {
    if (error) {
      showToast('error', 'Unable to load analytics data. Please try again.')
    }
  }, [error, showToast])

  // Filter and compute metrics
  const filteredWorkouts = useMemo(() => {
    return filterWorkouts(allWorkouts, filters)
  }, [allWorkouts, filters])
  
  const metrics = useMemo(() => {
    return getAllWorkoutMetrics(filteredWorkouts)
  }, [filteredWorkouts])
  
  // Comparison results for each metric
  const volumeComparison = useMemo(() => {
    return compareWorkouts(metrics, compareMode, 'totalVolume')
  }, [metrics, compareMode])
  
  const intensityComparison = useMemo(() => {
    return compareWorkouts(metrics, compareMode, 'intensity')
  }, [metrics, compareMode])
  
  const durationComparison = useMemo(() => {
    return compareWorkouts(metrics, compareMode, 'duration')
  }, [metrics, compareMode])
  
  const densityComparison = useMemo(() => {
    return compareWorkouts(metrics, compareMode, 'volumePerMinute')
  }, [metrics, compareMode])
  
  // Format values and deltas
  const volumeValue = volumeComparison ? fmtKg(volumeComparison.current) : '--'
  const volumeDelta = volumeComparison && volumeComparison.changePercent !== 0 
    ? deltaPill(volumeComparison.changePercent) 
    : null
  
  const intensityValue = intensityComparison 
    ? `${Math.round(intensityComparison.current)}kg` 
    : '--'
  const intensityDelta = intensityComparison && intensityComparison.changePercent !== 0
    ? deltaPill(intensityComparison.changePercent)
    : null
  
  const durationValue = durationComparison 
    ? fmtMin(durationComparison.current) 
    : '--'
  const durationDelta = durationComparison && durationComparison.changePercent !== 0
    ? deltaPill(durationComparison.changePercent)
    : null
  
  const consistencyValue = `${metrics.length} workout${metrics.length !== 1 ? 's' : ''}`
  const consistencyDelta = null // Can be enhanced later

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="px-4 pt-4 pb-24 space-y-4">
        {/* Filters */}
        <AnalyticsFilters
          filters={filters}
          compareMode={compareMode}
          onFiltersChange={setFilters}
          onCompareModeChange={setCompareMode}
        />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Volume Trend */}
          <StatCard
            title="Volume Trend"
            value={volumeValue}
            delta={volumeDelta}
            isLoading={isLoading}
          >
            <VolumeTrendChart metrics={metrics} compareMode={compareMode} />
          </StatCard>
          
          {/* Intensity vs Sets */}
          <StatCard
            title="Intensity vs Sets"
            value={intensityValue}
            delta={intensityDelta}
            isLoading={isLoading}
          >
            <IntensitySetsChart metrics={metrics} compareMode={compareMode} />
          </StatCard>
          
          {/* Duration & Density */}
          <StatCard
            title="Duration & Density"
            value={durationValue}
            delta={durationDelta}
            isLoading={isLoading}
          >
            <DurationDensityChart metrics={metrics} compareMode={compareMode} />
          </StatCard>
          
          {/* Consistency */}
          <StatCard
            title="Consistency"
            value={consistencyValue}
            delta={consistencyDelta}
            isLoading={isLoading}
          >
            <WeekdayConsistency 
              metrics={metrics} 
              dateRange={filters.dateRange}
              compareMode={compareMode}
            />
          </StatCard>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage

