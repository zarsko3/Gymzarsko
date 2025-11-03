import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronLeft, Clock, Calendar, TrendingUp, Trash2, CheckCircle, FileText, MessageSquare } from 'lucide-react'
import { getWorkouts, deleteWorkout } from '../services/workoutService'
import { formatDuration, calculateVolume } from '../utils/formatters'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

function WorkoutDetailPage() {
  const navigate = useNavigate()
  const { workoutId } = useParams<{ workoutId: string }>()
  
  const workout = getWorkouts().find(w => w.id === workoutId)

  if (!workout) {
    return (
      <div className="min-h-full flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <Calendar size={40} className="text-red-500" strokeWidth={2} />
          </div>

          {/* Text Content */}
          <h3 className="text-2xl font-bold text-text-primary mb-3">
            Workout Not Found
          </h3>
          <p className="text-text-secondary mb-8 text-base leading-relaxed">
            This workout may have been deleted or doesn't exist
          </p>

          {/* CTA Button */}
          <Button 
            onClick={() => navigate('/history')}
            className="min-w-[200px] mx-auto"
            size="lg"
          >
            Back to History
          </Button>
        </div>
      </div>
    )
  }

  const workoutTypeNames = {
    push: 'Push Day',
    pull: 'Pull Day',
    legs: 'Legs Day',
  }

  const workoutTypeColors = {
    push: 'bg-blue-50 text-blue-600 border-blue-200',
    pull: 'bg-green-50 text-green-600 border-green-200',
    legs: 'bg-purple-50 text-purple-600 border-purple-200',
  }

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const completedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
    0
  )
  const totalVolume = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + calculateVolume(set.weight, set.reps), 0),
    0
  )
  const duration = workout.startTime && workout.endTime
    ? formatDuration(workout.startTime, workout.endTime)
    : 'N/A'

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this workout? This cannot be undone.')) {
      deleteWorkout(workout.id)
      navigate('/history')
    }
  }

  return (
    <div className="min-h-full bg-accent-card">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate('/history')}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-text-primary">Workout Details</h1>
          <button 
            onClick={handleDelete}
            className="text-red-500 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Workout Type Badge */}
        <div className="flex items-center justify-center gap-3">
          <div className={`px-6 py-3 rounded-full border-2 ${workoutTypeColors[workout.type]} font-semibold text-lg`}>
            {workoutTypeNames[workout.type]}
          </div>
          {workout.completed && (
            <CheckCircle size={24} className="text-primary-500" />
          )}
        </div>

        {/* Date & Time Info */}
        <Card className="bg-white">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-primary-500" />
              <div>
                <div className="text-sm text-text-secondary">Date</div>
                <div className="font-semibold text-text-primary">
                  {format(workout.date, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-primary-500" />
              <div>
                <div className="text-sm text-text-secondary">Duration</div>
                <div className="font-semibold text-text-primary">{duration}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white text-center p-4">
            <div className="text-2xl font-bold text-primary-500">{workout.exercises.length}</div>
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

        {/* Exercises */}
        <div className="space-y-3">
          <h3 className="font-semibold text-text-primary">Exercises</h3>
          {workout.exercises.map((exercise, index) => {
            const exerciseVolume = exercise.sets.reduce(
              (sum, set) => sum + calculateVolume(set.weight, set.reps),
              0
            )
            const completedCount = exercise.sets.filter(s => s.completed).length

            return (
              <Card key={exercise.id} className="bg-white">
                <div className="space-y-3">
                  {/* Exercise Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary font-medium">#{index + 1}</span>
                        <h4 className="font-semibold text-text-primary">{exercise.exercise.name}</h4>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        {exercise.exercise.muscleGroup}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary-500">
                        {Math.round(exerciseVolume)} kg
                      </div>
                      <div className="text-xs text-text-secondary">
                        {completedCount}/{exercise.sets.length} sets
                      </div>
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary pb-1 border-b">
                      <div className="w-8 text-center">SET</div>
                      <div className="flex-1 text-center">WEIGHT</div>
                      <div className="flex-1 text-center">REPS</div>
                      <div className="w-12 text-center">VOLUME</div>
                    </div>

                    {exercise.sets.map((set, setIndex) => (
                      <div 
                        key={set.id}
                        className={`flex items-center gap-2 py-1 ${
                          set.completed ? 'bg-primary-50 rounded-lg px-1' : ''
                        }`}
                      >
                        <div className="w-8 text-center text-sm font-medium text-text-primary">
                          {setIndex + 1}
                        </div>
                        <div className="flex-1 text-center font-semibold text-text-primary">
                          {set.weight} kg
                        </div>
                        <div className="flex-1 text-center font-semibold text-text-primary">
                          {set.reps}
                        </div>
                        <div className="w-12 text-center text-sm text-text-secondary">
                          {calculateVolume(set.weight, set.reps)}
                        </div>
                      </div>
                    ))}

                    {/* Exercise Total */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <div className="w-8"></div>
                      <div className="flex-1 text-sm font-medium text-text-secondary">
                        Total:
                      </div>
                      <div className="w-12 text-center font-bold text-primary-500">
                        {Math.round(exerciseVolume)}
                      </div>
                    </div>
                  </div>

                  {/* Exercise Notes */}
                  {exercise.notes && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-text-secondary mb-1">Notes:</div>
                          <div className="text-text-primary whitespace-pre-wrap">
                            {exercise.notes}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Workout Notes */}
        {workout.notes && (
          <Card className="bg-accent-mint">
            <div className="flex items-start gap-3">
              <FileText size={20} className="text-primary-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary mb-2">Workout Notes</h4>
                <p className="text-text-primary whitespace-pre-wrap">
                  {workout.notes}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            fullWidth
            variant="secondary"
            onClick={() => navigate('/history')}
          >
            Back to History
          </Button>
          <Button
            fullWidth
            variant="ghost"
            onClick={handleDelete}
            className="text-red-500 hover:bg-red-50"
          >
            <Trash2 size={20} />
            Delete Workout
          </Button>
        </div>
      </div>
    </div>
  )
}

export default WorkoutDetailPage

