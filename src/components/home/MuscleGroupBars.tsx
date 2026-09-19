import type { MuscleGroupVolume } from '../../services/workoutAnalyticsService'

/** Weekly sets per muscle group that research generally puts in the productive range */
export const TARGET_SETS = { min: 8, max: 16 }

interface MuscleGroupBarsProps {
  data: MuscleGroupVolume[]
}

function MuscleGroupBars({ data }: MuscleGroupBarsProps) {
  if (data.length === 0) return null

  const scale = Math.max(...data.map((entry) => entry.sets), TARGET_SETS.max + 4)
  const markers = [TARGET_SETS.min, TARGET_SETS.max].map((sets) => (sets / scale) * 100)

  return (
    <div className="rounded-2xl bg-card p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-semibold text-[var(--text-primary)]">Sets per muscle</h3>
        <span className="text-xs text-[var(--text-secondary)]">last 7 days</span>
      </div>

      <div className="space-y-2.5">
        {data.map((entry) => {
          const belowRange = entry.sets < TARGET_SETS.min
          return (
            <div key={entry.muscleGroup} className="flex items-center gap-3">
              <span className="w-24 flex-shrink-0 text-xs text-[var(--text-secondary)] truncate">
                {entry.muscleGroup}
              </span>
              <div className="relative flex-1 h-2">
                <div className="absolute inset-0 rounded-full bg-[var(--bg-secondary)]" />
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${belowRange ? 'bg-[var(--text-inactive)]' : 'bg-primary-500'}`}
                  style={{ width: `${Math.max(4, (entry.sets / scale) * 100)}%` }}
                />
                {markers.map((left) => (
                  <div
                    key={left}
                    className="absolute -top-0.5 -bottom-0.5 w-0.5 rounded-full bg-[var(--text-secondary)] opacity-50"
                    style={{ left: `${left}%` }}
                  />
                ))}
              </div>
              <span className="w-6 text-right text-xs font-semibold text-[var(--text-primary)] tabular-nums">
                {entry.sets}
              </span>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-[var(--text-secondary)]">
        Marks show {TARGET_SETS.min}–{TARGET_SETS.max} sets, the productive range. Gray is below it.
      </p>
    </div>
  )
}

export default MuscleGroupBars
