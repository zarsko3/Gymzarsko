interface ConsistencyGridProps {
  /** Workouts per week, oldest first */
  counts: number[]
  goal: number
}

function levelClass(count: number, goal: number) {
  if (count === 0) return 'bg-[var(--bg-secondary)]'
  const ratio = count / goal
  if (ratio >= 1) return 'bg-primary-500'
  if (ratio >= 0.6) return 'bg-primary-400'
  if (ratio >= 0.3) return 'bg-primary-300'
  return 'bg-primary-200'
}

/** One square per week; the closer to the weekly goal, the stronger the color */
function ConsistencyGrid({ counts, goal }: ConsistencyGridProps) {
  const weeksHit = counts.filter((count) => count >= goal).length

  return (
    <div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${counts.length}, minmax(0, 1fr))` }}>
        {counts.map((count, i) => (
          <div
            key={i}
            className={`aspect-square rounded-md ${levelClass(count, goal)}`}
            title={`${count} workout${count === 1 ? '' : 's'}`}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--text-secondary)]">
        Goal of {goal} hit in {weeksHit} of the last {counts.length} weeks
      </p>
    </div>
  )
}

export default ConsistencyGrid
