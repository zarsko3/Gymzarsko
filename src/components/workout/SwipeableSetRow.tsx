import { useState, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { Trash2 } from 'lucide-react'

const ACTION_WIDTH = 84
const OPEN_THRESHOLD = ACTION_WIDTH / 2

interface SwipeableSetRowProps {
  children: ReactNode
  /** When false the row can't be swiped (e.g. an exercise's only set) */
  canDelete: boolean
  onDelete: () => void
  className?: string
}

/** Swipe a set left to reveal a Delete button, like a mail list on iOS */
function SwipeableSetRow({ children, canDelete, onDelete, className = '' }: SwipeableSetRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion() ?? false
  const x = useMotionValue(0)
  // Keep the red action invisible until the row actually moves, so no red shows at the edges
  const actionOpacity = useTransform(x, [-12, -2], [1, 0])

  if (!canDelete) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      <motion.button
        type="button"
        style={{ width: ACTION_WIDTH, opacity: actionOpacity }}
        onClick={() => {
          setIsOpen(false)
          onDelete()
        }}
        tabIndex={isOpen ? 0 : -1}
        aria-hidden={!isOpen}
        className="absolute inset-y-0 right-0 flex items-center justify-center gap-1 bg-red-500 text-white text-sm font-medium"
      >
        <Trash2 size={16} />
        Delete
      </motion.button>

      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        animate={{ x: isOpen ? -ACTION_WIDTH : 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
        onDragEnd={(_, info) => setIsOpen(info.offset.x < -OPEN_THRESHOLD || (isOpen && info.offset.x < OPEN_THRESHOLD))}
        className="relative bg-card touch-pan-y"
      >
        <div className={className}>{children}</div>
      </motion.div>
    </div>
  )
}

export default SwipeableSetRow
