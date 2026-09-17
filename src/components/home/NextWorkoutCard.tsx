import { useNavigate } from 'react-router-dom'
import { ChevronRight, PlayCircle } from 'lucide-react'
import type { WorkoutType } from '../../types'
import { WORKOUT_TYPE_INFO } from '../../constants/workoutTypes'
import Card from '../ui/Card'

interface NextWorkoutCardProps {
  type: WorkoutType
}

/** Suggests the next day in the rotation and starts it in one tap */
function NextWorkoutCard({ type }: NextWorkoutCardProps) {
  const navigate = useNavigate()
  const info = WORKOUT_TYPE_INFO[type]

  return (
    <Card
      onClick={() => navigate(`/workout/active?type=${type}`)}
      className="border-2 border-primary-500"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0">
          <PlayCircle size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">Next workout</p>
          <p className="font-semibold text-[var(--text-primary)] truncate">{info.name}</p>
          <p className="text-sm text-[var(--text-secondary)] truncate">{info.description}</p>
        </div>
        <ChevronRight size={20} className="text-[var(--text-secondary)] flex-shrink-0" />
      </div>
    </Card>
  )
}

export default NextWorkoutCard
