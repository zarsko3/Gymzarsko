import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, subDays, startOfWeek, isWithinInterval } from 'date-fns'
import { motion, useReducedMotion } from 'framer-motion'
import type { Workout, WorkoutType } from '../types'
import WeeklyCalendar from '../components/home/WeeklyCalendar'
import MotivationalCard from '../components/home/MotivationalCard'
import StatCard from '../components/home/StatCard'
import AnimatedChart from '../components/home/AnimatedChart'
import WorkoutTypeModal from '../components/home/WorkoutTypeModal'
import { getWorkouts, subscribeToWorkouts } from '../services/workoutServiceFacade'
import { calculateVolume } from '../utils/formatters'

function HomePage() {
  const navigate = useNavigate()
  const today = new Date()
  const shouldReduceMotion = useReducedMotion() ?? false
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Generate random banner on each mount - use lazy initialization to ensure true randomness
  // This runs once per component mount, ensuring a fresh random selection on each page load
  const [randomBanner] = useState(() => {
    const banners = ['/Baner1.svg', '/Baner2.svg']
    const randomIndex = Math.floor(Math.random() * banners.length)
    return banners[randomIndex]
  })
  
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
      <div className="min-h-full flex items-center justify-center">
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
    <div className="w-full max-w-full overflow-x-hidden min-h-full">
      <div className="w-full max-w-full px-4 py-6 space-y-6">
        {/* Banner Logo */}
        {isRestDay ? (
          <motion.div 
            className="flex justify-center items-center my-6"
            initial={shouldReduceMotion ? {} : { scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: 'transform, opacity' }}
          >
            <img 
              src="/Logo.png" 
              alt="Gymzarsko Logo" 
              className="max-w-full md:w-[576px] w-[448px] h-auto mx-auto block"
              style={{ objectFit: 'contain' }}
              role="img"
              aria-label="Gymzarsko Logo"
            />
          </motion.div>
        ) : (
          <motion.div 
            className="flex justify-center items-center my-6 w-full max-w-full"
            initial={shouldReduceMotion ? {} : { scale: 0.96, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              ...(shouldReduceMotion ? {} : { y: [0, 2, 0] }),
            }}
            transition={shouldReduceMotion ? { duration: 0 } : {
              scale: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
              y: { duration: 6, repeat: Infinity, ease: [0.42, 0, 0.58, 1] },
            }}
            style={{ willChange: 'transform, opacity' }}
          >
            <motion.img 
              key={randomBanner}
              src={randomBanner} 
              alt="Gymzarsko Banner" 
              className="w-[90%] sm:w-[85%] md:w-[80%] max-w-[576px] h-auto mx-auto block"
              style={{ 
                objectFit: 'contain',
                width: 'clamp(240px, 85vw, 576px)',
              }}
              role="img"
              aria-label="Gymzarsko Banner"
            />
          </motion.div>
        )}

        {/* Motivational Card */}
        {isRestDay && <MotivationalCard />}

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
              chart={<AnimatedChart data={workoutChartData} type="area" color="#10B981" />}
            />
            <StatCard
              title="Total Volume (kg)"
              value={totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : Math.round(totalVolume)}
              chart={<AnimatedChart data={volumeChartData} type="line" color="#10B981" />}
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
