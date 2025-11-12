import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { Calendar, Clock } from 'lucide-react'
import type { Workout, WorkoutSet } from '../../types'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

interface EditWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  workout: Workout | null
  onSave: (workout: Workout) => Promise<void>
}

function EditWorkoutModal({ isOpen, onClose, workout, onSave }: EditWorkoutModalProps) {
  const [editedWorkout, setEditedWorkout] = useState<Workout | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  // Initialize edited workout when modal opens
  useEffect(() => {
    if (workout && isOpen) {
      // Deep clone the workout for editing and normalize dates
      const cloned = JSON.parse(JSON.stringify(workout))
      
      // Normalize date to ensure it's a Date object
      const rawDate = workout.date
      const normalizedDate = rawDate instanceof Timestamp
        ? rawDate.toDate()
        : typeof rawDate === 'string'
          ? new Date(rawDate)
          : rawDate instanceof Date
            ? rawDate
            : new Date()
      
      // Normalize startTime if it exists
      let normalizedStartTime: Date | undefined
      if (workout.startTime) {
        const rawStartTime = workout.startTime
        normalizedStartTime = rawStartTime instanceof Timestamp
          ? rawStartTime.toDate()
          : typeof rawStartTime === 'string'
            ? new Date(rawStartTime)
            : rawStartTime instanceof Date
              ? rawStartTime
              : undefined
      }
      
      // Normalize endTime if it exists
      let normalizedEndTime: Date | undefined
      if (workout.endTime) {
        const rawEndTime = workout.endTime
        normalizedEndTime = rawEndTime instanceof Timestamp
          ? rawEndTime.toDate()
          : typeof rawEndTime === 'string'
            ? new Date(rawEndTime)
            : rawEndTime instanceof Date
              ? rawEndTime
              : undefined
      }
      
      setEditedWorkout({
        ...cloned,
        date: normalizedDate,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
      })
      setError('')
    }
  }, [workout, isOpen])

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'reps',
    value: number
  ) => {
    if (!editedWorkout) return

    const newWorkout = { ...editedWorkout }
    const set = newWorkout.exercises[exerciseIndex].sets[setIndex]
    
    if (field === 'weight') {
      set.weight = Math.max(0, value)
    } else {
      set.reps = Math.max(0, value)
    }

    setEditedWorkout(newWorkout)
  }

  const handleExerciseNotesChange = (exerciseIndex: number, notes: string) => {
    if (!editedWorkout) return

    const newWorkout = { ...editedWorkout }
    newWorkout.exercises[exerciseIndex].notes = notes
    setEditedWorkout(newWorkout)
  }

  const handleWorkoutNotesChange = (notes: string) => {
    if (!editedWorkout) return

    const newWorkout = { ...editedWorkout }
    newWorkout.notes = notes
    setEditedWorkout(newWorkout)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedWorkout) return

    const newDate = new Date(e.target.value)
    const newWorkout = { ...editedWorkout }
    
    // Preserve time if startTime exists
    if (newWorkout.startTime) {
      const startTime = new Date(newWorkout.startTime)
      newDate.setHours(startTime.getHours(), startTime.getMinutes(), startTime.getSeconds())
      newWorkout.startTime = newDate
    }
    
    newWorkout.date = newDate
    setEditedWorkout(newWorkout)
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedWorkout) return

    const timeValue = e.target.value
    if (!timeValue) {
      const newWorkout = { ...editedWorkout }
      newWorkout.startTime = undefined
      setEditedWorkout(newWorkout)
      return
    }

    const [hours, minutes] = timeValue.split(':').map(Number)
    const newStartTime = new Date(editedWorkout.date)
    newStartTime.setHours(hours, minutes, 0, 0)

    const newWorkout = { ...editedWorkout }
    newWorkout.startTime = newStartTime
    setEditedWorkout(newWorkout)
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedWorkout) return

    const timeValue = e.target.value
    if (!timeValue) {
      const newWorkout = { ...editedWorkout }
      newWorkout.endTime = undefined
      setEditedWorkout(newWorkout)
      return
    }

    const [hours, minutes] = timeValue.split(':').map(Number)
    const newEndTime = new Date(editedWorkout.date)
    newEndTime.setHours(hours, minutes, 0, 0)

    const newWorkout = { ...editedWorkout }
    newWorkout.endTime = newEndTime
    setEditedWorkout(newWorkout)
  }

  const handleExerciseNameChange = (exerciseIndex: number, name: string) => {
    if (!editedWorkout) return

    const newWorkout = { ...editedWorkout }
    newWorkout.exercises[exerciseIndex] = {
      ...newWorkout.exercises[exerciseIndex],
      exercise: {
        ...newWorkout.exercises[exerciseIndex].exercise,
        name: name.trim(),
      },
    }
    setEditedWorkout(newWorkout)
  }

  const formatDateForInput = (date: Date) => {
    return format(date, 'yyyy-MM-dd')
  }

  const formatTimeForInput = (date: Date | undefined) => {
    if (!date) return ''
    return format(date, 'HH:mm')
  }

  const handleSave = async () => {
    if (!editedWorkout) return

    setIsSubmitting(true)
    setError('')

    try {
      await onSave(editedWorkout)
      onClose()
    } catch (err) {
      console.error('Error saving workout:', err)
      setError('Failed to save workout. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!workout || !editedWorkout) return null

  const workoutTypeColors = {
    push: 'bg-blue-50 text-blue-600 border-blue-200',
    pull: 'bg-green-50 text-green-600 border-green-200',
    legs: 'bg-purple-50 text-purple-600 border-purple-200',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Workout"
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Workout Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full border text-sm font-medium ${workoutTypeColors[workout.type]}`}>
              {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} Day
            </span>
          </div>

          {/* Date and Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Workout Date
              </label>
              <Input
                type="date"
                value={formatDateForInput(editedWorkout.date)}
                onChange={handleDateChange}
                disabled={isSubmitting}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Clock size={16} />
                Start Time
              </label>
              <Input
                type="time"
                value={formatTimeForInput(editedWorkout.startTime)}
                onChange={handleStartTimeChange}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Clock size={16} />
                End Time
              </label>
              <Input
                type="time"
                value={formatTimeForInput(editedWorkout.endTime)}
                onChange={handleEndTimeChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Workout Notes */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Workout Notes
            </label>
            <textarea
              value={editedWorkout.notes || ''}
              onChange={(e) => handleWorkoutNotesChange(e.target.value)}
              placeholder="Add notes about this workout..."
              className="w-full px-4 py-3 border border-border-primary rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Exercises */}
        <div className="space-y-4">
          {editedWorkout.exercises.map((exercise, exerciseIndex) => (
            <Card key={exercise.id} className="bg-card p-4">
              <div className="space-y-3">
                {/* Exercise Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Input
                      value={exercise.exercise.name}
                      onChange={(e) => handleExerciseNameChange(exerciseIndex, e.target.value)}
                      placeholder="Exercise name"
                      className="font-semibold"
                      disabled={isSubmitting}
                    />
                    <div className="text-xs text-text-secondary ml-2 whitespace-nowrap">
                      {exercise.sets.filter((s: WorkoutSet) => s.completed).length} / {exercise.sets.length} sets
                    </div>
                  </div>
                </div>

                {/* Sets */}
                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={set.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        set.completed ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <span className="text-xs font-medium text-text-secondary w-8">
                        Set {setIndex + 1}
                      </span>
                      <Input
                        type="number"
                        value={set.weight.toString()}
                        onChange={(e) =>
                          handleSetChange(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)
                        }
                        placeholder="Weight"
                        className="flex-1"
                        disabled={isSubmitting}
                        step="0.5"
                        min="0"
                      />
                      <span className="text-text-secondary text-sm">kg</span>
                      <Input
                        type="number"
                        value={set.reps.toString()}
                        onChange={(e) =>
                          handleSetChange(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)
                        }
                        placeholder="Reps"
                        className="flex-1"
                        disabled={isSubmitting}
                        min="0"
                      />
                      <span className="text-text-secondary text-sm">reps</span>
                      {set.completed && (
                        <span className="text-xs text-green-600 font-medium">✓</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Exercise Notes */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Exercise Notes
                  </label>
                  <textarea
                    value={exercise.notes || ''}
                    onChange={(e) => handleExerciseNotesChange(exerciseIndex, e.target.value)}
                    placeholder="Add notes about this exercise..."
                    className="w-full px-3 py-2 text-sm border border-border-primary rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default EditWorkoutModal

