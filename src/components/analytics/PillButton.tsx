import { motion } from 'framer-motion'

interface PillButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

function PillButton({ active, onClick, children, className = '' }: PillButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      data-active={active}
      className={`px-4 h-10 rounded-full border transition-colors font-medium ${className} ${
        active
          ? 'bg-[var(--accent)]/18 text-[var(--text)] border-[var(--accent)]/30 shadow-[0_0_0_1px_rgba(255,181,92,.25)]'
          : 'bg-[var(--surface-2)] text-[var(--text-dim)] border-white/5'
      }`}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.button>
  )
}

export default PillButton

