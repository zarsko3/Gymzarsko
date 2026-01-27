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
      <div className="flex items-center justify-between px-4 py-4">
        <button
          onClick={onExit}
          disabled={isCompleting}
          className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center disabled:opacity-50"
        >
          <ChevronLeft size={20} />
          <span>Exit</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
          <div className="flex items-center gap-1 text-primary-500 text-sm font-medium">
            <Clock size={14} />
            <span>{elapsedTime}</span>
          </div>
        </div>
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="text-primary-500 hover:text-primary-600 min-h-[44px] min-w-[44px] flex items-center justify-center font-semibold disabled:opacity-50"
        >
          {isCompleting ? 'Saving...' : 'Finish'}
        </button>
      </div>
    </div>
  )
}

export default WorkoutHeader

