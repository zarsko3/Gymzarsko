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
  const handleSelect = (type: WorkoutType, e: React.MouseEvent) => {
    // Stop event propagation to prevent bubbling to modal backdrop
    e.stopPropagation()
    
    // Close the modal FIRST
    onClose()
    
    // Small delay to ensure modal closes before navigation
    // This prevents the second modal from appearing
    setTimeout(() => {
      onSelectWorkout(type)
    }, 100)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Workout Type">
      <div className="space-y-4">
        <p className="text-text-secondary text-center text-sm mb-2">
          Choose your workout for today
        </p>
        <div className="space-y-3">
          {workoutTypes.map((workout) => (
            <button
              key={workout.id}
              onClick={(e) => handleSelect(workout.id, e)}
              className={`w-full ${workout.color} border-2 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] rounded-xl text-left`}
              type="button"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                  <workout.Icon size={24} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary text-lg">
                    {workout.name}
                  </h3>
                  <p className="text-text-secondary text-sm mt-0.5">
                    {workout.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default WorkoutTypeModal

