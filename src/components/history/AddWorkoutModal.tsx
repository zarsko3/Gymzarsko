import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Calendar, Plus, X, Trash2 } from 'lucide-react'
import type { WorkoutType, WorkoutExercise, WorkoutSet } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../hooks/useToast'
import { createWorkoutWithDate, updateWorkout } from '../../services/workoutServiceFacade'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import WorkoutTypeModal from '../home/WorkoutTypeModal'

interface AddWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (type: WorkoutType, date: Date) => Promise<void>
}

interface ExerciseForm {
  name: string
  sets: number
  reps: number
  weight: number
  notes: string
}

function AddWorkoutModal({ isOpen, onClose, onSave }: AddWorkoutModalProps) {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null)
  const [showWorkoutTypeModal, setShowWorkoutTypeModal] = useState(false)
  const [exercises, setExercises] = useState<ExerciseForm[]>([])
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  // Get max date (today)
  const maxDate = format(new Date(), 'yyyy-MM-dd')
  
  // Get min date (1 year ago)
  const minDate = format(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
      setSelectedType(null)
      setExercises([])
      setWorkoutNotes('')
      setError('')
    }
  }, [isOpen])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    setError('')
  }

  const handleWorkoutTypeSelect = (type: WorkoutType) => {
    setSelectedType(type)
    setShowWorkoutTypeModal(false)
  }

  const handleAddExercise = () => {
    setExercises([...exercises, {
      name: '',
      sets: 3,
      reps: 10,
      weight: 0,
      notes: '',
    }])
  }

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleExerciseChange = (index: number, field: keyof ExerciseForm, value: string | number) => {
    const newExercises = [...exercises]
    newExercises[index] = {
      ...newExercises[index],
      [field]: value,
    }
    setExercises(newExercises)
  }

  // Validate form
  const isValid = () => {
    if (!selectedDate) return false
    if (!selectedType) return false
    if (exercises.length === 0) return false
    
    // Check all exercises have valid data
    return exercises.every(ex => 
      ex.name.trim().length > 0 &&
      ex.sets > 0 &&
      ex.reps > 0 &&
      ex.weight >= 0
    )
  }

  const handleSaveWorkout = async () => {
    if (!isValid() || !currentUser || !selectedType) {
      setError('Please fill in all required fields: date, type, and at least one exercise with name, sets, reps, and weight.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const date = new Date(selectedDate)
      date.setHours(0, 0, 0, 0)

      // Create workout with date and type
      const workout = await createWorkoutWithDate(selectedType, date)

      // Convert exercise forms to WorkoutExercise format
      const workoutExercises: WorkoutExercise[] = exercises.map((ex, index) => {
        const sets: WorkoutSet[] = Array(ex.sets).fill(null).map((_, setIndex) => ({
          id: `set-${index}-${setIndex}-${Date.now()}`,
          weight: ex.weight,
          reps: ex.reps,
          completed: true,
        }))

        return {
          id: `we-${index}-${Date.now()}`,
          exerciseId: `custom-${index}-${Date.now()}`,
          exercise: {
            id: `custom-${index}-${Date.now()}`,
            name: ex.name.trim(),
            muscleGroup: 'Custom',
            category: selectedType,
          },
          sets,
          notes: ex.notes.trim() || undefined,
        }
      })

      // Update workout with exercises and notes
      const updatedWorkout = {
        ...workout,
        exercises: workoutExercises,
        notes: workoutNotes.trim() || undefined,
        completed: true,
      }

      await updateWorkout(updatedWorkout)
      
      showToast('success', 'Workout saved 💪')
      await onSave(selectedType, date)
      onClose()
      
      // Navigate to workout detail
      navigate(`/workout/detail/${workout.id}`)
    } catch (err) {
      console.error('Error saving workout:', err)
      setError('Couldn\'t save workout. Try again.')
      showToast('error', 'Couldn\'t save workout. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const workoutTypeColors = {
    push: 'bg-blue-50 text-blue-600 border-blue-200',
    pull: 'bg-green-50 text-green-600 border-green-200',
    legs: 'bg-purple-50 text-purple-600 border-purple-200',
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Workout"
        size="lg"
      >
        <div className="flex flex-col min-h-full">
          {/* Scrollable Content Area */}
          <div className="flex-1 space-y-6 pb-[100px]">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                min={minDate}
                max={maxDate}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <Calendar 
                size={20} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" 
              />
            </div>
            {selectedDate && (
              <p className="mt-2 text-sm text-text-secondary">
                Selected: {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Workout Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Workout Type <span className="text-red-500">*</span>
            </label>
            {selectedType ? (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white">
                <span className={`px-3 py-1 rounded-full border text-sm font-medium ${workoutTypeColors[selectedType]}`}>
                  {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Day
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  disabled={isSubmitting}
                >
                  Change
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowWorkoutTypeModal(true)}
                variant="secondary"
                fullWidth
                disabled={isSubmitting}
              >
                Select Workout Type
              </Button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Exercises Section */}
          {selectedType && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-text-primary">
                  Exercises <span className="text-red-500">*</span>
                </label>
                <Button
                  onClick={handleAddExercise}
                  variant="secondary"
                  size="sm"
                  disabled={isSubmitting}
                >
                  <Plus size={16} className="mr-1" />
                  Add Exercise
                </Button>
              </div>

              {exercises.length === 0 ? (
                <Card className="bg-gray-50 p-6 text-center">
                  <p className="text-text-secondary text-sm">
                    Click "Add Exercise" to add your first exercise
                  </p>
                </Card>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {exercises.map((exercise, index) => (
                    <Card key={index} className="bg-white p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-primary">
                            Exercise #{index + 1}
                          </span>
                          <button
                            onClick={() => handleRemoveExercise(index)}
                            className="text-red-500 hover:text-red-600 p-1"
                            disabled={isSubmitting}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <Input
                          label="Exercise Name"
                          value={exercise.name}
                          onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                          placeholder="e.g., Bench Press"
                          required
                          disabled={isSubmitting}
                        />

                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            label="Sets"
                            type="number"
                            value={exercise.sets.toString()}
                            onChange={(e) => handleExerciseChange(index, 'sets', Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            disabled={isSubmitting}
                          />
                          <Input
                            label="Reps"
                            type="number"
                            value={exercise.reps.toString()}
                            onChange={(e) => handleExerciseChange(index, 'reps', Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            disabled={isSubmitting}
                          />
                          <Input
                            label="Weight (kg)"
                            type="number"
                            value={exercise.weight.toString()}
                            onChange={(e) => handleExerciseChange(index, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
                            min="0"
                            step="0.5"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Notes (optional)
                          </label>
                          <textarea
                            value={exercise.notes}
                            onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                            placeholder="Add notes about this exercise..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            rows={2}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Workout Notes */}
          {selectedType && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Workout Notes (optional)
              </label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="Add notes about this workout..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          )}
            </div>

          {/* Sticky Footer with Save Button */}
          {selectedType && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 z-10 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 mt-auto">
              <Button
                onClick={handleSaveWorkout}
                disabled={!isValid() || isSubmitting}
                fullWidth
                className="min-h-[48px]"
              >
                {isSubmitting ? 'Saving...' : 'Save Workout'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <WorkoutTypeModal
        isOpen={showWorkoutTypeModal}
        onClose={() => setShowWorkoutTypeModal(false)}
        onSelectWorkout={handleWorkoutTypeSelect}
      />
    </>
  )
}

export default AddWorkoutModal
