import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { CheckCircle, Clock, TrendingUp, Home, Dumbbell } from 'lucide-react'
import { getWorkouts } from '../services/workoutService'
import { formatDuration, calculateVolume } from '../utils/formatters'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

function WorkoutSummaryPage() {
  const navigate = useNavigate()
  const workouts = getWorkouts()
  const lastWorkout = workouts[workouts.length - 1]

  if (!lastWorkout) {
    navigate('/')
    return null
  }

  const totalSets = lastWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const completedSets = lastWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
    0
  )
  const totalVolume = lastWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + calculateVolume(set.weight, set.reps), 0),
    0
  )
  const duration = lastWorkout.startTime && lastWorkout.endTime
    ? formatDuration(lastWorkout.startTime, lastWorkout.endTime)
    : '0m'

  const workoutTypeNames = {
    push: 'Push Day',
    pull: 'Pull Day',
    legs: 'Legs Day',
  }

  return (
    <div className="min-h-screen pb-20 bg-accent-card">
      <div className="px-4 py-8 space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-full mb-4">
            <CheckCircle size={48} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Workout Complete!</h1>
          <p className="text-text-secondary mt-2">Great job on finishing your workout</p>
        </div>

        {/* Motivational Card */}
        <Card className="bg-accent-mint text-center p-6 border-2 border-transparent">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-3">
            <Dumbbell size={32} className="text-primary-600" strokeWidth={2} />
          </div>
          <p className="text-text-primary font-medium text-lg">
            You're one step closer to your goals!
          </p>
        </Card>

        {/* Workout Stats */}
        <div className="space-y-3">
          <h3 className="font-semibold text-text-primary">Workout Summary</h3>
          
          <Card className="bg-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Workout Type</span>
                <span className="font-semibold text-text-primary">
                  {workoutTypeNames[lastWorkout.type]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Date</span>
                <span className="font-semibold text-text-primary">
                  {format(lastWorkout.date, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-2">
                  <Clock size={16} />
                  Duration
                </span>
                <span className="font-semibold text-text-primary">{duration}</span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-white text-center p-4">
              <div className="text-2xl font-bold text-primary-500">{lastWorkout.exercises.length}</div>
              <div className="text-text-secondary text-xs mt-1">Exercises</div>
            </Card>
            <Card className="bg-white text-center p-4">
              <div className="text-2xl font-bold text-primary-500">{completedSets}/{totalSets}</div>
              <div className="text-text-secondary text-xs mt-1">Sets</div>
            </Card>
            <Card className="bg-white text-center p-4">
              <div className="text-2xl font-bold text-primary-500">{Math.round(totalVolume)}</div>
              <div className="text-text-secondary text-xs mt-1">Volume (kg)</div>
            </Card>
          </div>
        </div>

        {/* Exercise Breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold text-text-primary">Exercise Breakdown</h3>
          {lastWorkout.exercises.map((exercise) => {
            const completedSets = exercise.sets.filter(s => s.completed).length
            const exerciseVolume = exercise.sets.reduce(
              (sum, set) => sum + calculateVolume(set.weight, set.reps),
              0
            )

            return (
              <Card key={exercise.id} className="bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary">{exercise.exercise.name}</h4>
                    <p className="text-text-secondary text-sm">
                      {completedSets} sets • {Math.round(exerciseVolume)} kg
                    </p>
                  </div>
                  <TrendingUp size={20} className="text-primary-500" />
                </div>
              </Card>
            )
          })}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            fullWidth
            size="lg"
            onClick={() => navigate('/')}
          >
            <Home size={20} />
            Back to Home
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={() => navigate('/workouts')}
          >
            Start Another Workout
          </Button>
        </div>
      </div>
    </div>
  )
}

export default WorkoutSummaryPage

