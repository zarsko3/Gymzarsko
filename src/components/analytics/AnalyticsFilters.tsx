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
  const handleWorkoutTypeChange = (type: 'all' | WorkoutType) => {
    onFiltersChange({
      ...filters,
      workoutType: type,
    })
  }
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 items-center">
      {/* Workout Type */}
      <PillButton active={filters.workoutType === 'push'} onClick={() => handleWorkoutTypeChange('push')}>
        Push
      </PillButton>
      <PillButton active={filters.workoutType === 'pull'} onClick={() => handleWorkoutTypeChange('pull')}>
        Pull
      </PillButton>
      <PillButton active={filters.workoutType === 'legs'} onClick={() => handleWorkoutTypeChange('legs')}>
        Legs
      </PillButton>
      <PillButton active={filters.workoutType === 'all'} onClick={() => handleWorkoutTypeChange('all')}>
        All
      </PillButton>
      
      {/* Dot separator */}
      <span className="text-[var(--text-dim)] mx-1">•</span>
      
      {/* Compare Mode */}
      <PillButton active={compareMode === 'none'} onClick={() => onCompareModeChange('none')}>
        Trend
      </PillButton>
      <PillButton active={compareMode === 'last-vs-average'} onClick={() => onCompareModeChange('last-vs-average')}>
        Avg
      </PillButton>
      <PillButton active={compareMode === 'week-over-week'} onClick={() => onCompareModeChange('week-over-week')}>
        Week
      </PillButton>
    </div>
  )
}

export default AnalyticsFilters

