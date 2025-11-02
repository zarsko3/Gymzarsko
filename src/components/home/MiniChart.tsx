interface MiniChartProps {
  data: number[]
  color?: string
  type?: 'area' | 'line'
}

function MiniChart({ data, color = '#10B981', type = 'area' }: MiniChartProps) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  // Normalize data to 0-1 range
  const normalized = data.map(value => (value - min) / range)

  // Create SVG path
  const points = normalized.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = (1 - value) * 100
    return `${x},${y}`
  })

  const pathData = type === 'area'
    ? `M 0,100 L ${points.join(' L ')} L 100,100 Z`
    : `M ${points.join(' L ')}`

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      <path
        d={pathData}
        fill={type === 'area' ? color : 'none'}
        fillOpacity={type === 'area' ? 0.2 : 0}
        stroke={color}
        strokeWidth={type === 'area' ? 0 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default MiniChart

