import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Clock, Plus, Trash2, Check, MessageSquare, FileText, Edit2, X } from 'lucide-react'
import type { Workout, WorkoutType, WorkoutExercise, WorkoutSet, Exercise } from '../types'
import { startWorkout, updateWorkout, completeWorkout, getCurrentWorkout, getWorkoutById } from '../services/workoutServiceFacade'
import { updateExerciseName, addExerciseToWorkout } from '../services/firestoreExerciseService'
import { getLatestExerciseData } from '../services/firestoreProgressService'
import { useToast } from '../hooks/useToast'
import { handleFirestoreError } from '../utils/firestoreErrorHandler'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const workoutType = searchParams.get('type') as WorkoutType
  const workoutId = searchParams.get('id') // Support opening existing workout by ID
  
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(true)
  
  const [elapsedTime, setElapsedTime] = useState(0)
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [showWorkoutNotes, setShowWorkoutNotes] = useState(false)
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)
  const [editingExerciseNameIndex, setEditingExerciseNameIndex] = useState<number | null>(null)
  const [editingExerciseNameValue, setEditingExerciseNameValue] = useState('')
  const [exerciseNameError, setExerciseNameError] = useState('')
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [prefilledSets, setPrefilledSets] = useState<Map<string, { weight: number; reps: number }>>(new Map())
  
  // Refs to prevent duplicate operations
  const isCreatingWorkoutRef = useRef(false)
  const workoutLoadErrorRef = useRef(false)
  
  // Form state for editing/adding exercises
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    muscleGroup: '',
    sets: 3,
    targetWeight: 0,
    targetReps: 10,
  })

  // Helper function to auto-populate sets with latest data
  const autoPopulateWorkoutSets = async (workout: Workout): Promise<Workout> => {
    // Create a deep copy of the workout to avoid mutating the original
    const updatedWorkout: Workout = {
      ...workout,
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({ ...set }))
      }))
    }
    
    let hasUpdates = false
    const newPrefilledSets = new Map<string, { weight: number; reps: number }>()

    for (const exercise of updatedWorkout.exercises) {
      // Only populate if sets are empty (weight/reps are 0)
      const hasEmptySets = exercise.sets.some(set => set.weight === 0 && set.reps === 0 && !set.completed)
      
      if (hasEmptySets) {
        const latestData = await getLatestExerciseData(exercise.exercise.name)
        
        if (latestData && latestData.weight > 0 && latestData.reps > 0) {
          // Track that this exercise was prefilled
          newPrefilledSets.set(exercise.id, { weight: latestData.weight, reps: latestData.reps })
          
          // Populate all incomplete sets with latest data
          exercise.sets.forEach(set => {
            if (!set.completed && set.weight === 0 && set.reps === 0) {
              set.weight = latestData.weight
              set.reps = latestData.reps
              hasUpdates = true
            }
          })
        }
      }
    }

    if (hasUpdates) {
      setPrefilledSets(newPrefilledSets)
      setWorkout(updatedWorkout)
      await updateWorkout(updatedWorkout)
    }
    
    return updatedWorkout
  }

  // Clear prefilled data for a specific exercise
  const clearPrefilledData = (exerciseIndex: number) => {
    if (!workout) return
    
    const exercise = workout.exercises[exerciseIndex]
    const prefilledData = prefilledSets.get(exercise.id)
    
    if (prefilledData) {
      const newWorkout = { ...workout }
      // Clear all sets that match the prefilled values
      newWorkout.exercises[exerciseIndex].sets.forEach(set => {
        if (!set.completed && set.weight === prefilledData.weight && set.reps === prefilledData.reps) {
          set.weight = 0
          set.reps = 0
        }
      })
      
      setWorkout(newWorkout)
      updateWorkout(newWorkout)
      
      // Remove from prefilled sets
      const newPrefilledSets = new Map(prefilledSets)
      newPrefilledSets.delete(exercise.id)
      setPrefilledSets(newPrefilledSets)
    }
  }

  // Load workout based on URL type parameter or ID
  useEffect(() => {
    async function loadWorkout() {
      setIsLoadingWorkout(true)
      workoutLoadErrorRef.current = false
      
      try {
        // If workoutId is provided, load that specific workout
        if (workoutId) {
          try {
            const existingWorkout = await getWorkoutById(workoutId)
            if (existingWorkout) {
              // Auto-populate sets with latest data
              const populatedWorkout = await autoPopulateWorkoutSets(existingWorkout)
              setWorkout(populatedWorkout)
              setIsLoadingWorkout(false)
              return
            } else {
              showToast('error', 'Workout not found')
              navigate('/')
              return
            }
          } catch (error) {
            const errorInfo = handleFirestoreError(error)
            showToast('error', errorInfo.message)
            navigate('/')
            return
          }
        }
        
        if (workoutType) {
          // Check if there's a current workout that matches the requested type
          try {
            const currentWorkout = await getCurrentWorkout()
            if (currentWorkout && currentWorkout.type === workoutType) {
              // Auto-populate sets with latest data
              const populatedWorkout = await autoPopulateWorkoutSets(currentWorkout)
              setWorkout(populatedWorkout)
              setIsLoadingWorkout(false)
              return
            }
          } catch (error) {
            // If getCurrentWorkout fails, log but continue to create new workout
            const errorInfo = handleFirestoreError(error)
            console.warn('Could not check for existing workout:', errorInfo.message)
            workoutLoadErrorRef.current = true
            // Show error but don't block - allow user to continue
            if (errorInfo.isIndexError) {
              showToast('error', 'Index required. Creating new workout anyway. Please create the index to prevent this.')
            }
          }
          
          // Otherwise, start a new workout with the requested type
          // Prevent duplicate creation
          if (isCreatingWorkoutRef.current) {
            console.log('Workout creation already in progress, skipping...')
            setIsLoadingWorkout(false)
            return
          }
          
          isCreatingWorkoutRef.current = true
          try {
            const newWorkout = await startWorkout(workoutType)
            // Auto-populate sets with latest data
            const populatedWorkout = await autoPopulateWorkoutSets(newWorkout)
            setWorkout(populatedWorkout)
          } finally {
            isCreatingWorkoutRef.current = false
          }
          setIsLoadingWorkout(false)
          return
        }
        
        // If no type in URL, check for existing workout
        try {
          const currentWorkout = await getCurrentWorkout()
          if (currentWorkout) {
            // Auto-populate sets with latest data
            const populatedWorkout = await autoPopulateWorkoutSets(currentWorkout)
            setWorkout(populatedWorkout)
          } else {
            // No workout and no type specified - navigate away
            navigate('/')
          }
        } catch (error) {
          // If getCurrentWorkout fails, show error but don't navigate away
          // User might want to add exercises even without a workout loaded
          const errorInfo = handleFirestoreError(error)
          showToast('error', errorInfo.message)
          if (errorInfo.indexLink) {
            console.error('Index creation link:', errorInfo.indexLink)
          }
          workoutLoadErrorRef.current = true
          // Don't navigate away - allow user to see error and potentially continue
        }
      } catch (error) {
        const errorInfo = handleFirestoreError(error)
        showToast('error', errorInfo.message)
        if (errorInfo.indexLink) {
          console.error('Index creation link:', errorInfo.indexLink)
        }
        workoutLoadErrorRef.current = true
        // Don't navigate away on error - show error and allow user to continue
      } finally {
        setIsLoadingWorkout(false)
      }
    }
    
    loadWorkout()
  }, [workoutType, workoutId, navigate, showToast])

  // Handle workout type changes in URL - if type changes, start new workout
  useEffect(() => {
    async function handleTypeChange() {
      if (workoutType && workout && !workoutId) {
        // If URL type doesn't match current workout type, start new workout
        // But only if we're not loading a specific workout by ID
        if (workout.type !== workoutType) {
          // Prevent duplicate creation
          if (isCreatingWorkoutRef.current) {
            return
          }
          
          setIsLoadingWorkout(true)
          isCreatingWorkoutRef.current = true
          try {
            const newWorkout = await startWorkout(workoutType)
            // Auto-populate sets with latest data
            const populatedWorkout = await autoPopulateWorkoutSets(newWorkout)
            setWorkout(populatedWorkout)
          } finally {
            isCreatingWorkoutRef.current = false
            setIsLoadingWorkout(false)
          }
        }
      }
    }
    
    handleTypeChange()
  }, [workoutType, workout, workoutId])

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
    updateWorkout(newWorkout)
  }

  const handleToggleSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return

    const newWorkout = { ...workout }
    const set = newWorkout.exercises[exerciseIndex].sets[setIndex]
    set.completed = !set.completed
    
    setWorkout(newWorkout)
    updateWorkout(newWorkout)
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
    updateWorkout(newWorkout)
  }

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return

    const newWorkout = { ...workout }
    newWorkout.exercises[exerciseIndex].sets.splice(setIndex, 1)
    
    setWorkout(newWorkout)
    updateWorkout(newWorkout)
  }

  const handleExerciseNoteChange = (exerciseIndex: number, notes: string) => {
    if (!workout) return

    const newWorkout = { ...workout }
    newWorkout.exercises[exerciseIndex].notes = notes
    
    setWorkout(newWorkout)
    updateWorkout(newWorkout)
  }

  const handleWorkoutNoteChange = (notes: string) => {
    if (!workout) return

    const newWorkout = { ...workout }
    newWorkout.notes = notes
    
    setWorkout(newWorkout)
    updateWorkout(newWorkout)
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
    const hasProgress = workout.exercises.some((ex: WorkoutExercise) => 
      ex.sets.some((set: WorkoutSet) => set.completed || set.weight > 0 || set.reps > 0)
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

  const handleCompleteWorkout = async () => {
    if (!workout) return
    
    try {
      await completeWorkout(workout)
      showToast('success', 'Workout saved 💪')
      navigate('/workout/summary')
    } catch (error) {
      console.error('Error completing workout:', error)
      showToast('error', 'Failed to complete workout. Please try again.')
    }
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
    exercise.sets.forEach((set: WorkoutSet, index: number) => {
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
    updateWorkout(newWorkout)
    setEditingExerciseIndex(null)
    setExerciseForm({ name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 })
  }

  const handleAddCustomExercise = async () => {
    if (!workout || !workout.id) {
      console.error('Cannot add exercise: workout or workout.id is missing')
      showToast('error', 'Workout not found. Please try again.')
      return
    }

    // Validate form
    if (!exerciseForm.name.trim() || !exerciseForm.muscleGroup.trim()) {
      showToast('error', 'Please fill in all required fields')
      return
    }

    setIsAddingExercise(true)
    try {
      // Try to get latest data for this exercise if weight/reps are not set
      let avgWeight = exerciseForm.targetWeight || 0
      let avgReps = exerciseForm.targetReps || 10
      
      if (avgWeight === 0 || avgReps === 10) {
        const latestData = await getLatestExerciseData(exerciseForm.name.trim())
        if (latestData) {
          avgWeight = avgWeight || latestData.weight
          avgReps = avgReps === 10 ? latestData.reps : avgReps
        }
      }

      const numSets = Math.max(1, Math.floor(exerciseForm.sets))

      // Save exercise to Firestore subcollection and get the exercise ID
      const exerciseId = await addExerciseToWorkout(workout.id, {
        name: exerciseForm.name.trim(),
        sets: numSets,
        reps: avgReps,
        weight: avgWeight,
        notes: '',
      })

      // Also update the workout document with the new exercise
      const newExercise: Exercise = {
        id: exerciseId,
        name: exerciseForm.name.trim(),
        muscleGroup: exerciseForm.muscleGroup.trim(),
        category: workout.type,
      }

      const newWorkoutExercise: WorkoutExercise = {
        id: exerciseId,
        exerciseId: exerciseId,
        exercise: newExercise,
        sets: Array.from({ length: numSets }, (_, i) => ({
          id: `set-${Date.now()}-${i}`,
          weight: avgWeight,
          reps: avgReps,
          completed: false,
        })),
      }

      const newWorkout = {
        ...workout,
        exercises: [...workout.exercises, newWorkoutExercise],
      }

      setWorkout(newWorkout)
      await updateWorkout(newWorkout)
      showToast('success', 'Exercise added successfully 💪')

      setShowAddExercise(false)
      setExerciseForm({ name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 })
    } catch (error) {
      console.error('Error adding exercise:', error)
      const errorInfo = handleFirestoreError(error)
      showToast('error', errorInfo.message)
      if (errorInfo.indexLink) {
        console.error('Index creation link:', errorInfo.indexLink)
      }
    } finally {
      setIsAddingExercise(false)
    }
  }

  const handleRemoveExercise = (exerciseIndex: number) => {
    if (!workout) return
    
    if (window.confirm('Are you sure you want to remove this exercise?')) {
      const newWorkout = { ...workout }
      newWorkout.exercises.splice(exerciseIndex, 1)
      setWorkout(newWorkout)
      updateWorkout(newWorkout)
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
    await updateWorkout(newWorkout)
    setEditingExerciseNameIndex(null)
    setEditingExerciseNameValue('')

    // Persist to Firestore
    try {
      if (workout.id && exercise.id) {
        await updateExerciseName(workout.id, exercise.id, trimmedValue)
        showToast('success', 'Exercise name updated ✅')
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
      await updateWorkout(revertedWorkout)
      showToast('error', 'Failed to save exercise name. Please try again.')
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
      <div className="min-h-full bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--text-secondary)]">Loading workout...</div>
        </div>
      </div>
    )
  }

  const workoutTypeNames: Record<WorkoutType, string> = {
    push: 'Push Day',
    pull: 'Pull Day',
    legs: 'Legs Day',
  }

  return (
    <div className="min-h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-[var(--border-primary)] z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Exit</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">{workoutTypeNames[workout.type]}</h1>
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
          <button
            className="font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:opacity-80 active:opacity-70 px-6 py-3 text-base min-h-[48px] w-full"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              // Ensure modal can open even if workout load failed
              if (!workout && !workoutLoadErrorRef.current) {
                // If workout is still loading, wait a bit
                if (isLoadingWorkout) {
                  showToast('info', 'Please wait for workout to load...')
                  return
                }
                // If no workout and no error, can't add exercise
                showToast('error', 'No workout available. Please start a workout first.')
                return
              }
              setExerciseForm({ name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 })
              setShowAddExercise(true)
            }}
            type="button"
            disabled={isAddingExercise}
          >
            <Plus size={20} />
            {isAddingExercise ? 'Adding...' : 'Add Exercise'}
          </button>
        </div>

        {/* Exercises */}
        {workout.exercises.map((exercise: WorkoutExercise, exerciseIndex: number) => (
          <Card key={exercise.id} className="bg-card group">
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
                        className="w-full px-3 py-2 border border-primary-500 rounded-lg text-[var(--text-primary)] text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Exercise name"
                        maxLength={60}
                      />
                      {exerciseNameError && (
                        <p className="text-xs text-red-500">{exerciseNameError}</p>
                      )}
                      <div className="flex gap-2 text-xs text-[var(--text-secondary)]">
                        <span>Press Enter to save, Esc to cancel</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--text-primary)] text-lg">
                  {exercise.exercise.name}
                </h3>
                        <button
                          onClick={() => handleStartEditingExerciseName(exerciseIndex)}
                          className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors text-primary-500"
                          aria-label="Edit exercise name"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                <div className="flex items-center gap-2">
                  <p className="text-[var(--text-secondary)] text-sm">
                    {exercise.exercise.muscleGroup}
                  </p>
                  {prefilledSets.has(exercise.id) && (
                    <div className="flex items-center gap-1 text-xs text-primary-500">
                      <span>• From last session</span>
                      <button
                        onClick={() => clearPrefilledData(exerciseIndex)}
                        className="text-primary-500 hover:text-primary-600 underline"
                        type="button"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                    </>
                  )}
                </div>
                {editingExerciseNameIndex !== exerciseIndex && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditExercise(exerciseIndex)}
                      className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-primary-500"
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
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] pb-2 border-b border-[var(--border-primary)]">
                  <div className="w-8 text-center">SET</div>
                  <div className="flex-1 text-center">WEIGHT</div>
                  <div className="flex-1 text-center">REPS</div>
                  <div className="w-20"></div>
                </div>

                {exercise.sets.map((set: WorkoutSet, setIndex: number) => (
                  <div 
                    key={set.id}
                    className={`flex items-center gap-2 ${
                      set.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="w-8 text-center text-[var(--text-primary)] font-medium text-sm">
                      {setIndex + 1}
                    </div>
                    
                    <input
                      type="number"
                      inputMode="decimal"
                      value={set.weight || ''}
                      onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)}
                      className="flex-1 px-2 py-2.5 border border-[var(--border)] rounded-lg text-center text-sm bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] min-w-0"
                      placeholder="0"
                      disabled={set.completed}
                    />
                    
                    <input
                      type="number"
                      inputMode="numeric"
                      value={set.reps || ''}
                      onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)}
                      className="flex-1 px-2 py-2.5 border border-[var(--border)] rounded-lg text-center text-sm bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] min-w-0"
                      placeholder="0"
                      disabled={set.completed}
                    />
                    
                    <div className="flex gap-1 w-20">
                      <button
                        onClick={() => handleToggleSet(exerciseIndex, setIndex)}
                        className={`flex-1 min-w-[36px] h-9 flex items-center justify-center rounded-lg transition-colors ${
                          set.completed
                            ? 'bg-primary-500 text-white'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
                        }`}
                      >
                        <Check size={16} />
                      </button>
                      
                      {exercise.sets.length > 1 && (
                        <button
                          onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                          className="min-w-[36px] h-9 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-red-500 hover:opacity-80"
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
                  className="w-full py-3 border-2 border-dashed border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus size={20} />
                  Add Set
                </button>
              </div>

              {/* Exercise Notes */}
              <div className="border-t border-[var(--border-primary)] pt-3">
                <button
                  onClick={() => toggleExerciseNotes(exerciseIndex)}
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium"
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
                    className="w-full mt-2 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-sm min-h-[80px] resize-y"
                  />
                )}
              </div>
            </div>
          </Card>
        ))}

        {/* Workout Notes */}
        <Card className="bg-card">
          <div className="space-y-3">
            <button
              onClick={() => setShowWorkoutNotes(!showWorkoutNotes)}
              className="flex items-center gap-2 text-[var(--text-primary)] hover:text-primary-500 transition-colors font-medium w-full"
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
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-sm min-h-[100px] resize-y"
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
          <p className="text-xs text-[var(--text-secondary)]">
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
          // Reset any error state
          workoutLoadErrorRef.current = false
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
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleAddCustomExercise()
              }}
              disabled={!exerciseForm.name.trim() || !exerciseForm.muscleGroup.trim() || isAddingExercise}
            >
              {isAddingExercise ? 'Adding...' : 'Add Exercise'}
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

