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
      className="bg-card rounded-xl p-4 shadow-sm"
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      whileHover={shouldReduceMotion ? {} : { 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: { duration: 0.15 }
      }}
      style={{ willChange: 'transform, opacity' }}
    >
      <div className="text-[var(--text-secondary)] text-xs font-medium">{title}</div>
      <div className="mt-1 flex flex-col items-center justify-center gap-2 min-h-[88px]">
        <div className="text-3xl font-extrabold text-[var(--text-primary)] leading-none">
          {value}
        </div>
        {chart && (
          <div className="w-full h-12 mt-1">
            {chart}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default StatCard

