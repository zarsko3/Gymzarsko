import { useMemo, useEffect, useState } from 'react'
import { format, subDays, startOfDay } from 'date-fns'
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

  // Get computed CSS variable value for accent color
  useEffect(() => {
    const root = document.documentElement
    const computed = getComputedStyle(root).getPropertyValue('--accent').trim()
    if (computed) {
      setAccentColor(computed)
    }
  }, [])

  // Filter entries based on time range
  const filteredEntries = useMemo(() => {
    if (timeRange === 'all') {
      return entries
    }

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const cutoffDate = startOfDay(subDays(new Date(), days))

    return entries.filter(entry => entry.date >= cutoffDate)
  }, [entries, timeRange])

  // Sort entries by date (ascending for chart)
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [filteredEntries])

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return sortedEntries.map(entry => ({
      date: entry.date,
      dateLabel: format(entry.date, 'MMM d'),
      weight: entry.weight,
    }))
  }, [sortedEntries])

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

  // Empty state
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
            Add your first entry to see your progress
          </p>
        </div>
      </div>
    )
  }

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

      <div className="bg-card rounded-xl p-4 border border-[var(--border-primary)]">
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
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default MetricChart

