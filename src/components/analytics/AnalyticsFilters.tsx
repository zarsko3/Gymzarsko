import { subDays, startOfDay, endOfDay } from 'date-fns'
import type { FilterOptions, CompareMode, WorkoutType } from '../../types'
import PillButton from './PillButton'

interface AnalyticsFiltersProps {
  filters: FilterOptions
  compareMode: CompareMode
  onFiltersChange: (filters: FilterOptions) => void
  onCompareModeChange: (mode: CompareMode) => void
}

function AnalyticsFilters({
  filters,
  compareMode,
  onFiltersChange,
  onCompareModeChange,
}: AnalyticsFiltersProps) {
  const handleDateRangePreset = (days: number) => {
    const end = endOfDay(new Date())
    const start = startOfDay(subDays(end, days - 1))
    onFiltersChange({
      ...filters,
      dateRange: { start, end },
    })
  }
  
  const handleWorkoutTypeChange = (type: 'all' | WorkoutType) => {
    onFiltersChange({
      ...filters,
      workoutType: type,
    })
  }
  
  const isDateRangeActive = (days: number) => {
    const end = endOfDay(new Date())
    return (
      filters.dateRange.end.getTime() === end.getTime() &&
      Math.ceil((filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) === days
    )
  }
  
  return (
    <div className="space-y-3">
      {/* Row 1: Workout Type */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <PillButton active={filters.workoutType === 'all'} onClick={() => handleWorkoutTypeChange('all')}>
          All Types
        </PillButton>
        <PillButton active={filters.workoutType === 'push'} onClick={() => handleWorkoutTypeChange('push')}>
          Push
        </PillButton>
        <PillButton active={filters.workoutType === 'pull'} onClick={() => handleWorkoutTypeChange('pull')}>
          Pull
        </PillButton>
        <PillButton active={filters.workoutType === 'legs'} onClick={() => handleWorkoutTypeChange('legs')}>
          Legs
        </PillButton>
      </div>
      
      {/* Row 2: Compare Mode */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <PillButton active={compareMode === 'none'} onClick={() => onCompareModeChange('none')}>
          Trend Only
        </PillButton>
        <PillButton active={compareMode === 'last-vs-average'} onClick={() => onCompareModeChange('last-vs-average')}>
          vs 5-Session Avg
        </PillButton>
        <PillButton active={compareMode === 'week-over-week'} onClick={() => onCompareModeChange('week-over-week')}>
          Week vs Week
        </PillButton>
      </div>
    </div>
  )
}

export default AnalyticsFilters

