import { Clock, ChevronLeft } from 'lucide-react'

interface WorkoutHeaderProps {
  title: string
  elapsedTime: string
  onExit: () => void
  onComplete: () => void
  isCompleting?: boolean
}

function WorkoutHeader({ title, elapsedTime, onExit, onComplete, isCompleting = false }: WorkoutHeaderProps) {
  return (
    <div className="sticky top-0 bg-card border-b border-[var(--border-primary)] z-10 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onExit}
          disabled={isCompleting}
          className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium min-h-[44px] min-w-[44px] justify-center disabled:opacity-50"
        >
          <ChevronLeft size={20} />
          <span>Exit</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
          <div className="flex items-center justify-center gap-1 text-[var(--text-secondary)] text-sm font-medium tabular-nums">
            <Clock size={14} />
            <span>{elapsedTime}</span>
          </div>
        </div>
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="px-4 min-h-[40px] rounded-lg bg-primary-500 text-on-primary font-semibold hover:opacity-90 active:opacity-80 disabled:opacity-50 transition-opacity"
        >
          {isCompleting ? 'Saving...' : 'Finish'}
        </button>
      </div>
    </div>
  )
}

export default WorkoutHeader
