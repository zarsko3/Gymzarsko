import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { WorkoutType } from '../../types'
import { WORKOUT_TYPE_INFO } from '../../constants/workoutTypes'
import { describeLastDone, type WorkoutTypeStats } from '../../utils/workoutTypeStats'

interface NextWorkoutCardProps {
  type: WorkoutType
  stats: WorkoutTypeStats
}

/** The next day in the rotation, with what to expect and a one-tap start */
function NextWorkoutCard({ type, stats }: NextWorkoutCardProps) {
  const navigate = useNavigate()
  const info = WORKOUT_TYPE_INFO[type]
  const muscles = info.description.split(', ')
  const lastDone = describeLastDone(stats.lastDone)

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-primary-100 to-card border border-[var(--border-primary)] shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-500">Next up</p>
      <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{info.name}</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {stats.exerciseCount} exercises · ~{stats.estimatedMinutes} min ·{' '}
        {stats.lastDone ? `last one ${lastDone}` : 'first time'}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {muscles.map((muscle) => (
          <span
            key={muscle}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-card text-[var(--text-secondary)] border border-[var(--border-primary)]"
          >
            {muscle}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate(`/workout/active?type=${type}`)}
        className="mt-4 w-full min-h-[48px] rounded-xl bg-primary-500 text-on-primary font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80 transition-opacity"
      >
        <Play size={18} fill="currentColor" />
        Start workout
      </button>
    </div>
  )
}

export default NextWorkoutCard
