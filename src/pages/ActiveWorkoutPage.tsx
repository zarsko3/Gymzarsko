import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Check, MessageSquare, FileText, Edit2, X } from 'lucide-react'
import type { Workout, WorkoutType, WorkoutExercise, WorkoutSet, Exercise } from '../types'
import { startWorkout, updateWorkout, completeWorkout, getCurrentWorkout, getWorkoutById } from '../services/workoutServiceFacade'
import { getLatestExerciseData, getLatestExerciseDataByName } from '../services/firestoreProgressService'
import { saveCustomExercise } from '../services/firestorePlanService'
import { useToast } from '../hooks/useToast'
import { handleFirestoreError } from '../utils/firestoreErrorHandler'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useWorkoutTimer } from '../hooks/useWorkoutTimer'
import { useInactivityTimer } from '../hooks/useInactivityTimer'
import WorkoutHeader from '../components/workout/WorkoutHeader'
import SetNumberInput from '../components/workout/SetNumberInput'
import { WORKOUT_TYPE_INFO } from '../constants/workoutTypes'

const EMPTY_EXERCISE_FORM = { name: '', muscleGroup: '', sets: 3, targetWeight: 0, targetReps: 10 }

function randomId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function updateExerciseAt(
  workout: Workout,
  exerciseIndex: number,
  update: (exercise: WorkoutExercise) => WorkoutExercise
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise, i) => (i === exerciseIndex ? update(exercise) : exercise)),
  }
}

function updateSetAt(
  workout: Workout,
  exerciseIndex: number,
  setIndex: number,
  update: (set: WorkoutSet) => WorkoutSet
): Workout {
  return updateExerciseAt(workout, exerciseIndex, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set, i) => (i === setIndex ? update(set) : set)),
  }))
}

