import { useState } from 'react'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import type { FilterOptions, CompareMode, WorkoutType } from '../../types'

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
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  const handleDateRangePreset = (days: number) => {
    const end = endOfDay(new Date())
    const start = startOfDay(subDays(end, days - 1))
    onFiltersChange({
      ...filters,
      dateRange: { start, end },
    })
    setShowDatePicker(false)
  }
  
  const handleWorkoutTypeChange = (type: 'all' | WorkoutType) => {
    onFiltersChange({
      ...filters,
      workoutType: type,
    })
  }
  
  return (
    <div className="space-y-3">
      {/* Date Range Presets */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => handleDateRangePreset(7)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filters.dateRange.end.getTime() === endOfDay(new Date()).getTime() &&
            Math.ceil((filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) === 7
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => handleDateRangePreset(30)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filters.dateRange.end.getTime() === endOfDay(new Date()).getTime() &&
            Math.ceil((filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) === 30
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
          }`}
        >
          30 Days
        </button>
        <button
          onClick={() => handleDateRangePreset(90)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filters.dateRange.end.getTime() === endOfDay(new Date()).getTime() &&
            Math.ceil((filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) === 90
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
          }`}
        >
          90 Days
        </button>
      </div>
      
      {/* Workout Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => handleWorkoutTypeChange('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filters.workoutType === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
          }`}
        >
          All Types
        </button>
        <button
          onClick={() => handleWorkoutTypeChange('push')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filters.workoutType === 'push'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
          }`}
        >
          Push
        </button>
        <button
          onClick={() => handleWorkoutTypeChange('pull')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filters.workoutType === 'pull'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
          }`}
        >
          Pull
        </button>
        <button
          onClick={() => handleWorkoutTypeChange('legs')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filters.workoutType === 'legs'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
          }`}
        >
          Legs
        </button>
      </div>
      
      {/* Comparison Mode */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => onCompareModeChange('none')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            compareMode === 'none'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
          }`}
        >
          Trend Only
        </button>
        <button
          onClick={() => onCompareModeChange('last-vs-average')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            compareMode === 'last-vs-average'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
          }`}
        >
          vs 5-Session Avg
        </button>
        <button
          onClick={() => onCompareModeChange('week-over-week')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            compareMode === 'week-over-week'
              ? 'bg-primary-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
          }`}
        >
          Week vs Week
        </button>
      </div>
    </div>
  )
}

export default AnalyticsFilters

