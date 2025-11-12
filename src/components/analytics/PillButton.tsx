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
      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${className} ${
        active
          ? 'bg-[var(--accent)] text-[var(--text)]'
          : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
      }`}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.button>
  )
}

export default PillButton