function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const workoutType = searchParams.get('type') as WorkoutType
  const workoutId = searchParams.get('id') // Support opening existing workout by ID

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(true)

  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [showWorkoutNotes, setShowWorkoutNotes] = useState(false)
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)
  const [editingExerciseNameIndex, setEditingExerciseNameIndex] = useState<number | null>(null)
  const [editingExerciseNameValue, setEditingExerciseNameValue] = useState('')
  const [exerciseNameError, setExerciseNameError] = useState('')
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false)
  const [prefilledSets, setPrefilledSets] = useState<Map<string, { weight: number; reps: number }>>(new Map())
  const elapsedTime = useWorkoutTimer(workout?.startTime ?? null)

  // Auto-end workout after 60 minutes of inactivity
  useInactivityTimer(
    () => {
      // Only auto-complete if we have a workout and aren't already completing
      const hasCompletedSets = workout?.exercises.some((ex) => ex.sets.some((set) => set.completed))
      if (workout && hasCompletedSets && !isCompletingWorkout && !isWorkoutDoneRef.current) {
        handleCompleteWorkout()
      }
    },
    workout !== null && !isCompletingWorkout
  )

  // Confirmation dialog states
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showRemoveExerciseConfirm, setShowRemoveExerciseConfirm] = useState<number | null>(null)
  const [showSaveToTemplate, setShowSaveToTemplate] = useState<{
    name: string
    muscleGroup: string
    sets: number
    reps: number
  } | null>(null)

  // Refs to prevent duplicate operations
  const isSavingExerciseNameRef = useRef(false)

  // Layer 1: Completion guard — prevents any saves after workout is marked done
  const isWorkoutDoneRef = useRef(false)

  // Layer 2: Debounced save — batches rapid Firestore writes
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSaveRef = useRef<Workout | null>(null)
  const inFlightSaveRef = useRef<Promise<boolean> | null>(null)

  // Form state for editing/adding exercises
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    muscleGroup: '',
    sets: 3,
    targetWeight: 0,
    targetReps: 10,
  })

  const persistWorkoutChange = async (
    nextWorkout: Workout,
    options?: { successMessage?: string; suppressErrorToast?: boolean }
  ): Promise<boolean> => {
    // Guard: skip if workout has been completed
    if (isWorkoutDoneRef.current) return false

    // Update state optimistically
    setWorkout(nextWorkout)
    try {
      await updateWorkout(nextWorkout)
      if (options?.successMessage) {
        showToast('success', options.successMessage)
      }
      return true
    } catch (error) {
      console.error('Error saving workout changes:', error)
      if (!options?.suppressErrorToast) {
        showToast('error', 'Failed to save. Your changes are preserved locally - please try again.')
      }
      return false
    }
  }

  /** Debounced save: batches rapid changes into a single Firestore write */
  const debouncedSave = (nextWorkout: Workout) => {
    // Guard: skip if workout has been completed
    if (isWorkoutDoneRef.current) return

    // Update state immediately for responsiveness
    setWorkout(nextWorkout)

    // Store the latest workout to save
    pendingSaveRef.current = nextWorkout

    // Clear previous timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Start new debounce timer (500ms)
    saveTimerRef.current = setTimeout(() => {
      const workoutToSave = pendingSaveRef.current
      if (workoutToSave && !isWorkoutDoneRef.current) {
        pendingSaveRef.current = null
        inFlightSaveRef.current = updateWorkout(workoutToSave)
          .then(() => true)
          .catch((error) => {
            console.error('Error saving workout changes:', error)
            showToast('error', 'Failed to save. Your changes are preserved locally - please try again.')
            return false
          })
          .finally(() => {
            inFlightSaveRef.current = null
          })
      }
    }, 500)
  }

  /** Flush any pending debounced save immediately and wait for completion */
  const flushPendingSave = async (): Promise<void> => {
    // Cancel the debounce timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    // If there's a pending save, execute it immediately
    if (pendingSaveRef.current && !isWorkoutDoneRef.current) {
      const workoutToSave = pendingSaveRef.current
      pendingSaveRef.current = null
      try {
        await updateWorkout(workoutToSave)
      } catch (error) {
        console.error('Error flushing pending save:', error)
      }
    }

    // Wait for any in-flight save to complete
    if (inFlightSaveRef.current) {
      await inFlightSaveRef.current
    }
  }

  // Fill empty sets with the last session's numbers (does not save or touch state)
  const autoPopulateWorkoutSets = async (
    workout: Workout
  ): Promise<{ workout: Workout; prefilled: Map<string, { weight: number; reps: number }> }> => {
    const prefilled = new Map<string, { weight: number; reps: number }>()
    const needsData = (set: WorkoutSet) => !set.completed && set.weight === 0 && set.reps === 0
    if (!workout.exercises.some(ex => ex.sets.some(needsData))) {
      return { workout, prefilled }
    }

    // One history fetch for all exercises instead of one per exercise
    const latestByName = await getLatestExerciseDataByName()

    const populated: Workout = {
      ...workout,
      exercises: workout.exercises.map(exercise => {
        const latestData = latestByName.get(exercise.exercise.name.toLowerCase())
        if (!latestData || !exercise.sets.some(needsData)) return exercise

        prefilled.set(exercise.id, latestData)
        return {
          ...exercise,
          sets: exercise.sets.map(set =>
            needsData(set) ? { ...set, weight: latestData.weight, reps: latestData.reps } : set
          ),
        }
      }),
    }

    return { workout: populated, prefilled }
  }

  // Clear prefilled data for a specific exercise
  const clearPrefilledData = (exerciseIndex: number) => {
    if (!workout) return

    const exercise = workout.exercises[exerciseIndex]
    const prefilledData = prefilledSets.get(exercise.id)

    if (prefilledData) {
      // Clear all sets that match the prefilled values
      const newWorkout = updateExerciseAt(workout, exerciseIndex, (ex) => ({
        ...ex,
        sets: ex.sets.map(set =>
          !set.completed && set.weight === prefilledData.weight && set.reps === prefilledData.reps
            ? { ...set, weight: 0, reps: 0 }
            : set
        ),
      }))

      debouncedSave(newWorkout)

      // Remove from prefilled sets
      const newPrefilledSets = new Map(prefilledSets)
      newPrefilledSets.delete(exercise.id)
      setPrefilledSets(newPrefilledSets)
    }
  }

  // Load workout based on URL type parameter or ID. Re-runs when the URL changes;
  // results from a superseded run are ignored so two loads can never race.
  useEffect(() => {
    let cancelled = false

    const fail = (error: unknown) => {
      if (cancelled) return
      const errorInfo = handleFirestoreError(error)
      showToast('error', errorInfo.message)
      if (errorInfo.indexLink) {
        console.error('Index creation link:', errorInfo.indexLink)
      }
      navigate('/')
    }

    const resolveWorkout = async (): Promise<Workout | null> => {
      if (workoutId) {
        const existingWorkout = await getWorkoutById(workoutId)
        if (!existingWorkout) {
          showToast('error', 'Workout not found')
          return null
        }
        return existingWorkout
      }

      if (workoutType) {
        try {
          const currentWorkout = await getCurrentWorkout()
          if (currentWorkout && currentWorkout.type === workoutType) {
            return currentWorkout
          }
        } catch (error) {
          // Don't block starting a workout if the lookup fails (e.g. index still building)
          const errorInfo = handleFirestoreError(error)
          console.warn('Could not check for existing workout:', errorInfo.message)
        }
        // startWorkout returns the in-flight/existing workout, so repeat calls are safe
        return startWorkout(workoutType)
      }

      // No type or id in URL: resume whatever is active
      return getCurrentWorkout()
    }

    async function loadWorkout() {
      setIsLoadingWorkout(true)
      try {
        const loaded = await resolveWorkout()
        if (cancelled) return

        if (!loaded) {
          navigate('/')
          return
        }

        // Finished workouts are edited on the detail page, not re-opened as active
        if (loaded.completed) {
          navigate(`/workout/detail/${loaded.id}`, { replace: true })
          return
        }

        const { workout: populated, prefilled } = await autoPopulateWorkoutSets(loaded)
        if (cancelled) return

        setPrefilledSets(prefilled)
        if (prefilled.size > 0) {
          await persistWorkoutChange(populated)
        } else {
          setWorkout(populated)
        }
      } catch (error) {
        fail(error)
      } finally {
        if (!cancelled) {
          setIsLoadingWorkout(false)
        }
      }
    }

    loadWorkout()

    return () => {
      cancelled = true
    }
  }, [workoutType, workoutId, navigate, showToast])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSetChange = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    if (!workout) return

    const numValue = Math.max(0, parseFloat(value) || 0)
    debouncedSave(updateSetAt(workout, exerciseIndex, setIndex, (set) => ({ ...set, [field]: numValue })))
  }

  const handleToggleSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return

    debouncedSave(updateSetAt(workout, exerciseIndex, setIndex, (set) => ({ ...set, completed: !set.completed })))
  }

  const handleAddSet = (exerciseIndex: number) => {
    if (!workout) return

    debouncedSave(updateExerciseAt(workout, exerciseIndex, (ex) => {
      const lastSet = ex.sets[ex.sets.length - 1]
      return {
        ...ex,
        sets: [
          ...ex.sets,
          { id: randomId('set'), weight: lastSet?.weight || 0, reps: lastSet?.reps || 0, completed: false },
        ],
      }
    }))
  }

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return

    debouncedSave(updateExerciseAt(workout, exerciseIndex, (ex) => ({
      ...ex,
      sets: ex.sets.filter((_, i) => i !== setIndex),
    })))
  }

  const handleExerciseNoteChange = (exerciseIndex: number, notes: string) => {
    if (!workout) return

    debouncedSave(updateExerciseAt(workout, exerciseIndex, (ex) => ({ ...ex, notes })))
  }

  const handleWorkoutNoteChange = (notes: string) => {
    if (!workout) return

    debouncedSave({ ...workout, notes })
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
      setShowExitConfirm(true)
    } else {
      navigate('/')
    }
  }

  const handleConfirmExit = () => {
    setShowExitConfirm(false)
    navigate('/')
  }

  const handleCompleteWorkout = async () => {
    if (!workout || isCompletingWorkout) return

    // Layer 1: Guard — prevent any further saves immediately
    isWorkoutDoneRef.current = true
    setIsCompletingWorkout(true)

    try {
      // Layer 2: Flush any pending debounced save before completing
      await flushPendingSave()

      await completeWorkout(workout)
      showToast('success', 'Workout saved 💪')
      navigate(`/workout/summary?id=${workout.id}`)
    } catch (error) {
      console.error('Error completing workout:', error)
      showToast('error', 'Failed to complete workout. Please try again.')
      // Reset guards so user can retry
      isWorkoutDoneRef.current = false
      setIsCompletingWorkout(false)
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

  const handleSaveExerciseEdit = async () => {
    if (!workout || editingExerciseIndex === null) return

    const newWorkout = updateExerciseAt(workout, editingExerciseIndex, (exercise) => {
      const targetSetsCount = Math.max(1, Math.floor(exerciseForm.sets))
      let sets = [...exercise.sets]

      if (targetSetsCount > sets.length) {
        const lastSet = sets[sets.length - 1]
        while (sets.length < targetSetsCount) {
          sets.push({
            id: randomId('set'),
            weight: exerciseForm.targetWeight || lastSet?.weight || 0,
            reps: exerciseForm.targetReps || lastSet?.reps || 10,
            completed: false,
          })
        }
      } else if (targetSetsCount < sets.length) {
        // Drop incomplete sets from the end; completed sets are never removed
        let toRemove = sets.length - targetSetsCount
        for (let i = sets.length - 1; i >= 0 && toRemove > 0; i--) {
          if (!sets[i].completed) {
            sets.splice(i, 1)
            toRemove--
          }
        }
      }

      // Update weight and reps for all incomplete sets
      sets = sets.map((set) => {
        if (set.completed) return set
        return {
          ...set,
          weight: exerciseForm.targetWeight > 0 ? exerciseForm.targetWeight : set.weight,
          reps: exerciseForm.targetReps > 0 ? exerciseForm.targetReps : set.reps,
        }
      })

      return {
        ...exercise,
        exercise: { ...exercise.exercise, name: exerciseForm.name, muscleGroup: exerciseForm.muscleGroup },
        sets,
      }
    })

    const saved = await persistWorkoutChange(newWorkout)
    if (saved) {
      setEditingExerciseIndex(null)
      setExerciseForm(EMPTY_EXERCISE_FORM)
    }
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
      // Fill in weight from the last session only when the user left it empty
      const avgReps = exerciseForm.targetReps || 10
      let avgWeight = exerciseForm.targetWeight || 0
      if (avgWeight === 0) {
        const latestData = await getLatestExerciseData(exerciseForm.name.trim())
        if (latestData) {
          avgWeight = latestData.weight
        }
      }

      const numSets = Math.max(1, Math.floor(exerciseForm.sets))
      const exerciseId = randomId('we-custom')

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
        sets: Array.from({ length: numSets }, () => ({
          id: randomId('set'),
          weight: avgWeight,
          reps: avgReps,
          completed: false,
        })),
      }

      const newWorkout = {
        ...workout,
        exercises: [...workout.exercises, newWorkoutExercise],
      }

      const saved = await persistWorkoutChange(newWorkout, { successMessage: 'Exercise added successfully' })

      if (saved) {
        // Capture form values before clearing
        const addedName = exerciseForm.name.trim()
        const addedMuscleGroup = exerciseForm.muscleGroup.trim()
        const addedSets = numSets
        const addedReps = avgReps

        setShowAddExercise(false)
        setExerciseForm(EMPTY_EXERCISE_FORM)

        // Ask user if they want to save this exercise to their template
        setShowSaveToTemplate({
          name: addedName,
          muscleGroup: addedMuscleGroup,
          sets: addedSets,
          reps: addedReps,
        })
      }
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

  const handleConfirmSaveToTemplate = async () => {
    if (!showSaveToTemplate || !workout) return

    try {
      await saveCustomExercise({
        name: showSaveToTemplate.name,
        muscleGroup: showSaveToTemplate.muscleGroup,
        category: workout.type,
        defaultSets: showSaveToTemplate.sets,
        defaultReps: showSaveToTemplate.reps,
      })
      showToast('success', `"${showSaveToTemplate.name}" saved to your ${workout.type} template`)
    } catch (error) {
      console.error('Error saving exercise to template:', error)
      showToast('error', 'Failed to save to template. You can try again later from settings.')
    } finally {
      setShowSaveToTemplate(null)
    }
  }

  const handleRemoveExercise = (exerciseIndex: number) => {
    if (!workout) return
    setShowRemoveExerciseConfirm(exerciseIndex)
  }

  const handleConfirmRemoveExercise = () => {
    if (!workout || showRemoveExerciseConfirm === null) return

    const removedIndex = showRemoveExerciseConfirm
    debouncedSave({ ...workout, exercises: workout.exercises.filter((_, i) => i !== removedIndex) })
    // Note panels are tracked by index, so shift the ones after the removed exercise
    setExpandedNotes((prev) => new Set(
      [...prev].filter((i) => i !== removedIndex).map((i) => (i > removedIndex ? i - 1 : i))
    ))
    setShowRemoveExerciseConfirm(null)
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
    // Enter saves and unmounts the input, which then fires blur — only save once
    if (!workout || isSavingExerciseNameRef.current) return

    const trimmedValue = editingExerciseNameValue.trim()
    if (!validateExerciseName(trimmedValue)) {
      return
    }

    isSavingExerciseNameRef.current = true
    try {
      const newWorkout = updateExerciseAt(workout, exerciseIndex, (exercise) => ({
        ...exercise,
        exercise: { ...exercise.exercise, name: trimmedValue },
      }))
      const saved = await persistWorkoutChange(newWorkout, { successMessage: 'Exercise name updated ✅' })
      if (saved) {
        setEditingExerciseNameIndex(null)
        setEditingExerciseNameValue('')
      }
    } finally {
      isSavingExerciseNameRef.current = false
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

  return (
    <div className="min-h-full bg-[var(--bg-primary)]">
      <WorkoutHeader
        title={WORKOUT_TYPE_INFO[workout.type]?.name ?? 'Workout'}
        elapsedTime={formatTime(elapsedTime)}
        onExit={handleBack}
        onComplete={handleCompleteWorkout}
        isCompleting={isCompletingWorkout}
      />

      <div className="px-4 py-6 space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            className="font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:opacity-80 active:opacity-70 px-6 py-3 text-base min-h-[48px] w-full"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setExerciseForm(EMPTY_EXERCISE_FORM)
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
                        onBlur={(e) => {
                          // Skip blur caused by the input unmounting after an Enter save
                          if (isSavingExerciseNameRef.current || !e.currentTarget.isConnected) return
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
                    {exercise.exercise.repRange && ` • ${exercise.exercise.repRange} reps`}
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

                    <SetNumberInput
                      inputMode="decimal"
                      min="0"
                      max="500"
                      step="0.5"
                      value={set.weight}
                      onValueChange={(value) => handleSetChange(exerciseIndex, setIndex, 'weight', value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          // Focus reps input of the same set
                          const repsInput = document.querySelector<HTMLInputElement>(
                            `[data-exercise="${exerciseIndex}"][data-set="${setIndex}"][data-field="reps"]`
                          )
                          repsInput?.focus()
                        }
                      }}
                      data-exercise={exerciseIndex}
                      data-set={setIndex}
                      data-field="weight"
                      className="flex-1 px-2 py-3 border border-[var(--border)] rounded-lg text-center text-base bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] min-w-[80px]"
                      placeholder="0"
                      disabled={set.completed}
                    />

                    <SetNumberInput
                      inputMode="numeric"
                      min="0"
                      max="100"
                      step="1"
                      value={set.reps}
                      onValueChange={(value) => handleSetChange(exerciseIndex, setIndex, 'reps', value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          // Try to focus weight input of next set
                          const nextWeightInput = document.querySelector<HTMLInputElement>(
                            `[data-exercise="${exerciseIndex}"][data-set="${setIndex + 1}"][data-field="weight"]`
                          )
                          if (nextWeightInput) {
                            nextWeightInput.focus()
                          } else {
                            // No more sets, blur to close keyboard
                            ;(e.target as HTMLInputElement).blur()
                          }
                        }
                      }}
                      data-exercise={exerciseIndex}
                      data-set={setIndex}
                      data-field="reps"
                      className="flex-1 px-2 py-3 border border-[var(--border)] rounded-lg text-center text-base bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] min-w-[80px]"
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
          disabled={isCompletingWorkout}
          className="mt-6"
        >
          {isCompletingWorkout ? 'Saving...' : 'Complete Workout'}
        </Button>
      </div>

      {/* Edit Exercise Modal */}
      <Modal
        isOpen={editingExerciseIndex !== null}
        onClose={() => {
          setEditingExerciseIndex(null)
          setExerciseForm(EMPTY_EXERCISE_FORM)
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
                setExerciseForm(EMPTY_EXERCISE_FORM)
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
          setExerciseForm(EMPTY_EXERCISE_FORM)
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
                setExerciseForm(EMPTY_EXERCISE_FORM)
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

      {/* Exit Workout Confirmation Modal */}
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        size="sm"
      >
        <ConfirmDialog
          title="Exit Workout?"
          message="Your progress is saved. You can continue this workout from the Home screen."
          confirmLabel="Exit"
          cancelLabel="Keep Working"
          variant="destructive"
          icon="warning"
          onConfirm={handleConfirmExit}
          onCancel={() => setShowExitConfirm(false)}
        />
      </Modal>

      {/* Remove Exercise Confirmation Modal */}
      <Modal
        isOpen={showRemoveExerciseConfirm !== null}
        onClose={() => setShowRemoveExerciseConfirm(null)}
        size="sm"
      >
        <ConfirmDialog
          title="Remove Exercise?"
          message="Are you sure you want to remove this exercise from your workout?"
          confirmLabel="Remove"
          cancelLabel="Cancel"
          variant="destructive"
          icon="delete"
          onConfirm={handleConfirmRemoveExercise}
          onCancel={() => setShowRemoveExerciseConfirm(null)}
        />
      </Modal>

      {/* Save to Template Confirmation Modal */}
      <Modal
        isOpen={showSaveToTemplate !== null}
        onClose={() => setShowSaveToTemplate(null)}
        size="sm"
      >
        <ConfirmDialog
          title="Save to Template?"
          message={`Would you like "${showSaveToTemplate?.name}" to appear automatically in future ${workout?.type} workouts?`}
          confirmLabel="Save to Template"
          cancelLabel="No Thanks"
          variant="default"
          icon="none"
          onConfirm={handleConfirmSaveToTemplate}
          onCancel={() => setShowSaveToTemplate(null)}
        />
      </Modal>
    </div>
  )
}

export default ActiveWorkoutPage

