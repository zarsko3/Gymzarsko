import { useNavigate } from 'react-router-dom'
import { formatDistanceToNowStrict } from 'date-fns'
import { PlayCircle, ChevronRight } from 'lucide-react'
import type { Workout } from '../../types'
import { getWorkoutStart } from '../../utils/workoutStatus'
import Card from '../ui/Card'

const workoutTypeNames: Record<Workout['type'], string> = {
  push: 'Push Day',
  pull: 'Pull Day',
  legs: 'Legs Day',
}

interface ResumeWorkoutCardProps {
  workout: Workout
}

function ResumeWorkoutCard({ workout }: ResumeWorkoutCardProps) {
  const navigate = useNavigate()
  const start = getWorkoutStart(workout)
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const completedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((set) => set.completed).length,
    0
  )

  return (
    <Card
      onClick={() => navigate(`/workout/active?type=${workout.type}`)}
      className="border-2 border-primary-500"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0">
          <PlayCircle size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">Workout in progress</p>
          <p className="font-semibold text-[var(--text-primary)] truncate">{workoutTypeNames[workout.type]}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {start ? `Started ${formatDistanceToNowStrict(start, { addSuffix: true })} · ` : ''}
            {completedSets}/{totalSets} sets
          </p>
        </div>
        <div className="flex items-center gap-1 text-primary-500 font-medium text-sm flex-shrink-0">
          Continue
          <ChevronRight size={18} />
        </div>
      </div>
    </Card>
  )
}

export default ResumeWorkoutCard
