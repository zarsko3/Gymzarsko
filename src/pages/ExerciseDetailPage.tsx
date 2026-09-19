import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronLeft, Info, Trophy } from 'lucide-react'
import type { Workout } from '../types'
import { getWorkouts } from '../services/workoutServiceFacade'
import { findBuiltInExercise } from '../constants/exerciseLibrary'
import { toDateSafe } from '../utils/formatters'
import { estimateOneRepMax, getExerciseStrengthSeries } from '../utils/progressStats'
import StrengthChart from '../components/progress/StrengthChart'
import ExerciseHowToSheet from '../components/workout/ExerciseHowToSheet'

interface Session {
  workoutId: string
  date: Date
  sets: Array<{ weight: number; reps: number }>
  best: { weight: number; reps: number }
}

/** Progress for one exercise. The route param is a library id or an exercise name. */
function ExerciseDetailPage() {
  const navigate = useNavigate()
  const { exerciseId = '' } = useParams<{ exerciseId: string }>()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showHowTo, setShowHowTo] = useState(false)

  const key = decodeURIComponent(exerciseId)
  const builtIn = findBuiltInExercise(key)
  const name = builtIn?.name ?? key

  useEffect(() => {
    let cancelled = false
    getWorkouts()
      .then((all) => {
        if (!cancelled) setWorkouts(all)
      })
      .catch((error) => console.error('Error loading exercise history:', error))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const sessions = useMemo<Session[]>(() => {
    const lower = name.toLowerCase()
    return workouts
      .filter((workout) => workout.completed)
      .map((workout) => {
        const sets = workout.exercises
          .filter((exercise) => exercise.exercise.name.toLowerCase() === lower)
          .flatMap((exercise) => exercise.sets)
          .filter((set) => set.completed && set.weight > 0 && set.reps > 0)
          .map((set) => ({ weight: set.weight, reps: set.reps }))
        const date = toDateSafe(workout.date)
        if (sets.length === 0 || !date) return null
        const best = sets.reduce((top, set) => (set.weight > top.weight || (set.weight === top.weight && set.reps > top.reps) ? set : top))
        return { workoutId: workout.id, date, sets, best }
      })
      .filter((session): session is Session => session !== null)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [workouts, name])

  const series = useMemo(() => getExerciseStrengthSeries(workouts, name), [workouts, name])

  const latestExercise = workouts
    .flatMap((workout) => workout.exercises)
    .find((exercise) => exercise.exercise.name.toLowerCase() === name.toLowerCase())
  const muscleGroup = builtIn?.muscleGroup ?? latestExercise?.exercise.muscleGroup ?? ''
  const repRange = builtIn?.repRange ?? latestExercise?.exercise.repRange

  const current = series.at(-1)?.oneRepMax ?? 0
  const first = series[0]
  const gained = first ? Math.round((current - first.oneRepMax) * 2) / 2 : 0
  const bestSession = sessions.reduce<Session | null>(
    (top, session) =>
      !top || session.best.weight > top.best.weight || (session.best.weight === top.best.weight && session.best.reps > top.best.reps)
        ? session
        : top,
    null
  )

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
        <div className="flex items-center justify-between px-2 min-h-[56px]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-2 min-h-[44px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <button
            type="button"
            onClick={() => setShowHowTo(true)}
            className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg text-sm font-medium text-primary-600 dark:text-primary-500"
          >
            <Info size={16} />
            How to
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            {muscleGroup}
            {repRange && ` · ${repRange} reps`}
          </p>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{name}</h1>
        </div>

        {isLoading ? (
          <p className="text-center text-[var(--text-secondary)] py-12">Loading...</p>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl bg-card p-6 text-center">
            <p className="font-medium text-[var(--text-primary)]">No sessions yet</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Mark sets as done during a workout and your progress shows up here.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-card p-4">
                <p className="text-xs text-[var(--text-secondary)]">Estimated 1RM</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{current} kg</p>
                {series.length > 1 && first && (
                  <p className={`text-xs font-medium mt-0.5 ${gained > 0 ? 'text-green-600 dark:text-green-400' : gained < 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                    {gained > 0 ? '+' : gained < 0 ? '−' : '±'}
                    {Math.abs(gained)} kg since {format(first.date, 'MMM d')}
                  </p>
                )}
              </div>
              {bestSession && (
                <div className="rounded-2xl bg-card p-4">
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Trophy size={12} />
                    Best set
                  </p>
                  <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {bestSession.best.weight} × {bestSession.best.reps}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{format(bestSession.date, 'MMM d, yyyy')}</p>
                </div>
              )}
            </div>

            {series.length > 1 && (
              <section className="rounded-2xl bg-card p-4">
                <h2 className="font-semibold text-[var(--text-primary)] mb-2">Estimated 1RM over time</h2>
                <StrengthChart points={series} />
              </section>
            )}

            <section>
              <h2 className="font-semibold text-[var(--text-primary)] mb-2 px-1">
                Sessions <span className="text-[var(--text-secondary)] font-normal text-sm">· {sessions.length}</span>
              </h2>
              <div className="space-y-2">
                {sessions.map((session) => {
                  const isBest = session === bestSession
                  return (
                    <div key={session.workoutId} className="rounded-xl bg-card px-4 py-3 flex items-start justify-between gap-3">
                      <div className="flex-shrink-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                          {format(session.date, 'MMM d')}
                          {isBest && <Trophy size={13} className="text-amber-500" aria-label="Best set" />}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          ~{estimateOneRepMax(session.best.weight, session.best.reps)} kg 1RM
                        </p>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] text-right tabular-nums">
                        {session.sets.map((set) => `${set.weight}×${set.reps}`).join(' · ')}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>

      <ExerciseHowToSheet
        exercise={showHowTo ? { id: builtIn?.id ?? name, name, muscleGroup } : null}
        onClose={() => setShowHowTo(false)}
      />
    </div>
  )
}

export default ExerciseDetailPage
