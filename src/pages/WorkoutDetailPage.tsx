import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { ChevronLeft, Clock, Calendar, TrendingUp, Trash2, CheckCircle, FileText, MessageSquare, Save, X } from 'lucide-react'
import type { Workout } from '../types'
import { getWorkoutById, deleteWorkout, updateWorkout } from '../services/workoutServiceFacade'
import { formatDuration, calculateVolume } from '../utils/formatters'
import { useToast } from '../hooks/useToast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

function WorkoutDetailPage() {
  const navigate = useNavigate()
  const { workoutId } = useParams<{ workoutId: string }>()
  const { showToast } = useToast()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [editedWorkout, setEditedWorkout] = useState<Workout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedExerciseNotes, setExpandedExerciseNotes] = useState<Set<number>>(new Set())
  const [showWorkoutNotes, setShowWorkoutNotes] = useState(false)
  
  useEffect(() => {
    async function loadWorkout() {
      if (!workoutId) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        const fetchedWorkout = await getWorkoutById(workoutId)
        if (fetchedWorkout) {
          // Normalize dates
          const normalizedDate = fetchedWorkout.date instanceof Timestamp
            ? fetchedWorkout.date.toDate()
            : typeof fetchedWorkout.date === 'string'
              ? new Date(fetchedWorkout.date)
              : fetchedWorkout.date instanceof Date
                ? fetchedWorkout.date
                : new Date()
          
          const normalizedStartTime = fetchedWorkout.startTime instanceof Timestamp
            ? fetchedWorkout.startTime.toDate()
            : typeof fetchedWorkout.startTime === 'string'
              ? new Date(fetchedWorkout.startTime)
              : fetchedWorkout.startTime instanceof Date
                ? fetchedWorkout.startTime
                : undefined
          
          const normalizedEndTime = fetchedWorkout.endTime instanceof Timestamp
            ? fetchedWorkout.endTime.toDate()
            : typeof fetchedWorkout.endTime === 'string'
              ? new Date(fetchedWorkout.endTime)
              : fetchedWorkout.endTime instanceof Date
                ? fetchedWorkout.endTime
                : undefined
          
          const normalizedWorkout = {
            ...fetchedWorkout,
            date: normalizedDate,
            startTime: normalizedStartTime,
            endTime: normalizedEndTime,
          }
          
          setWorkout(normalizedWorkout)
          setEditedWorkout(JSON.parse(JSON.stringify(normalizedWorkout)))
          setShowWorkoutNotes(!!normalizedWorkout.notes)
        } else {
          setWorkout(null)
        }
      } catch (error) {
        console.error('Error loading workout:', error)
        setWorkout(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadWorkout()
  }, [workoutId])

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

  const toggleExerciseNotes = (exerciseIndex: number) => {
    const newExpanded = new Set(expandedExerciseNotes)
    if (newExpanded.has(exerciseIndex)) {
      newExpanded.delete(exerciseIndex)
    } else {
      newExpanded.add(exerciseIndex)
    }
    setExpandedExerciseNotes(newExpanded)
  }

  const handleSave = async () => {
    if (!editedWorkout) return

    setIsSubmitting(true)
    try {
      await updateWorkout(editedWorkout)
      setWorkout(editedWorkout)
      showToast('success', 'Workout updated ✅')
    } catch (error) {
      console.error('Error saving workout:', error)
      showToast('error', 'Failed to save workout. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (workout) {
      setEditedWorkout(JSON.parse(JSON.stringify(workout)))
      setExpandedExerciseNotes(new Set())
      setShowWorkoutNotes(!!workout.notes)
    }
  }

  const handleDelete = async () => {
    if (!workout) return
    
    if (confirm('Are you sure you want to delete this workout? This cannot be undone.')) {
      try {
        await deleteWorkout(workout.id)
        showToast('success', 'Workout deleted')
        navigate('/history')
      } catch (error) {
        console.error('Error deleting workout:', error)
        showToast('error', 'Failed to delete workout. Please try again.')
      }
    }
  }

  const hasChanges = () => {
    if (!workout || !editedWorkout) return false
    return JSON.stringify(workout) !== JSON.stringify(editedWorkout)
  }

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center px-4">
        <div className="text-text-secondary">Loading workout...</div>
      </div>
    )
  }

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

  const displayWorkout = editedWorkout || workout
  if (!displayWorkout) return null

  const totalSets = displayWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const completedSets = displayWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
    0
  )
  const totalVolume = displayWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + calculateVolume(set.weight, set.reps), 0),
    0
  )
  const duration = displayWorkout.startTime && displayWorkout.endTime
    ? formatDuration(displayWorkout.startTime, displayWorkout.endTime)
    : 'N/A'

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
          <div className="flex items-center gap-2">
            {hasChanges() && (
              <button
                onClick={handleCancel}
                className="text-text-secondary hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cancel changes"
              >
                <X size={20} />
              </button>
            )}
            <button 
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Delete workout"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Workout Type Badge */}
        <div className="flex items-center justify-center gap-3">
          <div className={`px-6 py-3 rounded-full border-2 ${workoutTypeColors[displayWorkout.type]} font-semibold text-lg`}>
            {workoutTypeNames[displayWorkout.type]}
          </div>
          {displayWorkout.completed && (
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
                  {format(displayWorkout.date, 'EEEE, MMMM d, yyyy')}
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
            <div className="text-2xl font-bold text-primary-500">{displayWorkout.exercises.length}</div>
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
          {displayWorkout.exercises.map((exercise, index) => {
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
                  <div className="space-y-1.5 overflow-x-hidden">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary pb-1 border-b">
                      <div className="w-8 flex-shrink-0 text-center">SET</div>
                      <div className="flex-1 min-w-0 text-center">WEIGHT</div>
                      <div className="flex-1 min-w-0 text-center">REPS</div>
                      <div className="w-14 flex-shrink-0 text-center">VOL</div>
                    </div>

                    {exercise.sets.map((set, setIndex) => (
                      <div 
                        key={set.id}
                        className={`flex items-center gap-1.5 py-2 ${
                          set.completed ? 'bg-primary-50 rounded-lg px-2' : ''
                        }`}
                      >
                        <div className="w-8 flex-shrink-0 text-center text-sm font-medium text-text-primary">
                          {setIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-1">
                          <input
                            type="number"
                            value={set.weight || ''}
                            onChange={(e) =>
                              handleSetChange(index, setIndex, 'weight', parseFloat(e.target.value) || 0)
                            }
                            className="flex-1 min-w-0 px-1.5 py-1.5 border border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            disabled={isSubmitting}
                            step="0.5"
                            min="0"
                            placeholder="0"
                          />
                          <span className="text-xs text-text-secondary flex-shrink-0">kg</span>
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-1">
                          <input
                            type="number"
                            value={set.reps || ''}
                            onChange={(e) =>
                              handleSetChange(index, setIndex, 'reps', parseInt(e.target.value) || 0)
                            }
                            className="flex-1 min-w-0 px-1.5 py-1.5 border border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            disabled={isSubmitting}
                            min="0"
                            placeholder="0"
                          />
                          <span className="text-xs text-text-secondary flex-shrink-0">reps</span>
                        </div>
                        <div className="w-14 flex-shrink-0 text-center text-xs text-text-secondary">
                          {calculateVolume(set.weight, set.reps)}
                        </div>
                      </div>
                    ))}

                    {/* Exercise Total */}
                    <div className="flex items-center gap-1.5 pt-2 border-t">
                      <div className="w-8 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0 text-sm font-medium text-text-secondary">
                        Total:
                      </div>
                      <div className="w-14 flex-shrink-0 text-center font-bold text-primary-500 text-sm">
                        {Math.round(exerciseVolume)}
                      </div>
                    </div>
                  </div>

                  {/* Exercise Notes */}
                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={() => toggleExerciseNotes(index)}
                      className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm font-medium w-full mb-2"
                    >
                      <MessageSquare size={16} />
                      <span>{exercise.notes ? 'Edit Notes' : 'Add Notes'}</span>
                      {exercise.notes && (
                        <span className="ml-auto text-primary-500">✓</span>
                      )}
                    </button>
                    {expandedExerciseNotes.has(index) && (
                      <textarea
                        value={exercise.notes || ''}
                        onChange={(e) => handleExerciseNotesChange(index, e.target.value)}
                        placeholder="Add notes about this exercise..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={2}
                        disabled={isSubmitting}
                      />
                    )}
                    {!expandedExerciseNotes.has(index) && exercise.notes && (
                      <div className="text-text-primary whitespace-pre-wrap text-sm">
                        {exercise.notes}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Workout Notes */}
        <Card className="bg-accent-mint">
          <div className="flex items-start gap-3">
            <FileText size={20} className="text-primary-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <button
                onClick={() => setShowWorkoutNotes(!showWorkoutNotes)}
                className="flex items-center gap-2 text-text-primary hover:text-primary-500 transition-colors font-semibold w-full mb-2"
              >
                <span>Workout Notes</span>
                {displayWorkout.notes && (
                  <span className="ml-auto text-primary-500">✓</span>
                )}
              </button>
              {showWorkoutNotes && (
                <textarea
                  value={displayWorkout.notes || ''}
                  onChange={(e) => handleWorkoutNotesChange(e.target.value)}
                  placeholder="Add overall notes for this workout..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isSubmitting}
                />
              )}
              {!showWorkoutNotes && displayWorkout.notes && (
                <p className="text-text-primary whitespace-pre-wrap">
                  {displayWorkout.notes}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          {hasChanges() && (
            <Button
              fullWidth
              onClick={handleSave}
              disabled={isSubmitting}
              size="lg"
            >
              <Save size={20} />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
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

