import { useMemo, useEffect, useState } from 'react'
import { format, subDays, startOfDay } from 'date-fns'
import { useReducedMotion } from 'framer-motion'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import type { BodyMetricEntry, BodyMetricGoal } from '../../types'

interface MetricChartProps {
  entries: BodyMetricEntry[]
  goal: BodyMetricGoal | null
  timeRange: '7d' | '30d' | '90d' | 'all'
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | 'all') => void
}

function MetricChart({ entries, goal, timeRange, onTimeRangeChange }: MetricChartProps) {
  const [accentColor, setAccentColor] = useState<string>('#10B981')
  const shouldReduceMotion = useReducedMotion() ?? false

  // Get computed CSS variable value for accent color
  useEffect(() => {
    const root = document.documentElement
    const computed = getComputedStyle(root).getPropertyValue('--accent').trim()
    if (computed) {
      setAccentColor(computed)
    }
  }, [])

  // Pure data derivation - filter, sort, and transform in one step
  // Never returns intermediate empty arrays - only derived from entries
  const chartData = useMemo(() => {
    // Guard: if no entries, return empty array (not undefined/null)
    if (!entries || entries.length === 0) {
      return []
    }

    // Filter by time range
    let filtered = entries
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const cutoffDate = startOfDay(subDays(new Date(), days))
      filtered = entries.filter(entry => {
        if (!entry || !entry.date) return false
        return entry.date >= cutoffDate
      })
    }

    // Filter out invalid entries and transform
    const validEntries = filtered.filter(entry => {
      return entry && 
             entry.date && 
             entry.weight != null && 
             !isNaN(Number(entry.weight))
    })

    // Sort by date (ascending for chart)
    const sorted = [...validEntries].sort((a, b) => a.date.getTime() - b.date.getTime())

    // Transform to chart format
    const data = sorted.map(entry => ({
      date: entry.date,
      dateLabel: format(entry.date, 'MMM d'),
      weight: typeof entry.weight === 'number' 
        ? entry.weight 
        : Number(String(entry.weight).replace(/[^0-9.]/g, '')) || 0,
    }))

    return data
  }, [entries, timeRange])


  // Calculate Y-axis domain with padding
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) {
      return [0, 100]
    }

    const weights = chartData.map(d => d.weight)
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const range = maxWeight - minWeight
    const padding = range * 0.1 || 5 // 10% padding or 5kg minimum

    const min = Math.max(0, minWeight - padding)
    const max = maxWeight + padding

    // Include goal in domain if it exists
    if (goal) {
      return [
        Math.min(min, goal.targetWeight - padding),
        Math.max(max, goal.targetWeight + padding),
      ]
    }

    return [min, max]
  }, [chartData, goal])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    return (
      <div className="bg-card rounded-lg shadow-lg px-3 py-2 border border-[var(--border-primary)]">
        <p className="text-xs text-[var(--text-secondary)] mb-1">
          {format(data.date, 'EEEE, MMM d, yyyy')}
        </p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {data.weight.toFixed(1)} kg
        </p>
      </div>
    )
  }

  // Empty state - only show if we have no entries at all (not just filtered)
  if (entries.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Weight Trend</h3>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-primary-500 text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
                }`}
              >
                {range === 'all' ? 'All' : range}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl p-8 text-center border border-[var(--border-primary)]">
          <p className="text-[var(--text-secondary)] text-sm">
            Add your first entry to see your progress
          </p>
        </div>
      </div>
    )
  }

  // No data for selected time range
  if (chartData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Weight Trend</h3>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-primary-500 text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
                }`}
              >
                {range === 'all' ? 'All' : range}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl p-8 text-center border border-[var(--border-primary)]">
          <p className="text-[var(--text-secondary)] text-sm">
            No entries found for the selected time range
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 flex flex-col">
      <div className="flex items-center justify-between mb-4 min-w-0">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Weight Trend</h3>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:opacity-80'
              }`}
            >
              {range === 'all' ? 'All' : range}
            </button>
          ))}
        </div>
      </div>

      <div 
        className="bg-card rounded-xl p-4 border border-[var(--border-primary)] w-full min-w-0 flex-1"
        style={{ minWidth: 0 }}
      >
        {chartData.length > 0 ? (
          <div style={{ overflow: 'visible', position: 'relative', zIndex: 2 }}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-primary)"
                  opacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="dateLabel"
                  stroke="var(--text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={yAxisDomain}
                  stroke="var(--text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}kg`}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Goal line */}
                {goal && (
                  <ReferenceLine
                    y={goal.targetWeight}
                    stroke="#10B981"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `Goal: ${goal.targetWeight}kg`,
                      position: 'right',
                      fill: '#10B981',
                      fontSize: 12,
                    }}
                  />
                )}
                
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke={accentColor}
                  strokeWidth={2}
                  dot={{ fill: accentColor, r: 4 }}
                  activeDot={{ r: 6, stroke: accentColor, strokeWidth: 2 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  isAnimationActive={!shouldReduceMotion}
                  animationDuration={shouldReduceMotion ? 0 : 1000}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full h-[250px] flex items-center justify-center">
            <div className="text-[var(--text-secondary)] text-sm">No data available</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricChart

