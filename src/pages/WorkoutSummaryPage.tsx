import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Check, Home, Plus, ArrowUpRight, ArrowDownRight, Equal } from 'lucide-react'
import type { Workout } from '../types'
import { getWorkouts, getWorkoutById, updateWorkout } from '../services/workoutServiceFacade'
import { useToast } from '../hooks/useToast'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { WORKOUT_TYPE_INFO } from '../constants/workoutTypes'
import SessionRecordsCard from '../components/workout/SessionRecordsCard'
import {
  getWorkoutTotals,
  compareWithPreviousOfType,
  getSessionRecords,
  getExerciseTrend,
  getTopSet,
  type Trend,
} from '../utils/workoutSummary'

function formatVolume(kg: number) {
  return Math.abs(kg) >= 1000 ? `${(kg / 1000).toFixed(1)}k` : `${Math.round(kg)}`
}

function formatDelta(value: number | null, unit = '') {
  if (value === null || value === 0) return null
  const sign = value > 0 ? '+' : '−'
  return `${sign}${Math.abs(value) >= 1000 ? formatVolume(Math.abs(value)) : Math.abs(Math.round(value * 10) / 10)}${unit}`
}

const trendIcons: Record<Trend, { Icon: typeof Equal; className: string; label: string }> = {
  up: { Icon: ArrowUpRight, className: 'text-green-600 dark:text-green-400', label: 'Better than last time' },
  same: { Icon: Equal, className: 'text-[var(--text-secondary)]', label: 'Same as last time' },
  down: { Icon: ArrowDownRight, className: 'text-red-500', label: 'Below last time' },
}

function WorkoutSummaryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workoutId = searchParams.get('id')
  const { showToast } = useToast()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([])
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
        // History powers records and the comparison with the last workout of this type
        const workouts = await getWorkouts()
        setAllWorkouts(workouts)
        if (workoutId) {
          setWorkout(await getWorkoutById(workoutId))
          return
        }
        // Fallback: most recent completed workout (sorted by date desc)
        setWorkout(workouts.find((w) => w.completed) ?? null)
      } catch (error) {
        console.error('Error loading workout:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkout()
  }, [workoutId])

  const summary = useMemo(() => {
    if (!workout) return null
    return {
      totals: getWorkoutTotals(workout),
      comparison: compareWithPreviousOfType(workout, allWorkouts),
      records: getSessionRecords(workout, allWorkouts),
    }
  }, [workout, allWorkouts])

  useEffect(() => {
    if (!isLoading && !workout) {
      navigate('/', { replace: true })
    }
  }, [isLoading, workout, navigate])

  if (isLoading) {
    return (
      <div className="min-h-full bg-[var(--bg-primary)] flex items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    )
  }

  if (!workout || !summary) {
    return null
  }

  const { totals, comparison, records } = summary
  const typeName = WORKOUT_TYPE_INFO[workout.type]?.name ?? 'Workout'
  const stats = [
    {
      label: 'duration',
      value: totals.durationMinutes !== null ? `${totals.durationMinutes}m` : '—',
      delta: formatDelta(comparison?.durationMinutes ?? null, 'm'),
      // Shorter for the same work isn't better or worse, so keep it neutral
      positive: null as boolean | null,
    },
    {
      label: 'sets',
      value: `${totals.sets}`,
      delta: formatDelta(comparison?.sets ?? null),
      positive: comparison ? comparison.sets > 0 : null,
    },
    {
      label: 'kg volume',
      value: formatVolume(totals.volume),
      delta: formatDelta(comparison?.volume ?? null),
      positive: comparison ? comparison.volume > 0 : null,
    },
  ]

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
      const exerciseId = `we-custom-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      const updatedWorkout = {
        ...workout,
        exercises: [
          ...workout.exercises,
          {
            id: exerciseId,
            exerciseId,
            exercise: {
              id: exerciseId,
              name: exerciseForm.name.trim(),
              muscleGroup: '',
              category: workout.type,
            },
            notes: exerciseForm.notes.trim() || undefined,
            sets: Array.from({ length: exerciseForm.sets }, (_, i) => ({
              id: `set-${Date.now()}-${i}`,
              weight: exerciseForm.weight,
              reps: exerciseForm.reps,
              completed: true,
            })),
          },
        ],
      }

      await updateWorkout(updatedWorkout)
      setWorkout(updatedWorkout)

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
      showToast('success', 'Exercise added successfully 💪')
    } catch (error) {
      console.error('Error adding exercise:', error)
      setFormError('Failed to add exercise. Please try again.')
      showToast('error', 'Failed to add exercise. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-[var(--bg-primary)]">
      <div className="px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500 text-on-primary mb-3">
            <Check size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Workout complete</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {typeName} · {format(workout.date, 'EEE, MMM d')}
          </p>
        </div>

        <SessionRecordsCard records={records} />

        {/* Totals vs the last workout of the same type */}
        <div>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-card text-center p-3">
                <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{stat.value}</div>
                <div className="text-[var(--text-secondary)] text-xs">{stat.label}</div>
                {stat.delta && (
                  <div
                    className={`text-xs font-medium mt-1 tabular-nums ${
                      stat.positive === true
                        ? 'text-green-600 dark:text-green-400'
                        : stat.positive === false
                          ? 'text-red-500'
                          : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {stat.delta}
                  </div>
                )}
              </Card>
            ))}
          </div>
          {comparison && (
            <p className="text-xs text-[var(--text-secondary)] text-center mt-2">
              Compared to your last {typeName.toLowerCase()}
            </p>
          )}
        </div>

        {/* Exercises */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-primary)]">Exercises</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddExercise(true)}
            >
              <Plus size={16} />
              Add Exercise
            </Button>
          </div>
          <Card className="bg-card divide-y divide-[var(--border-primary)] py-1">
            {workout.exercises.map((exercise) => {
              const doneSets = exercise.sets.filter((set) => set.completed).length
              const top = getTopSet(exercise)
              const trend = getExerciseTrend(exercise, workout, allWorkouts)
              const trendInfo = trend ? trendIcons[trend] : null
              return (
                <div key={exercise.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-[var(--text-primary)] truncate">{exercise.exercise.name}</span>
                  <span className="flex items-center gap-1.5 flex-shrink-0 text-sm text-[var(--text-secondary)] tabular-nums">
                    {doneSets === 0
                      ? 'skipped'
                      : `${doneSets} ${doneSets === 1 ? 'set' : 'sets'}${top ? ` · best ${top.weight}×${top.reps}` : ''}`}
                    {trendInfo && (
                      <trendInfo.Icon size={16} className={trendInfo.className} aria-label={trendInfo.label} />
                    )}
                  </span>
                </div>
              )
            })}
          </Card>
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

