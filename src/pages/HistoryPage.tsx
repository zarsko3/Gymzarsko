import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronLeft, MoreVertical, Clock, TrendingUp, Calendar, Dumbbell, Search, X, Flame, Activity, Plus, Edit2 } from 'lucide-react'
import type { Workout, WorkoutType } from '../types'
import { getWorkouts, deleteWorkout, subscribeToWorkouts, createWorkoutWithDate, updateWorkout } from '../services/workoutServiceFacade'
import { useToast } from '../hooks/useToast'
import { formatDuration, calculateVolume } from '../utils/formatters'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import WorkoutTypeModal from '../components/home/WorkoutTypeModal'
import AddWorkoutModal from '../components/history/AddWorkoutModal'

function HistoryPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to workout data for real-time updates
  useEffect(() => {
    setIsLoading(true)
    // Use real-time listener
    const unsubscribe = subscribeToWorkouts((workouts) => {
      setWorkouts(workouts)
      setIsLoading(false)
    })
    
    return () => {
      unsubscribe()
    }
  }, [])
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

  const handleDeleteWorkout = async (workoutId: string) => {
    if (confirm('Are you sure you want to delete this workout? This cannot be undone.')) {
      try {
        // Optimistic update
        const previousWorkouts = [...workouts]
        setWorkouts(workouts.filter(w => w.id !== workoutId))
        
        await deleteWorkout(workoutId)
        showToast('success', 'Workout deleted successfully')
      } catch (error) {
        console.error('Error deleting workout:', error)
        // Revert optimistic update
        const fetchedWorkouts = await getWorkouts()
        setWorkouts(fetchedWorkouts)
        showToast('error', 'Failed to delete workout. Please try again.')
      }
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

  const handleEditWorkout = (workout: Workout) => {
    navigate(`/workout/detail/${workout.id}`)
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
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="min-h-full">
        {/* Header */}
        <div className="sticky top-0 bg-primary border-b border-border-primary z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-lg font-semibold text-primary-600">History</h1>
            <button className="text-text-secondary hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center">
              <MoreVertical size={24} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="max-w-sm w-full text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-mint flex items-center justify-center">
              <Dumbbell size={40} className="text-primary-500" strokeWidth={2} />
            </div>

            {/* Text Content */}
            <h3 className="text-2xl font-bold text-text-primary mb-3">
              No Workout History Yet
            </h3>
            <p className="text-text-secondary mb-8 text-base leading-relaxed">
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
      <div className="sticky top-0 bg-primary border-b border-border-primary z-10">
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
            <div className="text-text-secondary text-xs mt-1">Total</div>
          </Card>
          <Card className="bg-card text-center p-4">
            <div className="text-2xl font-bold text-primary-500">
              {workouts.filter(w => w.type === 'push').length}
            </div>
            <div className="text-text-secondary text-xs mt-1">Push</div>
          </Card>
          <Card className="bg-card text-center p-4">
            <div className="text-2xl font-bold text-primary-500">
              {workouts.filter(w => w.type === 'pull').length}
            </div>
            <div className="text-text-secondary text-xs mt-1">Pull</div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by date, exercise, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
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
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            All Workouts
          </button>
          <button
            onClick={() => setFilter('push')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              filter === 'push'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
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
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
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
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <Activity size={16} strokeWidth={2} />
            Legs
          </button>
        </div>

        {/* Results Count */}
        {filteredWorkouts.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
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
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No Workouts Found
              </h3>
              <p className="text-text-secondary text-sm">
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
                        className="text-text-secondary hover:text-primary-500 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                        aria-label="Edit workout"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteWorkout(workout.id)
                        }}
                        className="text-text-secondary hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                        aria-label="Delete workout"
                      >
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <Calendar size={16} />
                    <span>{format(workout.date, 'EEEE, MMM d, yyyy')}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border-primary">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-text-secondary text-xs mb-1">
                        <Clock size={14} />
                        <span>Duration</span>
                      </div>
                      <div className="font-semibold text-text-primary">{duration}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-text-secondary text-xs mb-1">
                        <Dumbbell size={14} />
                        <span>Sets</span>
                      </div>
                      <div className="font-semibold text-text-primary">
                        {stats.completedSets}/{stats.totalSets}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-text-secondary text-xs mb-1">
                        <TrendingUp size={14} />
                        <span>Volume</span>
                      </div>
                      <div className="font-semibold text-text-primary">
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

    </div>
  )
}

export default HistoryPage
