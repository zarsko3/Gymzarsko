import { Flame } from 'lucide-react'
import type { WeeklyProgress } from '../../services/workoutAnalyticsService'

interface WeeklySummaryProps {
  progress: WeeklyProgress
}

const RING_RADIUS = 20
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function describeStreak({ completed, goal, streakWeeks }: WeeklyProgress) {
  const remaining = Math.max(0, goal - completed)
  if (remaining === 0) return 'Goal hit this week'
  const workouts = remaining === 1 ? 'workout' : 'workouts'
  return streakWeeks > 0 ? `${remaining} more ${workouts} to keep it` : `${remaining} more to start one`
}

function WeeklySummary({ progress }: WeeklySummaryProps) {
  const { completed, goal, streakWeeks } = progress
  const fraction = goal > 0 ? Math.min(1, completed / goal) : 0

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-card p-4 flex items-center gap-3">
        <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0" aria-hidden="true">
          <circle cx="26" cy="26" r={RING_RADIUS} fill="none" strokeWidth="6" className="stroke-primary-100" />
          <circle
            cx="26"
            cy="26"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-primary-500"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
            transform="rotate(-90 26 26)"
          />
        </svg>
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums leading-none">
            {completed}
            <span className="text-sm font-medium text-[var(--text-secondary)]">/{goal}</span>
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">this week</p>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4">
        <div className="flex items-center gap-1.5">
          <Flame size={18} className={streakWeeks > 0 ? 'text-amber-500' : 'text-[var(--text-inactive)]'} />
          <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums leading-none">
            {streakWeeks}
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {streakWeeks === 1 ? ' week' : ' weeks'}
            </span>
          </p>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">streak</p>
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1">{describeStreak(progress)}</p>
      </div>
    </div>
  )
}

export default WeeklySummary
