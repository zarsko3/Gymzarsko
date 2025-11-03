import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { CheckCircle, Clock, TrendingUp, Home, Dumbbell, Plus } from 'lucide-react'
import type { Workout, WorkoutExercise, WorkoutSet } from '../types'
import { getWorkouts, getWorkoutById } from '../services/workoutServiceFacade'
import { addExerciseToWorkout } from '../services/firestoreExerciseService'
import { formatDuration, calculateVolume } from '../utils/formatters'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

function WorkoutSummaryPage() {
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: 0,
    notes: '',
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadWorkout() {
      try {
        const workouts = await getWorkouts()
        const lastWorkout = workouts[workouts.length - 1]
        
        if (lastWorkout) {
          // Get full workout details if needed
          const fullWorkout = await getWorkoutById(lastWorkout.id)
          setWorkout(fullWorkout || lastWorkout)
        }
      } catch (error) {
        console.error('Error loading workout:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadWorkout()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-full bg-accent-card flex items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    )
  }

  if (!workout) {
    navigate('/')
    return null
  }

  const totalSets = workout.exercises.reduce((sum: number, ex: WorkoutExercise) => sum + ex.sets.length, 0)
  const completedSets = workout.exercises.reduce(
    (sum: number, ex: WorkoutExercise) => sum + ex.sets.filter((s: WorkoutSet) => s.completed).length,
    0
  )
  const totalVolume = workout.exercises.reduce(
    (sum: number, ex: WorkoutExercise) => sum + ex.sets.reduce((s: number, set: WorkoutSet) => s + calculateVolume(set.weight, set.reps), 0),
    0
  )
  const duration = workout.startTime && workout.endTime
    ? formatDuration(workout.startTime, workout.endTime)
    : '0m'

  const validateForm = (): boolean => {
    if (!exerciseForm.name.trim()) {
      setFormError('Exercise name is required')
      return false
    }
    if (exerciseForm.name.trim().length < 2) {
      setFormError('Exercise name must be at least 2 characters')
      return false
    }
    if (exerciseForm.name.trim().length > 60) {
      setFormError('Exercise name must be less than 60 characters')
      return false
    }
    if (exerciseForm.sets < 1) {
      setFormError('Sets must be at least 1')
      return false
    }
    if (exerciseForm.reps < 1) {
      setFormError('Reps must be at least 1')
      return false
    }
    setFormError('')
    return true
  }

  const handleAddExercise = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const exerciseId = await addExerciseToWorkout(workout.id, {
        name: exerciseForm.name.trim(),
        sets: exerciseForm.sets,
        reps: exerciseForm.reps,
        weight: exerciseForm.weight,
        notes: exerciseForm.notes.trim(),
      })

      // Reload workout to show new exercise
      const updatedWorkout = await getWorkoutById(workout.id)
      if (updatedWorkout) {
        setWorkout(updatedWorkout)
      }

      // Reset form
      setExerciseForm({
        name: '',
        sets: 3,
        reps: 10,
        weight: 0,
        notes: '',
      })
      setShowAddExercise(false)
      setFormError('')
    } catch (error) {
      console.error('Error adding exercise:', error)
      setFormError('Failed to add exercise. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const workoutTypeNames = {
    push: 'Push Day',
    pull: 'Pull Day',
    legs: 'Legs Day',
  }

  return (
    <div className="min-h-full bg-accent-card">
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
                  {workoutTypeNames[workout.type as keyof typeof workoutTypeNames]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Date</span>
                <span className="font-semibold text-text-primary">
                  {format(workout.date, 'MMM d, yyyy')}
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
        </div>

        {/* Exercise Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Exercise Breakdown</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddExercise(true)}
            >
              <Plus size={16} />
              Add Exercise
            </Button>
          </div>
          {workout.exercises.map((exercise: WorkoutExercise) => {
            const completedSets = exercise.sets.filter((s: WorkoutSet) => s.completed).length
            const exerciseVolume = exercise.sets.reduce(
              (sum: number, set: WorkoutSet) => sum + calculateVolume(set.weight, set.reps),
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

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showAddExercise}
        onClose={() => {
          setShowAddExercise(false)
          setExerciseForm({ name: '', sets: 3, reps: 10, weight: 0, notes: '' })
          setFormError('')
        }}
        title="Add Exercise"
        size="md"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowAddExercise(false)
                setExerciseForm({ name: '', sets: 3, reps: 10, weight: 0, notes: '' })
                setFormError('')
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleAddExercise}
              disabled={isSubmitting || !exerciseForm.name.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add Exercise'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            value={exerciseForm.name}
            onChange={(e) => {
              setExerciseForm({ ...exerciseForm, name: e.target.value })
              if (formError) setFormError('')
            }}
            placeholder="e.g., Cable Flyes"
            required
            error={formError && formError.includes('name') ? formError : undefined}
          />
          
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Sets"
              type="number"
              value={exerciseForm.sets.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1
                setExerciseForm({ ...exerciseForm, sets: Math.max(1, value) })
                if (formError) setFormError('')
              }}
              min="1"
            />
            <Input
              label="Reps"
              type="number"
              value={exerciseForm.reps.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1
                setExerciseForm({ ...exerciseForm, reps: Math.max(1, value) })
                if (formError) setFormError('')
              }}
              min="1"
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={exerciseForm.weight.toString()}
              onChange={(e) => {
                setExerciseForm({ ...exerciseForm, weight: parseFloat(e.target.value) || 0 })
                if (formError) setFormError('')
              }}
              step="0.5"
              min="0"
            />
          </div>

          <Input
            label="Notes (optional)"
            value={exerciseForm.notes}
            onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
            placeholder="Add any notes about this exercise..."
          />

          {formError && !formError.includes('name') && (
            <p className="text-xs text-red-500">{formError}</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default WorkoutSummaryPage

