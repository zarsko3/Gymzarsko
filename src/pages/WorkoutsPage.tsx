import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical, Dumbbell, Flame, Activity } from 'lucide-react'
import type { WorkoutType } from '../types'
import Card from '../components/ui/Card'

const workoutTypes = [
  {
    id: 'push' as WorkoutType,
    name: 'Push Day',
    description: 'Chest, Shoulders, Triceps',
    color: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
    Icon: Dumbbell,
  },
  {
    id: 'pull' as WorkoutType,
    name: 'Pull Day',
    description: 'Back, Biceps, Rear Delts',
    color: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700',
    Icon: Flame,
  },
  {
    id: 'legs' as WorkoutType,
    name: 'Legs Day',
    description: 'Quads, Hamstrings, Calves',
    color: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700',
    Icon: Activity,
  },
]

function WorkoutsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-primary-600">Workouts</h1>
          <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Select Workout Type</h2>
          <p className="text-[var(--text-secondary)] mt-1">Choose your workout for today</p>
        </div>

        {/* Workout Type Cards */}
        <div className="space-y-3">
          {workoutTypes.map((workout) => (
            <Card
              key={workout.id}
              onClick={() => navigate(`/workout/active?type=${workout.id}`)}
              className={`${workout.color} border-2 hover:shadow-md transition-all cursor-pointer`}
            >
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <workout.Icon size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-lg">
                      {workout.name}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                      {workout.description}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WorkoutsPage
