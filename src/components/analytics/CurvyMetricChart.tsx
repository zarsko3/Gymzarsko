import { useState, useMemo } from 'react'
import { AreaChart, Area, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, CartesianGrid } from 'recharts'

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
}

function CurvyMetricChart({ data, metric, compare, height = 200 }: CurvyMetricChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  
  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[var(--text-dim)] text-xs">
        No data
      </div>
    )
  }
  
  // Metric-specific colors
  const metricColors = {
    volume: { line: '#FFD37A', fill: '#FFD37A', strong: '#FFB55C' },
    intensity: { line: '#7ACBFF', fill: '#7ACBFF', strong: '#5AA3E0' },
    duration: { line: '#B58CFF', fill: '#B58CFF', strong: '#9A6FE0' },
    density: { line: '#41D696', fill: '#41D696', strong: '#2EB875' },
  }
  
  const colors = metricColors[metric]
  const gradientId = `grad-${metric}-${Math.random().toString(36).substr(2, 9)}`
  const fillGradientId = `fill-${metric}-${Math.random().toString(36).substr(2, 9)}`
  
  // Format value based on metric type
  const formatValue = (value: number) => {
    const nf = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
    if (metric === 'volume') return `${nf.format(value)} kg`
    if (metric === 'intensity') return `${Math.round(value)} kg`
    if (metric === 'duration') {
      const hours = Math.floor(value / 60)
      const minutes = Math.round(value % 60)
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    }
    if (metric === 'density') return `${value.toFixed(1)} kg/min`
    return nf.format(value)
  }
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null
    
    const dataPoint = payload[0]
    const value = dataPoint.value as number
    const compareValue = payload[1]?.value
    
    return (
      <div className="bg-[var(--surface-2)] border border-white/10 rounded-lg px-3 py-2 shadow-lg">
        <div className="text-xs text-[var(--text-dim)] mb-1">{dataPoint.payload.label}</div>
        <div className="text-sm font-semibold" style={{ color: colors.line }}>
          {formatValue(value)}
        </div>
        {compare && compareValue !== undefined && (
          <div className="text-xs text-[var(--text-dim)] mt-1">
            Compare: {formatValue(compareValue)}
          </div>
        )}
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
        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        onMouseMove={(state) => {
          if (state?.activeTooltipIndex !== undefined && typeof state.activeTooltipIndex === 'number') {
            setActiveIndex(state.activeTooltipIndex)
          }
        }}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.strong} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.line} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.fill} stopOpacity="0.25" />
            <stop offset="100%" stopColor={colors.fill} stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.03)" />
        <XAxis 
          dataKey="label" 
          hide 
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          hide
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* Vertical reference line on hover */}
        {activeIndex !== null && chartData[activeIndex] && (
          <ReferenceLine
            x={chartData[activeIndex].label}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}
        {/* Compare line (dashed) */}
        {compare && compare.length > 0 && (
          <Line
            type="monotone"
            dataKey="compareValue"
            stroke={colors.line}
            strokeWidth={2}
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            dot={false}
            activeDot={false}
          />
        )}
        {/* Main area chart */}
        <Area
          type="monotone"
          dataKey="value"
          stroke={colors.line}
          strokeWidth={3}
          fill={`url(#${fillGradientId})`}
          dot={data.length <= 20 ? { r: 3, fill: colors.strong, strokeWidth: 2 } : false}
          activeDot={{ r: 5, fill: colors.strong, stroke: colors.line, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default CurvyMetricChart

