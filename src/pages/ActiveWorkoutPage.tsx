import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Clock, Plus, Trash2, Check, Timer, MessageSquare, FileText } from 'lucide-react'
import type { WorkoutType, WorkoutExercise, WorkoutSet } from '../types'
import { startWorkout, updateCurrentWorkout, completeWorkout } from '../services/workoutService'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import RestTimer from '../components/workout/RestTimer'

function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workoutType = searchParams.get('type') as WorkoutType
  
  const [workout, setWorkout] = useState(() => {
    if (workoutType) {
      return startWorkout(workoutType)
    }
    return null
  })
  
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [showWorkoutNotes, setShowWorkoutNotes] = useState(false)

  // Timer effect
  useEffect(() => {
    if (!workout) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - workout.startTime!.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [workout])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSetChange = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    if (!workout) return

    const newWorkout = { ...workout }
    const numValue = parseFloat(value) || 0
    newWorkout.exercises[exerciseIndex].sets[setIndex][field] = numValue
    
    setWorkout(newWorkout)
    updateCurrentWorkout(newWorkout)
  }

  const handleToggleSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return

    const newWorkout = { ...workout }
    const set = newWorkout.exercises[exerciseIndex].sets[setIndex]
    const wasCompleted = set.completed
    set.completed = !set.completed
    
    setWorkout(newWorkout)
    updateCurrentWorkout(newWorkout)

    // Show rest timer when completing a set
    if (!wasCompleted && set.completed) {
      setShowRestTimer(true)
    }
  }

  const handleAddSet = (exerciseIndex: number) => {
    if (!workout) return

    const newWorkout = { ...workout }
    const lastSet = newWorkout.exercises[exerciseIndex].sets[newWorkout.exercises[exerciseIndex].sets.length - 1]
    
    newWorkout.exercises[exerciseIndex].sets.push({
      id: `set-${Date.now()}`,
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      completed: false,
    })
    
    setWorkout(newWorkout)
    updateCurrentWorkout(newWorkout)
  }

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return

    const newWorkout = { ...workout }
    newWorkout.exercises[exerciseIndex].sets.splice(setIndex, 1)
    
    setWorkout(newWorkout)
    updateCurrentWorkout(newWorkout)
  }

  const handleExerciseNoteChange = (exerciseIndex: number, notes: string) => {
    if (!workout) return

    const newWorkout = { ...workout }
    newWorkout.exercises[exerciseIndex].notes = notes
    
    setWorkout(newWorkout)
    updateCurrentWorkout(newWorkout)
  }

  const handleWorkoutNoteChange = (notes: string) => {
    if (!workout) return

    const newWorkout = { ...workout }
    newWorkout.notes = notes
    
    setWorkout(newWorkout)
    updateCurrentWorkout(newWorkout)
  }

  const toggleExerciseNotes = (exerciseIndex: number) => {
    const newExpanded = new Set(expandedNotes)
    if (newExpanded.has(exerciseIndex)) {
      newExpanded.delete(exerciseIndex)
    } else {
      newExpanded.add(exerciseIndex)
    }
    setExpandedNotes(newExpanded)
  }

  const handleBack = () => {
    if (!workout) {
      navigate('/')
      return
    }

    // Check if any sets have been completed
    const hasProgress = workout.exercises.some(ex => 
      ex.sets.some(set => set.completed || set.weight > 0 || set.reps > 0)
    )

    if (hasProgress) {
      const confirmed = window.confirm(
        "Are you sure you want to exit? Your workout progress will be lost."
      )
      if (confirmed) {
        navigate('/')
      }
    } else {
      navigate('/')
    }
  }

  const handleCompleteWorkout = () => {
    if (!workout) return
    
    completeWorkout(workout)
    navigate('/workout/summary')
  }

  if (!workout) {
    navigate('/')
    return null
  }

  const workoutTypeNames = {
    push: 'Push Day',
    pull: 'Pull Day',
    legs: 'Legs Day',
  }

  return (
    <div className="min-h-screen pb-20 bg-accent-card">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Exit</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">{workoutTypeNames[workoutType]}</h1>
            <div className="flex items-center gap-1 text-primary-500 text-sm font-medium">
              <Clock size={14} />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>
          <button 
            onClick={handleCompleteWorkout}
            className="text-primary-500 hover:text-primary-600 min-h-[44px] min-w-[44px] flex items-center justify-center font-semibold"
          >
            Finish
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Rest Timer Button */}
        <Button
          fullWidth
          variant="secondary"
          onClick={() => setShowRestTimer(true)}
        >
          <Timer size={20} />
          Start Rest Timer
        </Button>

        {/* Exercises */}
        {workout.exercises.map((exercise, exerciseIndex) => (
          <Card key={exercise.id} className="bg-white">
            <div className="space-y-4">
              {/* Exercise Header */}
              <div>
                <h3 className="font-semibold text-text-primary text-lg">
                  {exercise.exercise.name}
                </h3>
                <p className="text-text-secondary text-sm">
                  {exercise.exercise.muscleGroup}
                </p>
              </div>

              {/* Sets Table */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-text-secondary pb-2 border-b">
                  <div className="w-8 text-center">SET</div>
                  <div className="flex-1 text-center">WEIGHT</div>
                  <div className="flex-1 text-center">REPS</div>
                  <div className="w-20"></div>
                </div>

                {exercise.sets.map((set, setIndex) => (
                  <div 
                    key={set.id}
                    className={`flex items-center gap-2 ${
                      set.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="w-8 text-center text-text-primary font-medium text-sm">
                      {setIndex + 1}
                    </div>
                    
                    <input
                      type="number"
                      inputMode="decimal"
                      value={set.weight || ''}
                      onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)}
                      className="flex-1 px-2 py-2.5 border border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0"
                      placeholder="0"
                      disabled={set.completed}
                    />
                    
                    <input
                      type="number"
                      inputMode="numeric"
                      value={set.reps || ''}
                      onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)}
                      className="flex-1 px-2 py-2.5 border border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0"
                      placeholder="0"
                      disabled={set.completed}
                    />
                    
                    <div className="flex gap-1 w-20">
                      <button
                        onClick={() => handleToggleSet(exerciseIndex, setIndex)}
                        className={`flex-1 min-w-[36px] h-9 flex items-center justify-center rounded-lg transition-colors ${
                          set.completed
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                        }`}
                      >
                        <Check size={16} />
                      </button>
                      
                      {exercise.sets.length > 1 && (
                        <button
                          onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                          className="min-w-[36px] h-9 flex items-center justify-center rounded-lg bg-gray-100 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Set Button */}
                <button
                  onClick={() => handleAddSet(exerciseIndex)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-text-secondary hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus size={20} />
                  Add Set
                </button>
              </div>

              {/* Exercise Notes */}
              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={() => toggleExerciseNotes(exerciseIndex)}
                  className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
                >
                  <MessageSquare size={16} />
                  <span>{exercise.notes ? 'Edit Notes' : 'Add Notes'}</span>
                  {exercise.notes && (
                    <span className="ml-auto text-primary-500">✓</span>
                  )}
                </button>
                {expandedNotes.has(exerciseIndex) && (
                  <textarea
                    value={exercise.notes || ''}
                    onChange={(e) => handleExerciseNoteChange(exerciseIndex, e.target.value)}
                    placeholder="Add notes for this exercise..."
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[80px] resize-y"
                  />
                )}
              </div>
            </div>
          </Card>
        ))}

        {/* Workout Notes */}
        <Card className="bg-white">
          <div className="space-y-3">
            <button
              onClick={() => setShowWorkoutNotes(!showWorkoutNotes)}
              className="flex items-center gap-2 text-text-primary hover:text-primary-500 transition-colors font-medium w-full"
            >
              <FileText size={20} />
              <span>Workout Notes</span>
              {workout.notes && (
                <span className="ml-auto text-primary-500">✓</span>
              )}
            </button>
            {showWorkoutNotes && (
              <textarea
                value={workout.notes || ''}
                onChange={(e) => handleWorkoutNoteChange(e.target.value)}
                placeholder="Add overall notes for this workout..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[100px] resize-y"
              />
            )}
          </div>
        </Card>

        {/* Complete Button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleCompleteWorkout}
          className="mt-6"
        >
          Complete Workout
        </Button>
      </div>

      {/* Rest Timer Modal */}
      <RestTimer
        isOpen={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        defaultDuration={90}
      />
    </div>
  )
}

export default ActiveWorkoutPage

