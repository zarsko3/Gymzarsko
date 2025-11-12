import { useState, useMemo } from 'react'
import { AreaChart, Area, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export type MetricType = 'volume' | 'intensity' | 'duration' | 'density'

interface ChartDataPoint {
  label: string
  value: number
  date: Date
}

interface CompareDataPoint {
  label: string
  value: number
}

interface CurvyMetricChartProps {
  data: ChartDataPoint[]
  metric: MetricType
  compare?: CompareDataPoint[] | null
  height?: number
  unit?: string
}

// Reference-style metric colors (lighter, softer)
const METRIC = {
  volume: {
    line: '#FFF7D1',
    glow: '#FFF7D1',
    fillTop: 'rgba(255,247,209,.25)',
    fillBottom: 'rgba(255,247,209,0)',
    tooltipBg: '#FFF1B8',
  },
  intensity: {
    line: '#D7E8FF',
    glow: '#D7E8FF',
    fillTop: 'rgba(215,232,255,.25)',
    fillBottom: 'rgba(215,232,255,0)',
    tooltipBg: '#B8D9FF',
  },
  duration: {
    line: '#E6DAFF',
    glow: '#E6DAFF',
    fillTop: 'rgba(230,218,255,.25)',
    fillBottom: 'rgba(230,218,255,0)',
    tooltipBg: '#D4C2FF',
  },
  density: {
    line: '#CFF8E7',
    glow: '#CFF8E7',
    fillTop: 'rgba(207,248,231,.25)',
    fillBottom: 'rgba(207,248,231,0)',
    tooltipBg: '#B8F5D9',
  },
} as const

function CurvyMetricChart({ data, metric, compare, height = 220, unit }: CurvyMetricChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  
  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[var(--text-dim)] text-xs">
        No data
      </div>
    )
  }
  
  const theme = METRIC[metric]
  const ids = useMemo(() => {
    const uid = Math.random().toString(36).slice(2)
    return { fill: `fill-${uid}`, glow: `glow-${uid}` }
  }, [])
  
  // Determine unit if not provided
  const displayUnit = unit || (metric === 'volume' ? 'KG' : metric === 'intensity' ? 'KG' : metric === 'duration' ? 'min' : 'kg/min')
  
  // Format value for tooltip
  const formatValue = (value: number) => {
    if (metric === 'volume' || metric === 'intensity') {
      return Math.round(value)
    }
    if (metric === 'duration') {
      const hours = Math.floor(value / 60)
      const minutes = Math.round(value % 60)
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    }
    if (metric === 'density') {
      return value.toFixed(1)
    }
    return Math.round(value)
  }
  
  // Pill tooltip with tail
  const PillTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    
    const value = payload[0].value as number
    const compareValue = payload[1]?.value
    
    return (
      <div className="relative">
        <div
          className="rounded-xl px-4 py-2 font-extrabold shadow-lg"
          style={{
            background: theme.tooltipBg,
            color: '#262626',
            borderRadius: 12,
          }}
        >
          {formatValue(value)} {displayUnit}
          {compare && compareValue !== undefined && (
            <div className="text-xs mt-1 opacity-70">
              vs {formatValue(compareValue)}
            </div>
          )}
        </div>
        {/* Tail */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: '100%',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${theme.tooltipBg}`,
          }}
        />
      </div>
    )
  }
  
  // Prepare chart data with compare values aligned by label
  const chartData = useMemo(() => {
    if (!compare || compare.length === 0) {
      return data
    }
    
    return data.map((point) => {
      const comparePoint = compare.find(cp => cp.label === point.label)
      return {
        ...point,
        compareValue: comparePoint?.value,
      }
    })
  }, [data, compare])
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 12, right: 8, left: 8, bottom: 8 }}
        onMouseMove={(e: any) => {
          const idx = e?.activeTooltipIndex
          setActiveIndex(typeof idx === 'number' ? idx : null)
        }}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <defs>
          {/* Area fill gradient */}
          <linearGradient id={ids.fill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.fillTop} />
            <stop offset="100%" stopColor={theme.fillBottom} />
          </linearGradient>
          {/* Glow filter for active dot */}
          <filter id={ids.glow}>
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* X-axis with weekday labels */}
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgba(255,255,255,.6)', fontSize: 14, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(d) => d.toLowerCase()}
        />
        <YAxis hide />
        
        {/* Custom tooltip with full-height vertical cursor */}
        <Tooltip
          cursor={(props: any) => {
            if (!props?.points?.[0]) return null
            const { x, height, viewBox } = props
            return (
              <g>
                <line
                  x1={x}
                  x2={x}
                  y1={viewBox.y}
                  y2={viewBox.y + height}
                  stroke="rgba(255,255,255,.35)"
                  strokeWidth={2}
                />
              </g>
            )
          }}
          content={<PillTooltip />}
          wrapperStyle={{ outline: 'none' }}
        />
        
        {/* Compare line (dashed) */}
        {compare && compare.length > 0 && (
          <Area
            type="monotone"
            dataKey="compareValue"
            stroke={theme.line}
            strokeWidth={3}
            strokeDasharray="6 6"
            strokeOpacity={0.4}
            fill="none"
            dot={false}
            activeDot={false}
          />
        )}
        
        {/* Main area chart with curvy line and glowing active dot */}
        <Area
          type="monotone"
          dataKey="value"
          stroke={theme.line}
          strokeWidth={4}
          fill={`url(#${ids.fill})`}
          dot={data.length <= 20 ? (p: any) => {
            const isActive = p.index === activeIndex
            return (
              <circle
                cx={p.cx}
                cy={p.cy}
                r={isActive ? 6 : 4}
                fill={theme.line}
                stroke="#1a1930"
                strokeWidth={2}
                filter={isActive ? `url(#${ids.glow})` : undefined}
              />
            )
          } : false}
          activeDot={{
            r: 6,
            fill: theme.line,
            stroke: '#1a1930',
            strokeWidth: 2,
            filter: `url(#${ids.glow})`,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default CurvyMetricChart

