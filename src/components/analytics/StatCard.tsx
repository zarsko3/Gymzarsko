import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  delta?: {
    text: string
    class: string
    icon: string
  } | null
  children?: ReactNode
  isLoading?: boolean
}

function StatCard({ title, value, delta, children, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl bg-[var(--surface)] border border-white/5 p-4 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,.25)]">
        <div className="text-sm text-[var(--text-dim)] text-center">{title}</div>
        <div className="mt-2 flex items-baseline justify-center gap-3">
          <div className="text-4xl md:text-5xl font-extrabold tabular-nums">--</div>
        </div>
        <div className="mt-4 h-[140px] bg-[var(--surface-2)] rounded animate-pulse" />
      </div>
    )
  }

  return (
    <motion.div
      className="rounded-3xl bg-[var(--surface)] border border-white/5 p-4 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,.25)]"
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="text-sm text-[var(--text-dim)] text-center">{title}</div>
      <div className="mt-2 flex items-baseline justify-center gap-3">
        <div className="text-4xl md:text-5xl font-extrabold tabular-nums text-[var(--text)]">
          {value}
        </div>
        {delta && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${delta.class} flex items-center gap-1`}>
            <span>{delta.icon}</span>
            <span>{delta.text}</span>
          </span>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  )
}

export default StatCard

