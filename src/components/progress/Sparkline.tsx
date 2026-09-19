interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  /** Gray instead of the accent when the trend is flat or down */
  muted?: boolean
}

/** Tiny trend line for list rows */
function Sparkline({ values, width = 64, height = 22, muted = false }: SparklineProps) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden="true" />

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 2
  const points = values
    .map((value, i) => {
      const x = pad + (i / (values.length - 1)) * (width - pad * 2)
      const y = pad + (1 - (value - min) / range) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={muted ? 'stroke-[color:var(--text-inactive)]' : 'stroke-primary-500'}
      />
    </svg>
  )
}

export default Sparkline
