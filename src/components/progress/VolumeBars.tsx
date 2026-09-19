import { WORKOUT_TYPES } from '../../constants/workoutTypes'
import type { VolumeBucket } from '../../utils/progressStats'

interface VolumeBarsProps {
  buckets: VolumeBucket[]
}

function formatTons(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(kg >= 10000 ? 0 : 1)}k` : `${Math.round(kg)}`
}

/** Stacked bars: total volume per week (or month), split by workout type */
function VolumeBars({ buckets }: VolumeBarsProps) {
  const max = Math.max(...buckets.map((bucket) => bucket.total), 1)
  const usedTypes = WORKOUT_TYPES.filter((type) => buckets.some((bucket) => bucket.byType[type.id]))
  const labelEvery = buckets.length > 6 ? Math.ceil(buckets.length / 4) : 1

  return (
    <div>
      <div className="flex items-end gap-1.5 h-32" role="img" aria-label="Volume per period by workout type">
        {buckets.map((bucket) => (
          <div key={bucket.start.toISOString()} className="flex-1 h-full flex flex-col justify-end">
            <div
              className="w-full flex flex-col-reverse rounded-md overflow-hidden bg-[var(--bg-secondary)]"
              style={{ height: `${Math.max(bucket.total > 0 ? 4 : 2, (bucket.total / max) * 100)}%` }}
            >
              {WORKOUT_TYPES.map((type) => {
                const volume = bucket.byType[type.id]
                if (!volume) return null
                return (
                  <div
                    key={type.id}
                    className={type.barClass}
                    style={{ height: `${(volume / bucket.total) * 100}%` }}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 mt-1.5">
        {buckets.map((bucket, i) => (
          <span key={bucket.start.toISOString()} className="flex-1 text-center text-[10px] text-[var(--text-inactive)] truncate">
            {(buckets.length - 1 - i) % labelEvery === 0 ? bucket.label : ''}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
        {usedTypes.map((type) => (
          <span key={type.id} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className={`w-2.5 h-2.5 rounded-sm ${type.barClass}`} />
            {type.shortName}
          </span>
        ))}
        <span className="ml-auto text-xs text-[var(--text-secondary)] tabular-nums">
          peak {formatTons(max)} kg
        </span>
      </div>
    </div>
  )
}

export default VolumeBars
