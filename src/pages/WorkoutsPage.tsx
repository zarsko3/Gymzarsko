import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Workout, WorkoutType } from '../types'
import Card from '../components/ui/Card'
import PageHeader from '../components/layout/PageHeader'
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
      <PageHeader title="Workouts" />

      <div className="px-4 py-6 space-y-6">
        {activeWorkout && <ResumeWorkoutCard workout={activeWorkout} />}

        <p className="text-[var(--text-secondary)]">Choose your workout for today</p>

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
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${workout.iconClass}`}>
                    <workout.Icon size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-lg flex items-center gap-2">
                      {workout.name}
                      {!activeWorkout && nextType === workout.id && (
                        <span className="px-2 py-0.5 rounded-full bg-primary-500 text-on-primary text-xs font-semibold">
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
