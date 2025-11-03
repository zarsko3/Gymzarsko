import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, subDays, startOfWeek, isWithinInterval } from 'date-fns'
import { Flame } from 'lucide-react'
import type { Workout, WorkoutType } from '../types'
import WeeklyCalendar from '../components/home/WeeklyCalendar'
import MotivationalCard from '../components/home/MotivationalCard'
import StatCard from '../components/home/StatCard'
import MiniChart from '../components/home/MiniChart'
import Button from '../components/ui/Button'
import WorkoutTypeModal from '../components/home/WorkoutTypeModal'
import { getWorkouts, subscribeToWorkouts } from '../services/workoutServiceFacade'
import { calculateVolume } from '../utils/formatters'

function HomePage() {
  const navigate = useNavigate()
  const today = new Date()
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Subscribe to workout data for real-time updates
  useEffect(() => {
    setIsLoading(true)
    // Use real-time listener
    const unsubscribe = subscribeToWorkouts((workouts) => {
      setAllWorkouts(workouts)
      setIsLoading(false)
    })
    
    return () => {
      unsubscribe()
    }
  }, [])
  const weekStart = startOfWeek(today, { weekStartsOn: 0 }) // Start on Sunday (U.S. calendar)
  const weekEnd = addDays(weekStart, 6)
  
  const thisWeekWorkouts = allWorkouts.filter(w => 
    isWithinInterval(w.date, { start: weekStart, end: weekEnd })
  )
  
  const workoutDays = allWorkouts.map(w => w.date)
  const isRestDay = thisWeekWorkouts.length === 0 || 
    !thisWeekWorkouts.some(w => format(w.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))

  // Calculate stats
  const totalWorkouts = thisWeekWorkouts.length
  const totalVolume = allWorkouts.reduce((sum, workout) => {
    return sum + workout.exercises.reduce((exSum, exercise) => {
      return exSum + exercise.sets.reduce((setSum, set) => {
        return setSum + calculateVolume(set.weight, set.reps)
      }, 0)
    }, 0)
  }, 0)

  // Create chart data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i))
  const workoutChartData = last7Days.map(day => {
    const dayWorkouts = allWorkouts.filter(w => 
      format(w.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    )
    return dayWorkouts.length
  })
  
  const volumeChartData = last7Days.map(day => {
    const dayWorkouts = allWorkouts.filter(w => 
      format(w.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    )
    return Math.round(dayWorkouts.reduce((sum, workout) => {
      return sum + workout.exercises.reduce((exSum, exercise) => {
        return exSum + exercise.sets.reduce((setSum, set) => {
          return setSum + calculateVolume(set.weight, set.reps)
        }, 0)
      }, 0)
    }, 0))
  })

  // Show loading state if needed
  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 max-w-full overflow-x-hidden flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
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
    <div className="min-h-screen pb-20 max-w-full overflow-x-hidden">
      <div className="w-full max-w-full px-4 py-6 space-y-6">
        {/* Workout Status */}
        <div className="text-center pt-2">
          {isRestDay ? (
            <div className="flex justify-center items-center">
              <img 
                src="/Logo.png" 
                alt="Gymzarsko Logo" 
                className="w-32 h-auto max-w-[150px] sm:max-w-[200px]"
              />
            </div>
          ) : (
            <h2 className="text-4xl font-bold text-text-primary tracking-tight">
              PUSH DAY
            </h2>
          )}
        </div>

        {/* Motivational Card */}
        {isRestDay ? (
          <MotivationalCard />
        ) : (
          <div className="space-y-3">
            <Button
              fullWidth
              size="lg"
              onClick={() => setShowWorkoutModal(true)}
            >
              <Flame size={20} strokeWidth={2} />
              Start Today's Workout
            </Button>
          </div>
        )}

        {/* Date */}
        <p className="text-text-secondary text-base text-center">
          {format(today, 'EEEE, MMMM do')}
        </p>

        {/* Weekly Calendar */}
        <WeeklyCalendar 
          workoutDays={workoutDays}
          currentDate={today}
          onTodayClick={handleTodayClick}
        />

        {/* Stats Snapshot */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text-primary">Stats Snapshot</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Workouts Logged"
              value={totalWorkouts}
              chart={<MiniChart data={workoutChartData} type="area" />}
            />
            <StatCard
              title="Total Volume (kg)"
              value={totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : Math.round(totalVolume)}
              chart={<MiniChart data={volumeChartData} type="line" />}
            />
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-primary-500">{allWorkouts.length}</div>
            <div className="text-text-secondary text-sm mt-1">Total Workouts</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-primary-500">
              {totalWorkouts > 0 ? Math.round((totalWorkouts / 7) * 100) : 0}%
            </div>
            <div className="text-text-secondary text-sm mt-1">This Week</div>
          </div>
        </div>
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
