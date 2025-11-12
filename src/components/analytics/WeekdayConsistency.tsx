import { useMemo } from 'react'
import { format, startOfWeek, eachDayOfInterval, isSameDay, getDay } from 'date-fns'
import type { WorkoutMetrics } from '../../types'
import { deltaPill } from '../../utils/numberFormatters'

interface WeekdayConsistencyProps {
  metrics: WorkoutMetrics[]
  dateRange: { start: Date; end: Date }
  compareMode: 'last-vs-average' | 'week-over-week' | 'none'
}

function WeekdayConsistency({ metrics, dateRange, compareMode }: WeekdayConsistencyProps) {
  // Group workouts by weekday (0 = Sunday, 1 = Monday, etc.)
  const weekdayData = useMemo(() => {
    const weekdays = [0, 1, 2, 3, 4, 5, 6] // Sun to Sat
    const data = weekdays.map(day => ({
      day,
      count: 0,
      totalVolume: 0,
    }))
    
    metrics.forEach(metric => {
      const dayOfWeek = getDay(metric.date) // 0 = Sunday
      const dayData = data.find(d => d.day === dayOfWeek)
      if (dayData) {
        dayData.count += 1
        dayData.totalVolume += metric.totalVolume
      }
    })
    
    return data
  }, [metrics])
  
  // Calculate percentage for each day (based on max count)
  const maxCount = Math.max(...weekdayData.map(d => d.count), 1)
  const weekdayPercentages = weekdayData.map(d => ({
    ...d,
    percentage: d.count / maxCount,
  }))
  
  // Calculate total workouts and delta
  const totalWorkouts = metrics.length
  const delta = compareMode === 'week-over-week' ? null : null // Can be enhanced later
  const deltaInfo = delta ? deltaPill(delta) : null
  
  // Day labels (Mon-Sun)
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  // Reorder to start with Monday (index 1)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]
  
  // SVG circle calculations
  const radius = 16
  const circumference = 2 * Math.PI * radius
  
  return (
    <div className="w-full">
      {/* Row label */}
      <div className="text-xs text-[var(--text-dim)] text-center mb-3">
        {totalWorkouts} workout{totalWorkouts !== 1 ? 's' : ''}
        {deltaInfo && ` — ${deltaInfo.text}`}
      </div>
      
      {/* Weekday chips */}
      <div className="flex justify-center gap-2">
        {orderedDays.map((dayIndex, idx) => {
          const dayData = weekdayPercentages.find(d => d.day === dayIndex)
          const percentage = dayData?.percentage || 0
          const count = dayData?.count || 0
          const strokeDashoffset = circumference * (1 - percentage)
          const isToday = dayIndex === getDay(new Date())
          
          return (
            <div key={dayIndex} className="flex flex-col items-center gap-1">
              <div
                className="relative w-10 h-10 rounded-full grid place-items-center bg-[var(--surface-2)] border border-white/5"
                style={{
                  border: isToday ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,.05)',
                }}
                title={`${dayLabels[dayIndex]}: ${count} workout${count !== 1 ? 's' : ''}`}
              >
                {/* SVG ring progress */}
                <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,.08)"
                    strokeWidth="4"
                  />
                  {percentage > 0 && (
                    <circle
                      cx="18"
                      cy="18"
                      r={radius}
                      fill="none"
                      stroke="url(#gradLineWeekday)"
                      strokeWidth="4"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <span className="text-xs font-semibold text-[var(--text)] relative z-10">
                  {dayLabels[dayIndex]}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Gradient definition for SVG (shared with charts) */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="gradLineWeekday" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-strong)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity=".2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default WeekdayConsistency

