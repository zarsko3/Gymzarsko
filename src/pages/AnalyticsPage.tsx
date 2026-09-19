import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Sparkline from '../components/progress/Sparkline'
import VolumeBars from '../components/progress/VolumeBars'
import ConsistencyGrid from '../components/progress/ConsistencyGrid'
import { useWorkoutsSubscription } from '../hooks/useWorkoutsSubscription'
import { useToast } from '../hooks/useToast'
import { WORKOUT_TYPES } from '../constants/workoutTypes'
import {
  PERIOD_LABELS,
  getStrengthTrends,
  getVolumeBuckets,
  getWeeklyCounts,
  isStalled,
  summarizePeriod,
  type ProgressPeriod,
} from '../utils/progressStats'

const WEEKLY_GOAL = WORKOUT_TYPES.length
const STRENGTH_PREVIEW = 6

function formatVolume(kg: number) {
  if (kg >= 10000) return `${Math.round(kg / 1000)}k`
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`
  return `${Math.round(kg)}`
}

function Delta({ current, previous, percent = false }: { current: number; previous: number; percent?: boolean }) {
  if (previous === 0 && current === 0) return <span className="text-[var(--text-inactive)]">—</span>
  const diff = current - previous
  const text = percent
    ? previous > 0 ? `${diff >= 0 ? '+' : '−'}${Math.abs(Math.round((diff / previous) * 100))}%` : 'new'
    : `${diff >= 0 ? '+' : '−'}${Math.abs(diff)}`
  const tone = diff > 0 ? 'text-green-600 dark:text-green-400' : diff < 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'
  return <span className={tone}>{text}</span>
}

function ProgressPage() {
  const navigate = useNavigate()
  const { workouts, isLoading, error } = useWorkoutsSubscription()
  const { showToast } = useToast()
  const [period, setPeriod] = useState<ProgressPeriod>('4w')
  const [showAllLifts, setShowAllLifts] = useState(false)

  useEffect(() => {
    if (error) showToast('error', 'Unable to load your progress. Please try again.')
  }, [error, showToast])

  const summary = useMemo(() => summarizePeriod(workouts, period), [workouts, period])
  const strength = useMemo(() => getStrengthTrends(workouts, period), [workouts, period])
  const buckets = useMemo(() => getVolumeBuckets(workouts, period), [workouts, period])
  const weeklyCounts = useMemo(() => getWeeklyCounts(workouts, 12), [workouts])

  const lifts = showAllLifts ? strength : strength.slice(0, STRENGTH_PREVIEW)

  return (
    <div className="min-h-full">
      <PageHeader title="Progress" />

      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Period */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--bg-secondary)]" role="radiogroup" aria-label="Time period">
          {(Object.keys(PERIOD_LABELS) as ProgressPeriod[]).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={period === value}
              onClick={() => setPeriod(value)}
              className={`min-h-[40px] rounded-lg text-sm font-medium transition-colors ${
                period === value ? 'bg-primary-500 text-on-primary shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
            >
              {PERIOD_LABELS[value]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-center text-[var(--text-secondary)] py-12">Loading...</p>
        ) : (
          <>
            {/* Summary vs the previous period */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'workouts', value: `${summary.current.workouts}`, delta: <Delta current={summary.current.workouts} previous={summary.previous.workouts} /> },
                { label: 'kg lifted', value: formatVolume(summary.current.volume), delta: <Delta current={summary.current.volume} previous={summary.previous.volume} percent /> },
                { label: 'records', value: `${summary.current.records}`, delta: <span className="text-[var(--text-secondary)]">this period</span> },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-card p-3">
                  <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums leading-tight">{stat.value}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
                  <p className="text-xs font-medium mt-1 tabular-nums">{stat.delta}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--text-secondary)] -mt-2 px-1">Compared to the previous {PERIOD_LABELS[period].toLowerCase()}</p>

            {/* Strength */}
            <section className="rounded-2xl bg-card p-4">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-semibold text-[var(--text-primary)]">Strength</h2>
                <span className="text-xs text-[var(--text-secondary)]">estimated 1RM</span>
              </div>

              {strength.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] py-4">
                  Log an exercise at least twice in this period to see its trend.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border-primary)]">
                  {lifts.map((lift) => {
                    const changePercent = Math.round(lift.change * 100)
                    return (
                      <button
                        key={lift.name}
                        type="button"
                        onClick={() => navigate(`/progress/exercise/${encodeURIComponent(lift.name)}`)}
                        className="w-full flex items-center gap-3 py-3 text-left"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="text-sm font-medium text-[var(--text-primary)] truncate">{lift.name}</span>
                            <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums flex-shrink-0">
                              {lift.current} kg
                            </span>
                          </span>
                          <span className="flex items-center justify-between gap-3 mt-0.5">
                            <span className="text-xs text-[var(--text-secondary)] truncate">
                              {lift.muscleGroup}
                              {isStalled(lift.points) && (
                                <span className="ml-1.5 font-medium text-amber-600 dark:text-amber-400">· stalled</span>
                              )}
                            </span>
                            <span className="flex items-center gap-2 flex-shrink-0">
                              <Sparkline values={lift.points.map((point) => point.oneRepMax)} muted={changePercent <= 0} width={56} height={18} />
                              <span
                                className={`w-10 text-right text-xs font-medium tabular-nums ${
                                  changePercent > 0 ? 'text-green-600 dark:text-green-400' : changePercent < 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'
                                }`}
                              >
                                {changePercent > 0 ? '+' : ''}
                                {changePercent}%
                              </span>
                            </span>
                          </span>
                        </span>
                        <ChevronRight size={16} className="text-[var(--text-inactive)] flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}

              {strength.length > STRENGTH_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setShowAllLifts((value) => !value)}
                  className="w-full mt-1 min-h-[40px] text-sm font-medium text-primary-600 dark:text-primary-500"
                >
                  {showAllLifts ? 'Show less' : `Show all ${strength.length}`}
                </button>
              )}
            </section>

            {/* Volume */}
            <section className="rounded-2xl bg-card p-4">
              <h2 className="font-semibold text-[var(--text-primary)] mb-3">
                {period === '1y' ? 'Monthly volume' : 'Weekly volume'}
              </h2>
              <VolumeBars buckets={buckets} />
            </section>

            {/* Consistency */}
            <section className="rounded-2xl bg-card p-4">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="font-semibold text-[var(--text-primary)]">Consistency</h2>
                <span className="text-xs text-[var(--text-secondary)]">last 12 weeks</span>
              </div>
              <ConsistencyGrid counts={weeklyCounts} goal={WEEKLY_GOAL} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default ProgressPage
