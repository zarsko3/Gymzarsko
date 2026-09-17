import { Flame, CalendarCheck } from 'lucide-react'
import type { WeeklyProgress } from '../../services/workoutAnalyticsService'
import Card from '../ui/Card'

interface WeeklySummaryProps {
  progress: WeeklyProgress
}

function WeeklySummary({ progress }: WeeklySummaryProps) {
  const { completed, goal, streakWeeks } = progress
  const percent = goal > 0 ? Math.min(100, (completed / goal) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-card">
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
          <CalendarCheck size={14} />
          <span>This week</span>
        </div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">
          {completed}
          <span className="text-base font-medium text-[var(--text-secondary)]"> / {goal}</span>
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div className="h-full bg-primary-500 transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
      </Card>

      <Card className="bg-card">
        <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
          <Flame size={14} />
          <span>Streak</span>
        </div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">
          {streakWeeks}
          <span className="text-base font-medium text-[var(--text-secondary)]">
            {streakWeeks === 1 ? ' week' : ' weeks'}
          </span>
        </p>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          {streakWeeks > 0 ? `${goal}+ workouts a week` : 'Hit your weekly goal to start one'}
        </p>
      </Card>
    </div>
  )
}

export default WeeklySummary
