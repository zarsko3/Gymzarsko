import { format } from 'date-fns'
import type { StrengthPoint } from '../../utils/progressStats'

interface StrengthChartProps {
  points: StrengthPoint[]
}

const WIDTH = 320
const HEIGHT = 150
const PAD = { top: 22, right: 16, bottom: 22, left: 34 }

/** Estimated 1RM over time: one clean line, the latest value labelled */
function StrengthChart({ points }: StrengthChartProps) {
  if (points.length === 0) return null

  const values = points.map((point) => point.oneRepMax)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const spread = Math.max(rawMax - rawMin, 5)
  const min = Math.floor((rawMin - spread * 0.2) / 2.5) * 2.5
  const max = Math.ceil((rawMax + spread * 0.2) / 2.5) * 2.5

  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (points.length === 1 ? innerWidth / 2 : (i / (points.length - 1)) * innerWidth)
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * innerHeight

  const line = points.map((point, i) => `${x(i).toFixed(1)},${y(point.oneRepMax).toFixed(1)}`).join(' ')
  const area = `${x(0)},${PAD.top + innerHeight} ${line} ${x(points.length - 1)},${PAD.top + innerHeight}`
  const last = points[points.length - 1]
  const lastX = x(points.length - 1)
  const lastY = y(last.oneRepMax)

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label={`Estimated one-rep max, now ${last.oneRepMax} kg`}>
      {[min, (min + max) / 2, max].map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-[color:var(--border-primary)]" strokeWidth="1" />
          <text x={PAD.left - 6} y={y(tick) + 3} textAnchor="end" fontSize="9" className="fill-[var(--text-inactive)]">
            {Math.round(tick)}
          </text>
        </g>
      ))}

      <polygon points={area} className="fill-primary-100" opacity="0.6" />
      <polyline points={line} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-500" />
      {points.length <= 16 &&
        points.map((point, i) => (
          <circle key={i} cx={x(i)} cy={y(point.oneRepMax)} r="2.5" className="fill-primary-500" />
        ))}
      <circle cx={lastX} cy={lastY} r="5" className="fill-primary-500 stroke-[color:var(--bg-card)]" strokeWidth="2" />
      <text x={Math.min(lastX, WIDTH - PAD.right - 4)} y={lastY - 10} textAnchor="end" fontSize="11" fontWeight="600" className="fill-[var(--text-primary)]">
        {last.oneRepMax} kg
      </text>

      <text x={x(0)} y={HEIGHT - 6} fontSize="9" className="fill-[var(--text-inactive)]">
        {format(points[0].date, 'MMM d')}
      </text>
      {points.length > 1 && (
        <text x={lastX} y={HEIGHT - 6} textAnchor="end" fontSize="9" className="fill-[var(--text-inactive)]">
          {format(last.date, 'MMM d')}
        </text>
      )}
    </svg>
  )
}

export default StrengthChart
