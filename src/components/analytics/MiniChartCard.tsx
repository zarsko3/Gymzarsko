import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ComparisonResult } from '../../types'

interface MiniChartCardProps {
  title: string
  value: string | number
  chart: ReactNode
  comparison?: ComparisonResult | null
  isLoading?: boolean
}

function MiniChartCard({ title, value, chart, comparison, isLoading }: MiniChartCardProps) {
  const shouldReduceMotion = useReducedMotion() ?? false
  
  const getTrendIcon = () => {
    if (!comparison || comparison.changePercent === 0) {
      return <Minus size={14} className="text-[var(--text-secondary)]" />
    }
    if (comparison.changePercent > 0) {
      return <TrendingUp size={14} className="text-green-500" />
    }
    return <TrendingDown size={14} className="text-red-500" />
  }
  
  const getTrendColor = () => {
    if (!comparison || comparison.changePercent === 0) {
      return 'text-[var(--text-secondary)]'
    }
    if (comparison.changePercent > 0) {
      return 'text-green-500'
    }
    return 'text-red-500'
  }
  
  const formatComparison = () => {
    if (!comparison) return null
    if (comparison.changePercent === 0) return 'No change'
    const sign = comparison.changePercent > 0 ? '+' : ''
    return `${sign}${comparison.changePercent.toFixed(1)}%`
  }
  
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-4 shadow-sm">
        <div className="text-[var(--text-secondary)] text-xs font-medium text-center">{title}</div>
        <div className="mt-1 flex flex-col items-center justify-center gap-2 min-h-[88px]">
          <div className="text-3xl font-extrabold text-[var(--text-primary)] leading-none text-center">
            --
          </div>
          <div className="w-full h-12 mt-1 bg-[var(--bg-secondary)] rounded animate-pulse" />
        </div>
      </div>
    )
  }
  
  return (
    <motion.div 
      className="bg-card rounded-xl p-4 shadow-sm relative"
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      whileHover={shouldReduceMotion ? {} : { 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: { duration: 0.15 }
      }}
      style={{ willChange: 'transform, opacity', zIndex: 1 }}
    >
      <div className="text-[var(--text-secondary)] text-xs font-medium text-center">{title}</div>
      <div className="mt-1 flex flex-col items-center justify-center gap-2 min-h-[88px]">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-extrabold text-[var(--text-primary)] leading-none text-center">
            {value}
          </div>
          {comparison && (
            <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{formatComparison()}</span>
            </div>
          )}
        </div>
        <div className="w-full h-12 mt-1 relative" style={{ overflow: 'visible', zIndex: 2 }}>
          {chart}
        </div>
      </div>
    </motion.div>
  )
}

export default MiniChartCard

