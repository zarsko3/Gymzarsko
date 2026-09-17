import type { MuscleGroupVolume } from '../../services/workoutAnalyticsService'
import Card from '../ui/Card'

/** Weekly sets per muscle group that research generally puts in the productive range */
const LOW_SETS_THRESHOLD = 10

interface MuscleGroupBarsProps {
  data: MuscleGroupVolume[]
}

function MuscleGroupBars({ data }: MuscleGroupBarsProps) {
  if (data.length === 0) return null

  const max = Math.max(...data.map((entry) => entry.sets), LOW_SETS_THRESHOLD)

  return (
    <Card className="bg-card">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-semibold text-[var(--text-primary)]">Sets per muscle</h3>
        <span className="text-xs text-[var(--text-secondary)]">last 7 days</span>
      </div>

      <div className="space-y-2">
        {data.map((entry) => {
          const isLow = entry.sets < LOW_SETS_THRESHOLD
          return (
            <div key={entry.muscleGroup} className="flex items-center gap-3">
              <span className="w-24 flex-shrink-0 text-xs text-[var(--text-secondary)] truncate">
                {entry.muscleGroup}
              </span>
              <div className="flex-1 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                <div
                  className={`h-full rounded-full ${isLow ? 'bg-amber-400' : 'bg-primary-500'}`}
                  style={{ width: `${Math.max(4, (entry.sets / max) * 100)}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-medium text-[var(--text-primary)] tabular-nums">
                {entry.sets}
              </span>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-[var(--text-secondary)]">
        Amber marks under {LOW_SETS_THRESHOLD} sets this week
      </p>
    </Card>
  )
}

export default MuscleGroupBars
