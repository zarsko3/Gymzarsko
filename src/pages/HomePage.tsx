import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, subDays, startOfWeek, endOfWeek, isWithinInterval, endOfDay, startOfDay } from 'date-fns'
import type { Workout, WorkoutType, FilterOptions, CompareMode } from '../types'
import WeeklyCalendar from '../components/home/WeeklyCalendar'
import WorkoutTypeModal from '../components/home/WorkoutTypeModal'
import Banner from '../components/home/Banner'
import { subscribeToWorkouts } from '../services/workoutServiceFacade'
import AnalyticsFilters from '../components/analytics/AnalyticsFilters'
import MiniChartCard from '../components/analytics/MiniChartCard'
import VolumeTrendChart from '../components/analytics/VolumeTrendChart'
import IntensitySetsChart from '../components/analytics/IntensitySetsChart'
import DurationDensityChart from '../components/analytics/DurationDensityChart'
import ConsistencyHeatmap from '../components/analytics/ConsistencyHeatmap'
import {
  filterWorkouts,
  getAllWorkoutMetrics,
  compareWorkouts,
} from '../services/workoutAnalyticsService'

function HomePage() {
  const navigate = useNavigate()
  const today = new Date()
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filter and comparison state
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: startOfDay(subDays(today, 29)), // 30 days
      end: endOfDay(today),
    },
    workoutType: 'all',
  })
  const [compareMode, setCompareMode] = useState<CompareMode>('last-vs-average')
  
  // Subscribe to workout data for real-time updates
  useEffect(() => {
    setIsLoading(true)
    // Use real-time listener
    const unsubscribe = subscribeToWorkouts((workouts) => {
      setAllWorkouts(workouts)
      setIsLoading(false)
    })
    
    return () => {
      unsubscribe()
    }
  }, [])
  
  const weekStart = startOfWeek(today, { weekStartsOn: 0 }) // Start on Sunday (U.S. calendar)
  const weekEnd = addDays(weekStart, 6)
  
  const workoutDays = allWorkouts.map(w => w.date)

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
  
  const consistencyComparison = useMemo(() => {
    // For consistency, we compare workout count
    const workoutCount = metrics.length
    if (compareMode === 'week-over-week') {
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 0 })
      const thisWeekEnd = endOfWeek(today, { weekStartsOn: 0 })
      const lastWeekStart = subDays(thisWeekStart, 7)
      const lastWeekEnd = subDays(thisWeekEnd, 7)
      
      const thisWeekCount = metrics.filter(m =>
        isWithinInterval(m.date, { start: thisWeekStart, end: thisWeekEnd })
      ).length
      
      const lastWeekCount = metrics.filter(m =>
        isWithinInterval(m.date, { start: lastWeekStart, end: lastWeekEnd })
      ).length
      
      const change = thisWeekCount - lastWeekCount
      const changePercent = lastWeekCount > 0 ? (change / lastWeekCount) * 100 : 0
      
      return {
        current: thisWeekCount,
        previous: lastWeekCount,
        change,
        changePercent,
      }
    }
    return null
  }, [metrics, compareMode, today])
  
  // Format values for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`
    return Math.round(volume).toString()
  }
  
  const formatIntensity = (intensity: number) => {
    return `${Math.round(intensity)}kg`
  }
  
  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 60)
    const minutes = Math.round(duration % 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Show loading state if needed
  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    )
  }

  const handleTodayClick = () => {
    setShowWorkoutModal(true)
  }

  const handleWorkoutSelect = (type: WorkoutType) => {
    navigate(`/workout/active?type=${type}`)
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-full">
      <div className="w-full max-w-full px-4 py-6 space-y-6">
        {/* Banner - Always shows rotating banners */}
        <Banner mode="random-banners" />

        {/* Date */}
        <p className="text-[var(--text-secondary)] text-base text-center">
          {format(today, 'EEEE, MMMM do')}
        </p>

        {/* Weekly Calendar */}
        <WeeklyCalendar 
          workoutDays={workoutDays}
          currentDate={today}
          onTodayClick={handleTodayClick}
        />

        {/* Analytics Dashboard */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Workout Analytics</h3>
          
          {/* Filters */}
          <AnalyticsFilters
            filters={filters}
            compareMode={compareMode}
            onFiltersChange={setFilters}
            onCompareModeChange={setCompareMode}
          />
          
          {/* Mini Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Volume Trend */}
            <MiniChartCard
              title="Volume Trend"
              value={volumeComparison ? `${formatVolume(volumeComparison.current)} kg` : '--'}
              comparison={volumeComparison}
              isLoading={isLoading}
              chart={<VolumeTrendChart metrics={metrics} compareMode={compareMode} />}
            />
            
            {/* Intensity vs Sets */}
            <MiniChartCard
              title="Intensity vs Sets"
              value={intensityComparison ? formatIntensity(intensityComparison.current) : '--'}
              comparison={intensityComparison}
              isLoading={isLoading}
              chart={<IntensitySetsChart metrics={metrics} compareMode={compareMode} />}
            />
            
            {/* Duration & Density */}
            <MiniChartCard
              title="Duration & Density"
              value={durationComparison ? formatDuration(durationComparison.current) : '--'}
              comparison={durationComparison}
              isLoading={isLoading}
              chart={<DurationDensityChart metrics={metrics} compareMode={compareMode} />}
            />
            
            {/* Consistency Heatmap */}
            <MiniChartCard
              title="Consistency"
              value={consistencyComparison ? `${consistencyComparison.current} workouts` : `${metrics.length} workouts`}
              comparison={consistencyComparison}
              isLoading={isLoading}
              chart={<ConsistencyHeatmap metrics={metrics} dateRange={filters.dateRange} />}
            />
          </div>
        </div>
      </div>

      {/* Workout Type Selection Modal */}
      <WorkoutTypeModal
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        onSelectWorkout={handleWorkoutSelect}
      />
    </div>
  )
}

export default HomePage
