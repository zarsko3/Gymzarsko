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
      className={`rounded-full transition-all ${className} ${
        active
          ? 'bg-[var(--accent)] text-[var(--text)] shadow-[0_4px_12px_rgba(255,181,92,0.25)]'
          : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
      }`}
      whileHover={active ? {} : { 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.15 }}
      style={{
        boxShadow: active 
          ? '0 4px 12px rgba(255, 181, 92, 0.25), 0 0 0 1px rgba(255, 181, 92, 0.1) inset'
          : 'none',
      }}
    >
      {children}
    </motion.button>
  )
}

export default PillButton

