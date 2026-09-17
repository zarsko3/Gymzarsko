import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import type { WorkoutType } from '../types'
import WeeklyCalendar from '../components/home/WeeklyCalendar'
import WorkoutTypeModal from '../components/home/WorkoutTypeModal'
import Banner from '../components/home/Banner'
import NextWorkoutCard from '../components/home/NextWorkoutCard'
import WeeklySummary from '../components/home/WeeklySummary'
import MuscleGroupBars from '../components/home/MuscleGroupBars'
import RecentRecords from '../components/home/RecentRecords'
import ResumeWorkoutCard from '../components/workout/ResumeWorkoutCard'
import {
  getWeeklyProgress,
  getSetsPerMuscleGroup,
  getRecentPersonalRecords,
} from '../services/workoutAnalyticsService'
import { useWorkoutsSubscription } from '../hooks/useWorkoutsSubscription'
import { cleanUpAbandonedWorkouts } from '../services/workoutServiceFacade'
import { findActiveWorkout } from '../utils/workoutStatus'
import { WORKOUT_TYPES, getNextWorkoutType } from '../constants/workoutTypes'
import { useToast } from '../hooks/useToast'

// One full rotation: Push, Pull, Legs, Upper, Lower
const WEEKLY_GOAL = WORKOUT_TYPES.length

function HomePage() {
  const navigate = useNavigate()
  const today = new Date()
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const { workouts: allWorkouts, isLoading, error } = useWorkoutsSubscription()
  const { showToast } = useToast()

  // Close workouts left open from earlier sessions (once per visit)
  const hasCleanedUpRef = useRef(false)
  useEffect(() => {
    if (isLoading || error || hasCleanedUpRef.current) return
    hasCleanedUpRef.current = true
    cleanUpAbandonedWorkouts(allWorkouts)
  }, [isLoading, error, allWorkouts])

  const activeWorkout = useMemo(() => findActiveWorkout(allWorkouts), [allWorkouts])

  // Surface subscription errors
  useEffect(() => {
    if (error) {
      showToast('error', 'Unable to load workouts right now. Please try again.')
    }
  }, [error, showToast])

  const workoutDays = useMemo(
    () => allWorkouts.filter((w) => w.completed).map((w) => w.date),
    [allWorkouts]
  )

  const nextType = useMemo(() => {
    const lastCompleted = allWorkouts.find((w) => w.completed)
    return getNextWorkoutType(lastCompleted?.type)
  }, [allWorkouts])

  const weeklyProgress = useMemo(() => getWeeklyProgress(allWorkouts, WEEKLY_GOAL), [allWorkouts])
  const muscleGroups = useMemo(() => getSetsPerMuscleGroup(allWorkouts), [allWorkouts])
  const records = useMemo(() => getRecentPersonalRecords(allWorkouts), [allWorkouts])

  // Show loading state if needed
  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    )
  }

  const handleTodayClick = () => {
    setShowWorkoutModal(true)
  }

  const handleWorkoutSelect = (type: WorkoutType) => {
    navigate(`/workout/active?type=${type}`)
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-full">
      <div className="w-full max-w-full px-4 py-6 space-y-6">
        {/* Banner - Always shows rotating banners */}
        <Banner mode="random-banners" />

        {activeWorkout ? (
          <ResumeWorkoutCard workout={activeWorkout} />
        ) : (
          <NextWorkoutCard type={nextType} />
        )}

        {/* Date */}
        <p className="text-[var(--text-primary)] text-lg font-medium text-center">
          {format(today, 'EEEE, MMMM do')}
        </p>

        {/* Weekly Calendar */}
        <WeeklyCalendar
          workoutDays={workoutDays}
          currentDate={today}
          onTodayClick={handleTodayClick}
        />

        {/* Weekly progress */}
        <WeeklySummary progress={weeklyProgress} />

        {/* Training balance */}
        <MuscleGroupBars data={muscleGroups} />

        {/* Recent personal records */}
        <RecentRecords records={records} />

        <button
          onClick={() => navigate('/analytics')}
          className="w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-primary-500 hover:text-primary-600 min-h-[44px]"
          type="button"
        >
          See all stats
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Workout Type Selection Modal */}
      <WorkoutTypeModal
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        onSelectWorkout={handleWorkoutSelect}
      />
    </div>
  )
}

export default HomePage
