import { useMemo } from 'react'
import { format, startOfWeek, eachDayOfInterval, isSameDay, subDays } from 'date-fns'
import { getConsistencyHeatmapData } from '../../services/workoutAnalyticsService'
import type { WorkoutMetrics } from '../../types'

interface ConsistencyHeatmapProps {
  metrics: WorkoutMetrics[]
  dateRange: { start: Date; end: Date }
}

function ConsistencyHeatmap({ metrics, dateRange }: ConsistencyHeatmapProps) {
  const heatmapData = useMemo(() => {
    return getConsistencyHeatmapData(metrics)
  }, [metrics])
  
  // Create a map for quick lookup
  const dataMap = new Map(
    heatmapData.map(d => [d.date.toISOString().split('T')[0], d])
  )
  
  // Generate all days in the range
  const allDays = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
  
  if (allDays.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xs">
        No data
      </div>
    )
  }
  
  // Group by weeks
  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  let currentWeekStart = startOfWeek(allDays[0], { weekStartsOn: 0 })
  
  allDays.forEach(day => {
    const weekStart = startOfWeek(day, { weekStartsOn: 0 })
    if (weekStart.getTime() !== currentWeekStart.getTime()) {
      if (currentWeek.length > 0) {
        weeks.push(currentWeek)
      }
      currentWeek = []
      currentWeekStart = weekStart
    }
    currentWeek.push(day)
  })
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }
  
  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'var(--bg-secondary)'
    if (intensity < 0.25) return '#D1FAE5' // light green
    if (intensity < 0.5) return '#6EE7B7' // medium green
    if (intensity < 0.75) return '#34D399' // primary-500
    return '#10B981' // dark green
  }
  
  const getDayData = (day: Date) => {
    const dateKey = day.toISOString().split('T')[0]
    return dataMap.get(dateKey)
  }
  
  return (
    <div className="w-full h-full overflow-x-auto">
      <div className="flex flex-col gap-1 min-w-max">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-1">
            {week.map((day, dayIndex) => {
              const dayData = getDayData(day)
              const intensity = dayData?.intensity || 0
              const value = dayData?.value || 0
              const isToday = isSameDay(day, new Date())
              
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="w-8 h-8 rounded flex items-center justify-center text-xs relative group"
                  style={{
                    backgroundColor: getIntensityColor(intensity),
                    border: isToday ? '2px solid var(--primary-500)' : '1px solid var(--border-primary)',
                  }}
                  title={dayData ? `${format(day, 'MMM d')}: ${value} workout(s), ${Math.round(dayData.totalVolume)}kg` : format(day, 'MMM d')}
                >
                  {value > 0 && (
                    <span className="text-[10px] font-semibold text-[var(--text-primary)]">
                      {value}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ConsistencyHeatmap

