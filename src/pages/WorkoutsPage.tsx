import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical, ChevronRight, Dumbbell, Flame, Activity } from 'lucide-react'
import Card from '../components/ui/Card'

const workoutTypes = [
  {
    id: 'push',
    name: 'Push Day',
    description: 'Chest, Shoulders, Triceps',
    color: 'bg-blue-50 border-blue-200',
    Icon: Dumbbell,
  },
  {
    id: 'pull',
    name: 'Pull Day',
    description: 'Back, Biceps, Rear Delts',
    color: 'bg-green-50 border-green-200',
    Icon: Flame,
  },
  {
    id: 'legs',
    name: 'Legs Day',
    description: 'Quads, Hamstrings, Calves',
    color: 'bg-purple-50 border-purple-200',
    Icon: Activity,
  },
]

function WorkoutsPage() {
  const navigate = useNavigate()

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
          <h1 className="text-lg font-semibold text-primary-600">Workouts</h1>
          <button className="text-text-secondary hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Select Workout Type</h2>
          <p className="text-text-secondary mt-1">Choose your workout for today</p>
        </div>

        {/* Workout Type Cards */}
        <div className="space-y-3">
          {workoutTypes.map((workout) => (
            <Card
              key={workout.id}
              onClick={() => navigate('/workout/start')}
              className={`${workout.color} border-2 hover:shadow-md transition-all cursor-pointer`}
            >
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <workout.Icon size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary text-lg">
                      {workout.name}
                    </h3>
                    <p className="text-text-secondary text-sm mt-0.5">
                      {workout.description}
                    </p>
                  </div>
                </div>
                <ChevronRight size={24} className="text-text-secondary" />
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-text-primary mb-4">This Week</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-500">2</div>
              <div className="text-text-secondary text-xs mt-1">Push</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-500">1</div>
              <div className="text-text-secondary text-xs mt-1">Pull</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-500">1</div>
              <div className="text-text-secondary text-xs mt-1">Legs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkoutsPage
