import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronLeft, Trash2, Clock, TrendingUp, Calendar, Dumbbell, Search, X, Flame, Activity, Plus, Edit2 } from 'lucide-react'
import type { Workout, WorkoutType } from '../types'
import { deleteWorkout, createWorkoutWithDate, updateWorkout } from '../services/workoutServiceFacade'
import { useToast } from '../hooks/useToast'
import { useWorkoutsSubscription } from '../hooks/useWorkoutsSubscription'
import { formatDuration, calculateVolume } from '../utils/formatters'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import WorkoutTypeModal from '../components/home/WorkoutTypeModal'
import AddWorkoutModal from '../components/history/AddWorkoutModal'
import EditWorkoutModal from '../components/history/EditWorkoutModal'

function HistoryPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false)
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const { workouts: subscribedWorkouts, isLoading, error } = useWorkoutsSubscription()
  const [workouts, setWorkouts] = useState<Workout[]>([])

  useEffect(() => {
    setWorkouts(subscribedWorkouts)
  }, [subscribedWorkouts])

  useEffect(() => {
    if (error) {
      showToast('error', 'Unable to load your workout history. Please try again.')
    }
  }, [error, showToast])
  const [filter, setFilter] = useState<'all' | 'push' | 'pull' | 'legs'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredWorkouts = workouts
    .filter(w => filter === 'all' || w.type === filter)
    .filter(w => {
      if (!searchQuery) return true
      
      const query = searchQuery.toLowerCase()
      const dateStr = format(w.date, 'EEEE, MMM d, yyyy').toLowerCase()
      const exerciseNames = w.exercises.map(ex => ex.exercise.name.toLowerCase()).join(' ')
      const workoutType = w.type.toLowerCase()
      
      return dateStr.includes(query) || exerciseNames.includes(query) || workoutType.includes(query)
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const workoutTypeInfo = {
    push: { name: 'Push', Icon: Dumbbell, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    pull: { name: 'Pull', Icon: Flame, color: 'bg-green-50 text-green-600 border-green-200' },
    legs: { name: 'Legs', Icon: Activity, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  }

  const handleDeleteWorkout = (workoutId: string) => {
    setShowDeleteConfirm(workoutId)
  }

  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm) return

    const workoutId = showDeleteConfirm
    setShowDeleteConfirm(null)

    try {
      // Optimistic update
      setWorkouts(workouts.filter(w => w.id !== workoutId))

      await deleteWorkout(workoutId)
      showToast('success', 'Workout deleted successfully')
    } catch (error) {
      console.error('Error deleting workout:', error)
      // Don't refetch - let real-time subscription sync the state
      // Just revert the optimistic update using subscribed data
      setWorkouts(subscribedWorkouts)
      showToast('error', 'Failed to delete workout. Please try again.')
    }
  }

  const handleEditWorkout = (workout: Workout) => {
    setSelectedWorkout(workout)
    setShowEditWorkoutModal(true)
  }

  const handleSaveWorkout = async (editedWorkout: Workout) => {
    try {
      // Optimistic update
      setWorkouts(workouts.map(w => w.id === editedWorkout.id ? editedWorkout : w))

      await updateWorkout(editedWorkout)
      showToast('success', 'Workout updated successfully ✅')
      setShowEditWorkoutModal(false)
      setSelectedWorkout(null)
    } catch (error) {
      console.error('Error updating workout:', error)
      // Don't refetch - let real-time subscription sync the state
      setWorkouts(subscribedWorkouts)
      showToast('error', 'Failed to update workout. Please try again.')
      throw error
    }
  }

  const handleAddWorkout = async (type: WorkoutType, date: Date) => {
    const tempId = `temp-${Date.now()}`
    try {
      // Optimistic update - add placeholder workout
      const placeholderWorkout: Workout = {
        id: tempId,
        type,
        date,
        startTime: date,
        exercises: [],
        completed: true,
        userId: '',
      }
      setWorkouts([placeholderWorkout, ...workouts].sort((a, b) => b.date.getTime() - a.date.getTime()))

      // Create workout in Firestore
      const newWorkout = await createWorkoutWithDate(type, date)
      
      // Replace placeholder with real workout
      setWorkouts(prev => 
        prev.map(w => w.id === tempId ? newWorkout : w)
          .sort((a, b) => b.date.getTime() - a.date.getTime())
      )
      
      showToast('success', 'Workout added successfully ✅')
    } catch (error) {
      console.error('Error adding workout:', error)
      // Revert optimistic update
      setWorkouts(prev => prev.filter(w => w.id !== tempId))
      showToast('error', 'Failed to add workout. Please try again.')
      throw error
    }
  }

  const getWorkoutStats = (workout: typeof workouts[0]) => {
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    const completedSets = workout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
      0
    )
    const totalVolume = workout.exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + calculateVolume(set.weight, set.reps), 0),
      0
    )
    return { totalSets, completedSets, totalVolume }
  }

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center py-8">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="min-h-full">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-lg font-semibold text-primary-600">History</h1>
            <div className="min-w-[44px]"></div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="max-w-sm w-full text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-mint flex items-center justify-center">
              <Dumbbell size={40} className="text-primary-500" strokeWidth={2} />
            </div>

            {/* Text Content */}
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              No Workout History Yet
            </h3>
            <p className="text-[var(--text-secondary)] mb-8 text-base leading-relaxed">
              Start logging workouts to track your progress and build your fitness journey
            </p>

            {/* CTA Button */}
            <Button 
              onClick={() => setShowWorkoutModal(true)}
              className="min-w-[200px] shadow-sm hover:shadow-md mx-auto"
              size="lg"
            >
              Start Your First Workout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-border-primary z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-primary-600">History</h1>
          <button 
            onClick={() => setShowAddWorkoutModal(true)}
            className="text-primary-500 hover:text-primary-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Add workout"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card text-center p-4">
            <div className="text-2xl font-bold text-primary-500">{workouts.length}</div>
            <div className="text-[var(--text-secondary)] text-xs mt-1">Total</div>
          </Card>
          <Card className="bg-card text-center p-4">
            <div className="text-2xl font-bold text-primary-500">
              {workouts.filter(w => w.type === 'push').length}
            </div>
            <div className="text-[var(--text-secondary)] text-xs mt-1">Push</div>
          </Card>
          <Card className="bg-card text-center p-4">
            <div className="text-2xl font-bold text-primary-500">
              {workouts.filter(w => w.type === 'pull').length}
            </div>
            <div className="text-[var(--text-secondary)] text-xs mt-1">Pull</div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search by date, exercise, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 border border-[var(--border-primary)] rounded-lg bg-card text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
            }`}
          >
            All Workouts
          </button>
          <button
            onClick={() => setFilter('push')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              filter === 'push'
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
            }`}
          >
            <Dumbbell size={16} strokeWidth={2} />
            Push
          </button>
          <button
            onClick={() => setFilter('pull')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              filter === 'pull'
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
            }`}
          >
            <Flame size={16} strokeWidth={2} />
            Pull
          </button>
          <button
            onClick={() => setFilter('legs')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              filter === 'legs'
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
            }`}
          >
            <Activity size={16} strokeWidth={2} />
            Legs
          </button>
        </div>

        {/* Results Count */}
        {filteredWorkouts.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Showing {filteredWorkouts.length} {filteredWorkouts.length === 1 ? 'workout' : 'workouts'}
              {(searchQuery || filter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilter('all')
                  }}
                  className="ml-2 text-primary-500 font-medium hover:text-primary-600"
                >
                  Clear filters
                </button>
              )}
            </p>
          </div>
        )}

        {/* Workout List */}
        <div className="space-y-3">
          {filteredWorkouts.length === 0 && (
            <Card className="text-center py-12 bg-accent-mint">
              <Search size={48} className="mx-auto text-primary-500 mb-3" strokeWidth={1.5} />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                No Workouts Found
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                {searchQuery ? `No workouts match "${searchQuery}"` : 'Try adjusting your filters'}
              </p>
              {(searchQuery || filter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilter('all')
                  }}
                  className="mt-4 text-primary-500 font-medium hover:text-primary-600"
                >
                  Clear Filters
                </button>
              )}
            </Card>
          )}
          
          {filteredWorkouts.map((workout) => {
            const stats = getWorkoutStats(workout)
            const duration = workout.startTime && workout.endTime
              ? formatDuration(workout.startTime, workout.endTime)
              : 'N/A'
            const typeInfo = workoutTypeInfo[workout.type]

            return (
              <Card
                key={workout.id}
                onClick={() => navigate(`/workout/detail/${workout.id}`)}
                className="bg-card hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full border ${typeInfo.color} font-medium text-sm flex items-center gap-1.5`}>
                        <typeInfo.Icon size={14} strokeWidth={2} />
                        {typeInfo.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditWorkout(workout)
                        }}
                        className="text-primary-500 hover:text-primary-600 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                        aria-label="Edit workout"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteWorkout(workout.id)
                        }}
                        className="text-red-500 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                        aria-label="Delete workout"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                    <Calendar size={16} />
                    <span>{format(workout.date, 'EEEE, MMM d, yyyy')}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[var(--border-primary)]">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[var(--text-secondary)] text-xs mb-1">
                        <Clock size={14} />
                        <span>Duration</span>
                      </div>
                      <div className="font-semibold text-[var(--text-primary)]">{duration}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[var(--text-secondary)] text-xs mb-1">
                        <Dumbbell size={14} />
                        <span>Sets</span>
                      </div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {stats.completedSets}/{stats.totalSets}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[var(--text-secondary)] text-xs mb-1">
                        <TrendingUp size={14} />
                        <span>Volume</span>
                      </div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {Math.round(stats.totalVolume)} kg
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Workout Type Selection Modal */}
      <WorkoutTypeModal
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        onSelectWorkout={(type: WorkoutType) => {
          navigate(`/workout/active?type=${type}`)
        }}
      />

      {/* Add Workout Modal */}
      <AddWorkoutModal
        isOpen={showAddWorkoutModal}
        onClose={() => setShowAddWorkoutModal(false)}
        onSave={handleAddWorkout}
      />

      {/* Edit Workout Modal */}
      <EditWorkoutModal
        isOpen={showEditWorkoutModal}
        onClose={() => {
          setShowEditWorkoutModal(false)
          setSelectedWorkout(null)
        }}
        workout={selectedWorkout}
        onSave={handleSaveWorkout}
      />

      {/* Delete Workout Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Workout?"
        size="sm"
      >
        <ConfirmDialog
          title="Delete Workout?"
          message="Are you sure you want to delete this workout? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          icon="delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      </Modal>
    </div>
  )
}

export default HistoryPage
