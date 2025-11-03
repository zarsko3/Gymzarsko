import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string | number
  chart?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ title, value, chart, trend }: StatCardProps) {
  const shouldReduceMotion = useReducedMotion() ?? false
  
  return (
    <motion.div 
      className="bg-white rounded-xl p-4 shadow-sm"
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      whileHover={shouldReduceMotion ? {} : { 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: { duration: 0.15 }
      }}
      style={{ willChange: 'transform, opacity' }}
    >
      <div className="text-text-secondary text-xs font-medium mb-2">{title}</div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        {chart && (
          <div className="flex-1 ml-3 h-12 flex items-end">
            {chart}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default StatCard

