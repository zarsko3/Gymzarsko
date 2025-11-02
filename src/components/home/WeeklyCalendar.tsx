import { format, startOfWeek, addDays, isSameDay } from 'date-fns'

interface WeeklyCalendarProps {
  workoutDays?: Date[]
  currentDate?: Date
  onTodayClick?: () => void
}

function WeeklyCalendar({ workoutDays = [], currentDate = new Date(), onTodayClick }: WeeklyCalendarProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }) // Start on Sunday (U.S. calendar)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const isWorkoutDay = (date: Date) => {
    return workoutDays.some(workoutDay => isSameDay(workoutDay, date))
  }

  const isToday = (date: Date) => {
    return isSameDay(date, currentDate)
  }

  const getDayClasses = (day: Date) => {
    const today = isToday(day)
    const baseClasses = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors flex-shrink-0"
    const clickableClass = today && onTodayClick ? "cursor-pointer hover:scale-110" : ""
    
    const hasWorkout = isWorkoutDay(day)
    
    // Current day (today) - pulsing animation
    if (today) {
      return `${baseClasses} ${clickableClass} bg-gray-200 text-gray-700 ring-2 ring-primary-500 animate-pulse`
    }
    
    // Workout day (completed workout) - green ring
    if (hasWorkout) {
      return `${baseClasses} bg-primary-50 text-primary-700 ring-2 ring-primary-500`
    }
    
    // Rest day (no workout) - gray
    return `${baseClasses} bg-gray-200 text-gray-400`
  }

  const handleDayClick = (day: Date) => {
    if (isToday(day) && onTodayClick) {
      onTodayClick()
    }
  }

  return (
    <div className="w-full max-w-full space-y-3">
      <h3 className="text-lg font-semibold text-text-primary">Your Week</h3>
      <div className="flex justify-between items-center gap-1.5 py-1.5 px-0.5 overflow-visible">
        {days.map((day, index) => {
          return (
            <div key={index} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div 
                className={getDayClasses(day)}
                onClick={() => handleDayClick(day)}
              >
                {format(day, 'EEEEE')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WeeklyCalendar

