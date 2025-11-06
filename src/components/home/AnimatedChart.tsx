import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

interface AnimatedChartProps {
  data: number[]
  color?: string
  type?: 'area' | 'line'
  height?: number
}

function AnimatedChart({ 
  data, 
  color = '#10B981', 
  type = 'area',
  height = 48 
}: AnimatedChartProps) {
  const shouldReduceMotion = useReducedMotion() ?? false

  // Transform data array into Recharts format
  const chartData = useMemo(() => {
    return data.map((value, index) => ({
      index,
      value: value || 0, // Handle empty data
    }))
  }, [data])

  // Generate unique gradient ID to avoid conflicts
  const gradientId = useMemo(() => `gradient-${color.replace('#', '')}-${type}`, [color, type])

  // Chart configuration
  const chartProps = {
    data: chartData,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  }

  // Custom tooltip with fade-in animation
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-card rounded-lg shadow-lg px-3 py-2 border border-[var(--border-primary)]"
      >
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {payload[0].value}
        </p>
      </motion.div>
    )
  }

  // Animation variants
  const containerVariants = {
    initial: shouldReduceMotion ? {} : {
      opacity: 0,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      scale: 1,
    },
  }

  const containerTransition = shouldReduceMotion ? { duration: 0 } : {
    duration: 0.3,
    ease: [0.16, 1, 0.3, 1] as const,
  }

  // Handle empty or minimal data
  if (!data || data.length === 0) {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        transition={containerTransition}
        className="w-full h-full flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="text-[var(--text-inactive)] text-xs">No data</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      transition={containerTransition}
      className="w-full h-full min-w-0"
      style={{ height: `${height}px`, willChange: 'transform, opacity' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              opacity={0.3}
              vertical={false}
            />
            <XAxis 
              dataKey="index" 
              hide 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              hide 
              axisLine={false}
              tickLine={false}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive={!shouldReduceMotion}
              animationDuration={shouldReduceMotion ? 0 : 1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        ) : (
          <LineChart {...chartProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              opacity={0.3}
              vertical={false}
            />
            <XAxis 
              dataKey="index" 
              hide 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              hide 
              axisLine={false}
              tickLine={false}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 2 }}
              isAnimationActive={!shouldReduceMotion}
              animationDuration={shouldReduceMotion ? 0 : 1000}
              animationEasing="ease-out"
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  )
}

export default AnimatedChart
