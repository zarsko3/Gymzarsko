import { Dumbbell, Flame, Activity } from 'lucide-react'
import type { WorkoutType } from '../../types'
import Modal from '../ui/Modal'
import Card from '../ui/Card'

interface WorkoutTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectWorkout: (type: WorkoutType) => void
}

const workoutTypes = [
  {
    id: 'push' as WorkoutType,
    name: 'Push Day',
    description: 'Chest, Shoulders, Triceps',
    color: 'bg-blue-50 border-blue-200',
    Icon: Dumbbell,
  },
  {
    id: 'pull' as WorkoutType,
    name: 'Pull Day',
    description: 'Back, Biceps, Rear Delts',
    color: 'bg-green-50 border-green-200',
    Icon: Flame,
  },
  {
    id: 'legs' as WorkoutType,
    name: 'Leg Day',
    description: 'Quads, Hamstrings, Calves',
    color: 'bg-purple-50 border-purple-200',
    Icon: Activity,
  },
]

function WorkoutTypeModal({ isOpen, onClose, onSelectWorkout }: WorkoutTypeModalProps) {
  const handleSelect = (type: WorkoutType) => {
    onSelectWorkout(type)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Workout Type">
      <div className="space-y-3">
        <p className="text-text-secondary text-center mb-4">
          Choose your workout for today
        </p>
        {workoutTypes.map((workout) => (
          <Card
            key={workout.id}
            onClick={() => handleSelect(workout.id)}
            className={`${workout.color} border-2 hover:shadow-md transition-all cursor-pointer`}
          >
            <div className="flex items-center gap-4 p-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                <workout.Icon size={24} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary text-lg">
                  {workout.name}
                </h3>
                <p className="text-text-secondary text-sm mt-0.5">
                  {workout.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Modal>
  )
}

export default WorkoutTypeModal

