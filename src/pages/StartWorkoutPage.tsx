import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical, Dumbbell, Plus, Flame, Activity } from 'lucide-react'
import type { WorkoutType } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const workoutTypes = [
  { id: 'push' as WorkoutType, name: 'Push Day', description: 'Chest, Shoulders, Triceps', color: 'bg-blue-50 border-blue-200', Icon: Dumbbell },
  { id: 'pull' as WorkoutType, name: 'Pull Day', description: 'Back, Biceps, Rear Delts', color: 'bg-green-50 border-green-200', Icon: Flame },
  { id: 'legs' as WorkoutType, name: 'Leg Day', description: 'Quads, Hamstrings, Calves', color: 'bg-purple-50 border-purple-200', Icon: Activity },
]

function StartWorkoutPage() {
  const navigate = useNavigate()

  const handleStartWorkout = (type: WorkoutType) => {
    navigate(`/workout/active?type=${type}`)
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-accent-card border-b border-gray-100 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-primary-600">Start Workout</h1>
          <button className="text-text-secondary hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Start Workout</h2>
          <p className="text-text-secondary mt-1">Choose your workout type</p>
        </div>

        {/* Workout Type Cards */}
        <div className="space-y-3">
          {workoutTypes.map((workout) => (
            <Card
              key={workout.id}
              className={`${workout.color} border-2 transition-all hover:shadow-md cursor-pointer`}
              onClick={() => handleStartWorkout(workout.id)}
            >
              <div className="space-y-3 p-2">
                <div className="flex items-center gap-4">
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
                  <Plus size={24} className="text-primary-500" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StartWorkoutPage

