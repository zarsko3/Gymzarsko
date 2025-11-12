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
    <div className="flex flex-wrap gap-2 justify-center items-center pb-1">
      {/* First Row: Workout Type */}
      <div className="flex justify-center gap-2 w-full">
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
      </div>
      
      {/* Second Row: Week, Trend, Avg */}
      <div className="flex justify-center gap-2 w-full mt-1">
        <PillButton active={compareMode === 'week-over-week'} onClick={() => onCompareModeChange('week-over-week')}>
          Week
        </PillButton>
        <PillButton active={compareMode === 'none'} onClick={() => onCompareModeChange('none')}>
          Trend
        </PillButton>
        <PillButton active={compareMode === 'last-vs-average'} onClick={() => onCompareModeChange('last-vs-average')}>
          Avg
        </PillButton>
      </div>
    </div>
  )
}

export default AnalyticsFilters

