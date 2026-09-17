import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { Workout, WorkoutType } from '../types'
import Card from '../components/ui/Card'
import ResumeWorkoutCard from '../components/workout/ResumeWorkoutCard'
import { getCurrentWorkout, getWorkouts } from '../services/workoutServiceFacade'
import { WORKOUT_TYPES, getNextWorkoutType } from '../constants/workoutTypes'

function WorkoutsPage() {
  const navigate = useNavigate()
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null)
  const [nextType, setNextType] = useState<WorkoutType | null>(null)

  useEffect(() => {
    let cancelled = false
    getCurrentWorkout()
      .then((workout) => {
        if (!cancelled) setActiveWorkout(workout)
      })
      .catch((error) => console.warn('Could not check for active workout:', error))
    // Suggest the next day in the Push → Pull → Legs → Upper → Lower rotation
    getWorkouts()
      .then((workouts) => {
        const lastCompleted = workouts.find((w) => w.completed)
        if (!cancelled) setNextType(getNextWorkoutType(lastCompleted?.type))
      })
      .catch((error) => console.warn('Could not load workout history:', error))
    return () => {
      cancelled = true
    }
  }, [])

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
          <h1 className="text-lg font-semibold text-primary-600">Workouts</h1>
          <div className="min-w-[44px]" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {activeWorkout && <ResumeWorkoutCard workout={activeWorkout} />}

        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Select Workout Type</h2>
          <p className="text-[var(--text-secondary)] mt-1">Choose your workout for today</p>
        </div>

        {/* Workout Type Cards */}
        <div className="space-y-3">
          {WORKOUT_TYPES.map((workout) => (
            <Card
              key={workout.id}
              onClick={() => navigate(`/workout/active?type=${workout.id}`)}
              className={`${workout.cardClass} border-2 hover:shadow-md transition-all cursor-pointer`}
            >
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <workout.Icon size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-lg flex items-center gap-2">
                      {workout.name}
                      {!activeWorkout && nextType === workout.id && (
                        <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-semibold">
                          Next up
                        </span>
                      )}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                      {workout.description}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WorkoutsPage
