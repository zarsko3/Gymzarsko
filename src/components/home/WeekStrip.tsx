import { addDays, format, isSameDay, startOfWeek } from 'date-fns'
import type { Workout } from '../../types'
import { WORKOUT_TYPE_INFO } from '../../constants/workoutTypes'
import { toDateSafe } from '../../utils/formatters'

interface WeekStripProps {
  workouts: Workout[]
  onTodayClick?: () => void
}

/** This week, each training day filled with the color of the workout done */
function WeekStrip({ workouts, onTodayClick }: WeekStripProps) {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const workoutOn = (day: Date) =>
    workouts.find((workout) => {
      const date = toDateSafe(workout.date)
      return workout.completed && date && isSameDay(date, day)
    })

  return (
    <div className="flex justify-between gap-1">
      {days.map((day) => {
        const workout = workoutOn(day)
        const info = workout ? WORKOUT_TYPE_INFO[workout.type] : null
        const isToday = isSameDay(day, today)
        const canStart = isToday && !workout && !!onTodayClick

        return (
          <div key={day.toISOString()} className="flex flex-col items-center gap-1 flex-1">
            <span
              className={`text-xs font-medium ${isToday ? 'text-primary-500' : 'text-[var(--text-inactive)]'}`}
            >
              {format(day, 'EEEEE')}
            </span>
            <button
              type="button"
              disabled={!canStart}
              onClick={canStart ? onTodayClick : undefined}
              aria-label={`${format(day, 'EEEE')}${info ? `: ${info.name}` : ''}`}
              className={`w-full max-w-[44px] h-11 rounded-xl flex items-center justify-center text-[10px] font-semibold ${
                info
                  ? info.tintClass
                  : isToday
                    ? 'border-2 border-dashed border-primary-400 text-primary-500'
                    : 'bg-card'
              }`}
            >
              {info?.shortName ?? (canStart ? '+' : '')}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default WeekStrip
