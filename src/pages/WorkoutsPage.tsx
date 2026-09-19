import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock, History, ListChecks } from 'lucide-react'
import type { Workout } from '../types'
import PageHeader from '../components/layout/PageHeader'
import ResumeWorkoutCard from '../components/workout/ResumeWorkoutCard'
import { getCurrentWorkout, getWorkouts } from '../services/workoutServiceFacade'
import { WORKOUT_TYPES, getNextWorkoutType } from '../constants/workoutTypes'
import { describeLastDone, getWorkoutTypeStats } from '../utils/workoutTypeStats'

function WorkoutsPage() {
  const navigate = useNavigate()
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null)
  const [history, setHistory] = useState<Workout[]>([])

  useEffect(() => {
    let cancelled = false
    getCurrentWorkout()
      .then((workout) => {
        if (!cancelled) setActiveWorkout(workout)
      })
      .catch((error) => console.warn('Could not check for active workout:', error))
    getWorkouts()
      .then((workouts) => {
        if (!cancelled) setHistory(workouts)
      })
      .catch((error) => console.warn('Could not load workout history:', error))
    return () => {
      cancelled = true
    }
  }, [])

  // Next day in the Push → Pull → Legs → Upper → Lower rotation
  const nextType = useMemo(() => getNextWorkoutType(history.find((w) => w.completed)?.type), [history])
  const statsByType = useMemo(
    () => new Map(WORKOUT_TYPES.map((type) => [type.id, getWorkoutTypeStats(history, type.id)])),
    [history]
  )

  return (
    <div className="min-h-full">
      <PageHeader title="Workouts" />

      <div className="px-4 pt-4 pb-6 space-y-4">
        {activeWorkout && <ResumeWorkoutCard workout={activeWorkout} />}

        <div className="space-y-3">
          {WORKOUT_TYPES.map((workout) => {
            const stats = statsByType.get(workout.id)
            const isNext = !activeWorkout && nextType === workout.id
            return (
              <button
                key={workout.id}
                type="button"
                onClick={() => navigate(`/workout/active?type=${workout.id}`)}
                className={`w-full text-left rounded-2xl bg-card p-4 flex items-center gap-4 transition-shadow hover:shadow-md active:scale-[0.99] ${
                  isNext ? 'ring-2 ring-primary-500' : 'border border-[var(--border-primary)]'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${workout.iconClass}`}>
                  <workout.Icon size={24} strokeWidth={2} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--text-primary)] text-lg">{workout.name}</h3>
                    {isNext && (
                      <span className="px-2 py-0.5 rounded-full bg-primary-500 text-on-primary text-xs font-semibold">
                        Next up
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm truncate">{workout.description}</p>
                  {stats && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <ListChecks size={13} />
                        {stats.exerciseCount} exercises
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Clock size={13} />~{stats.estimatedMinutes} min
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <History size={13} />
                        {stats.lastDone ? describeLastDone(stats.lastDone) : 'not done yet'}
                      </span>
                    </div>
                  )}
                </div>

                <ChevronRight size={20} className="text-[var(--text-inactive)] flex-shrink-0" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WorkoutsPage
