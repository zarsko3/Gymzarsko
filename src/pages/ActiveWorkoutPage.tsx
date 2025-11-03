import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Clock, Plus, Trash2, Check, Timer, MessageSquare, FileText, Edit2, X } from 'lucide-react'
import type { WorkoutType, WorkoutExercise, WorkoutSet, Exercise } from '../types'
import { startWorkout, updateCurrentWorkout, completeWorkout, getCurrentWorkout } from '../services/workoutServiceFacade'
import { updateExerciseName } from '../services/firestoreExerciseService'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import RestTimer from '../components/workout/RestTimer'

function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workoutType = searchParams.get('type') as WorkoutType
  
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(true)
  
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [showWorkoutNotes, setShowWorkoutNotes] = useState(false)
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)
  const [editingExerciseNameIndex, setEditingExerciseNameIndex] = useState<number | null>(null)
  const [editingExerciseNameValue, setEditingExerciseNameValue] = useState('')
  const [exerciseNameError, setExerciseNameError] = useState('')
  const [showAddExercise, setShowAddExercise] = useState(false)
  
  // Form state for editing/adding exercises
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    muscleGroup: '',
    sets: 3,
    targetWeight: 0,
    targetReps: 10,
  })

  // Load workout based on URL type parameter
  useEffect(() => {
    async function loadWorkout() {
      setIsLoadingWorkout(true)
      
      if (workoutType) {
        // Check if there's a current workout that matches the requested type
        const currentWorkout = await getCurrentWorkout()
        if (currentWorkout && currentWorkout.type === workoutType) {
          setWorkout(currentWorkout)
          setIsLoadingWorkout(false)
          return
        }
        // Otherwise, start a new workout with the requested type
        const newWorkout = await startWorkout(workoutType)
        setWorkout(newWorkout)
        setIsLoadingWorkout(false)
        return
      }
      
      // If no type in URL, check for existing workout
      const currentWorkout = await getCurrentWorkout()
      if (currentWorkout) {
        setWorkout(currentWorkout)
      } else {
        // No workout and no type specified - navigate away
        navigate('/')
      }
      setIsLoadingWorkout(false)
    }
    
    loadWorkout()
  }, [workoutType, navigate])

  // Handle workout type changes in URL - if type changes, start new workout
  useEffect(() => {
    async function handleTypeChange() {
      if (workoutType && workout) {
        // If URL type doesn't match current workout type, start new workout
        if (workout.type !== workoutType) {
          const newWorkout = await startWorkout(workoutType)
          setWorkout(newWorkout)
        }
      }
    }
    
    handleTypeChange()
  }, [workoutType])

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

  const handleEditExercise = (exerciseIndex: number) => {
    if (!workout) return
    
    const exercise = workout.exercises[exerciseIndex]
    setExerciseForm({
      name: exercise.exercise.name,
      muscleGroup: exercise.exercise.muscleGroup,
      sets: exercise.sets.length,
      targetWeight: exercise.sets[0]?.weight || 0,
      targetReps: exercise.sets[0]?.reps || 10,
    })
    setEditingExerciseIndex(exerciseIndex)
  }

  const handleSaveExerciseEdit = () => {
    if (!workout || editingExerciseIndex === null) return

    const newWorkout = { ...workout }
    const exercise = newWorkout.exercises[editingExerciseIndex]
    
    // Update exercise name and muscle group
    exercise.exercise = {
      ...exercise.exercise,
      name: exerciseForm.name,
      muscleGroup: exerciseForm.muscleGroup,
    }
    
    // Adjust sets count
    const currentSetsCount = exercise.sets.length
    const targetSetsCount = Math.max(1, Math.floor(exerciseForm.sets))
    
    if (targetSetsCount > currentSetsCount) {
      // Add new sets
      const lastSet = exercise.sets[exercise.sets.length - 1]
      for (let i = currentSetsCount; i < targetSetsCount; i++) {
        exercise.sets.push({
          id: `set-${Date.now()}-${i}`,
          weight: exerciseForm.targetWeight || lastSet?.weight || 0,
          reps: exerciseForm.targetReps || lastSet?.reps || 10,
          completed: false,
        })
      }
    } else if (targetSetsCount < currentSetsCount) {
      // Remove excess sets (only if not completed)
      exercise.sets = exercise.sets.slice(0, targetSetsCount)
    }
    
    // Update weight and reps for all incomplete sets
    exercise.sets.forEach((set, index) => {
      if (!set.completed) {
        if (exerciseForm.targetWeight > 0) {
          set.weight = exerciseForm.targetWeight
        }
        if (exerciseForm.targetReps > 0) {
          set.reps = exerciseForm.targetReps
        }
      }
    })
    
    setWorkout(newWorkout)
    updateCurrentWorkout(newWorkout)
    setEditingExerciseIndex(null)
    setExerciseForm({ name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 })
  }

  const handleAddCustomExercise = () => {
    if (!workout) return

    const newExercise: Exercise = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: exerciseForm.name,
      muscleGroup: exerciseForm.muscleGroup,
      category: workout.type,
    }

    const newWorkoutExercise: WorkoutExercise = {
      id: `we-${newExercise.id}-${Date.now()}`,
      exerciseId: newExercise.id,
      exercise: newExercise,
      sets: Array.from({ length: Math.max(1, Math.floor(exerciseForm.sets)) }, (_, i) => ({
        id: `set-${Date.now()}-${i}`,
        weight: exerciseForm.targetWeight || 0,
        reps: exerciseForm.targetReps || 10,
        completed: false,
      })),
    }

    const newWorkout = {
      ...workout,
      exercises: [...workout.exercises, newWorkoutExercise],
    }

    setWorkout(newWorkout)
    updateCurrentWorkout(newWorkout)
    setShowAddExercise(false)
    setExerciseForm({ name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 })
  }

  const handleRemoveExercise = (exerciseIndex: number) => {
    if (!workout) return
    
    if (window.confirm('Are you sure you want to remove this exercise?')) {
      const newWorkout = { ...workout }
      newWorkout.exercises.splice(exerciseIndex, 1)
      setWorkout(newWorkout)
      updateCurrentWorkout(newWorkout)
    }
  }

  const handleStartEditingExerciseName = (exerciseIndex: number) => {
    if (!workout) return
    const exercise = workout.exercises[exerciseIndex]
    setEditingExerciseNameIndex(exerciseIndex)
    setEditingExerciseNameValue(exercise.exercise.name)
    setExerciseNameError('')
  }

  const handleCancelEditingExerciseName = () => {
    setEditingExerciseNameIndex(null)
    setEditingExerciseNameValue('')
    setExerciseNameError('')
  }

  const validateExerciseName = (name: string): boolean => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setExerciseNameError('Name must be at least 2 characters')
      return false
    }
    if (trimmed.length > 60) {
      setExerciseNameError('Name must be less than 60 characters')
      return false
    }
    setExerciseNameError('')
    return true
  }

  const handleSaveExerciseName = async (exerciseIndex: number) => {
    if (!workout) return
    
    const trimmedValue = editingExerciseNameValue.trim()
    
    if (!validateExerciseName(trimmedValue)) {
      return
    }

    const exercise = workout.exercises[exerciseIndex]
    const oldName = exercise.exercise.name

    // Optimistic update
    const newWorkout = { ...workout }
    newWorkout.exercises[exerciseIndex] = {
      ...exercise,
      exercise: {
        ...exercise.exercise,
        name: trimmedValue,
      },
    }
    setWorkout(newWorkout)
    updateCurrentWorkout(newWorkout)
    setEditingExerciseNameIndex(null)
    setEditingExerciseNameValue('')

    // Persist to Firestore
    try {
      if (workout.id && exercise.id) {
        await updateExerciseName(workout.id, exercise.id, trimmedValue)
      }
    } catch (error) {
      console.error('Error updating exercise name:', error)
      // Revert optimistic update
      const revertedWorkout = { ...workout }
      revertedWorkout.exercises[exerciseIndex] = {
        ...exercise,
        exercise: {
          ...exercise.exercise,
          name: oldName,
        },
      }
      setWorkout(revertedWorkout)
      updateCurrentWorkout(revertedWorkout)
      // Show error toast (you can add a toast library here)
      alert('Failed to save exercise name. Please try again.')
    }
  }

  const handleExerciseNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, exerciseIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveExerciseName(exerciseIndex)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEditingExerciseName()
    }
  }

  if (isLoadingWorkout || !workout) {
    return (
      <div className="min-h-screen pb-20 bg-accent-card flex items-center justify-center">
        <div className="text-center">
          <div className="text-text-secondary">Loading workout...</div>
        </div>
      </div>
    )
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
            <h1 className="text-lg font-semibold text-text-primary">{workoutTypeNames[workout.type]}</h1>
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
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            fullWidth
            variant="secondary"
            onClick={() => setShowRestTimer(true)}
          >
            <Timer size={20} />
            Start Rest Timer
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              setExerciseForm({ name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 })
              setShowAddExercise(true)
            }}
          >
            <Plus size={20} />
            Add Exercise
          </Button>
        </div>

        {/* Exercises */}
        {workout.exercises.map((exercise, exerciseIndex) => (
          <Card key={exercise.id} className="bg-white group">
            <div className="space-y-4">
              {/* Exercise Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingExerciseNameIndex === exerciseIndex ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingExerciseNameValue}
                        onChange={(e) => {
                          setEditingExerciseNameValue(e.target.value)
                          if (exerciseNameError) validateExerciseName(e.target.value)
                        }}
                        onKeyDown={(e) => handleExerciseNameKeyDown(e, exerciseIndex)}
                        onBlur={() => {
                          // Only save on blur if valid, otherwise cancel
                          if (validateExerciseName(editingExerciseNameValue)) {
                            handleSaveExerciseName(exerciseIndex)
                          } else {
                            handleCancelEditingExerciseName()
                          }
                        }}
                        className="w-full px-3 py-2 border border-primary-500 rounded-lg text-text-primary text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Exercise name"
                        maxLength={60}
                      />
                      {exerciseNameError && (
                        <p className="text-xs text-red-500">{exerciseNameError}</p>
                      )}
                      <div className="flex gap-2 text-xs text-text-secondary">
                        <span>Press Enter to save, Esc to cancel</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-text-primary text-lg">
                          {exercise.exercise.name}
                        </h3>
                        <button
                          onClick={() => handleStartEditingExerciseName(exerciseIndex)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors text-primary-500"
                          aria-label="Edit exercise name"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                      <p className="text-text-secondary text-sm">
                        {exercise.exercise.muscleGroup}
                      </p>
                    </>
                  )}
                </div>
                {editingExerciseNameIndex !== exerciseIndex && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditExercise(exerciseIndex)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-primary-500"
                      aria-label="Edit exercise"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleRemoveExercise(exerciseIndex)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                      aria-label="Remove exercise"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
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

      {/* Edit Exercise Modal */}
      <Modal
        isOpen={editingExerciseIndex !== null}
        onClose={() => {
          setEditingExerciseIndex(null)
          setExerciseForm({ name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 })
        }}
        title="Edit Exercise"
        size="md"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setEditingExerciseIndex(null)
                setExerciseForm({ name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 })
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSaveExerciseEdit}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            value={exerciseForm.name}
            onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
            placeholder="e.g., Bench Press"
          />
          <Input
            label="Muscle Group"
            value={exerciseForm.muscleGroup}
            onChange={(e) => setExerciseForm({ ...exerciseForm, muscleGroup: e.target.value })}
            placeholder="e.g., Chest"
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Sets"
              type="number"
              value={exerciseForm.sets.toString()}
              onChange={(e) => setExerciseForm({ ...exerciseForm, sets: Math.max(1, parseInt(e.target.value) || 1) })}
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={exerciseForm.targetWeight.toString()}
              onChange={(e) => setExerciseForm({ ...exerciseForm, targetWeight: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Reps"
              type="number"
              value={exerciseForm.targetReps.toString()}
              onChange={(e) => setExerciseForm({ ...exerciseForm, targetReps: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>
          <p className="text-xs text-text-secondary">
            Note: Weight and reps will be applied to incomplete sets only. Completed sets will remain unchanged.
          </p>
        </div>
      </Modal>

      {/* Add Custom Exercise Modal */}
      <Modal
        isOpen={showAddExercise}
        onClose={() => {
          setShowAddExercise(false)
          setExerciseForm({ name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 })
        }}
        title="Add Custom Exercise"
        size="md"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowAddExercise(false)
                setExerciseForm({ name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 })
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleAddCustomExercise}
              disabled={!exerciseForm.name.trim() || !exerciseForm.muscleGroup.trim()}
            >
              Add Exercise
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            value={exerciseForm.name}
            onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
            placeholder="e.g., Cable Flyes"
            required
          />
          <Input
            label="Muscle Group"
            value={exerciseForm.muscleGroup}
            onChange={(e) => setExerciseForm({ ...exerciseForm, muscleGroup: e.target.value })}
            placeholder="e.g., Chest"
            required
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Sets"
              type="number"
              value={exerciseForm.sets.toString()}
              onChange={(e) => setExerciseForm({ ...exerciseForm, sets: Math.max(1, parseInt(e.target.value) || 1) })}
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={exerciseForm.targetWeight.toString()}
              onChange={(e) => setExerciseForm({ ...exerciseForm, targetWeight: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Reps"
              type="number"
              value={exerciseForm.targetReps.toString()}
              onChange={(e) => setExerciseForm({ ...exerciseForm, targetReps: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ActiveWorkoutPage

