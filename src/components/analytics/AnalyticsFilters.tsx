import { motion } from 'framer-motion'
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
  
  // Check if any primary filter is active
  const hasActivePrimary = filters.workoutType !== 'all'
  
  return (
    <div className="relative">
      {/* Subtle background container with glassy effect */}
      <div 
        className="absolute inset-0 rounded-2xl -mx-2 -my-1"
        style={{
          background: hasActivePrimary 
            ? 'linear-gradient(135deg, rgba(255, 181, 92, 0.08) 0%, rgba(255, 181, 92, 0.02) 100%)'
            : 'transparent',
          backdropFilter: hasActivePrimary ? 'blur(8px)' : 'none',
          border: hasActivePrimary ? '1px solid rgba(255, 181, 92, 0.12)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
      
      {/* Content */}
      <div className="relative flex flex-col gap-3 py-2">
        {/* First Row: Workout Type (Primary - larger, bolder) */}
        <div className="flex justify-center gap-2.5 w-full">
          <PillButton 
            active={filters.workoutType === 'push'} 
            onClick={() => handleWorkoutTypeChange('push')}
            className="px-4 py-2.5 text-sm font-semibold"
          >
            Push
          </PillButton>
          <PillButton 
            active={filters.workoutType === 'pull'} 
            onClick={() => handleWorkoutTypeChange('pull')}
            className="px-4 py-2.5 text-sm font-semibold"
          >
            Pull
          </PillButton>
          <PillButton 
            active={filters.workoutType === 'legs'} 
            onClick={() => handleWorkoutTypeChange('legs')}
            className="px-4 py-2.5 text-sm font-semibold"
          >
            Legs
          </PillButton>
          <PillButton 
            active={filters.workoutType === 'all'} 
            onClick={() => handleWorkoutTypeChange('all')}
            className="px-4 py-2.5 text-sm font-semibold"
          >
            All
          </PillButton>
        </div>
        
        {/* Subtle divider */}
        <div 
          className="h-px mx-auto w-24"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
          }}
        />
        
        {/* Second Row: Week, Trend, Avg (Secondary - smaller, lighter) */}
        <div className="flex justify-center gap-2 w-full">
          <PillButton 
            active={compareMode === 'week-over-week'} 
            onClick={() => onCompareModeChange('week-over-week')}
            className="px-3 py-1.5 text-xs font-medium"
          >
            Week
          </PillButton>
          <PillButton 
            active={compareMode === 'none'} 
            onClick={() => onCompareModeChange('none')}
            className="px-3 py-1.5 text-xs font-medium"
          >
            Trend
          </PillButton>
          <PillButton 
            active={compareMode === 'last-vs-average'} 
            onClick={() => onCompareModeChange('last-vs-average')}
            className="px-3 py-1.5 text-xs font-medium"
          >
            Avg
          </PillButton>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsFilters

