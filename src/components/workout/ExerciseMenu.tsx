import { useEffect, useRef, useState } from 'react'
import { LineChart, MoreHorizontal, Pencil, Repeat, SlidersHorizontal, Trash2 } from 'lucide-react'

interface ExerciseMenuProps {
  onSwap: () => void
  onViewProgress: () => void
  onRename: () => void
  onEdit: () => void
  onRemove: () => void
}

/** One "⋯" button for everything you can do to an exercise */
function ExerciseMenu({ onSwap, onViewProgress, onRename, onEdit, onRemove }: ExerciseMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const choose = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  const itemClass =
    'w-full flex items-center gap-3 px-4 min-h-[44px] text-sm text-left hover:bg-[var(--bg-secondary)] transition-colors'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
        aria-label="Exercise options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={20} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 w-52 !max-w-none py-1 rounded-xl bg-card border border-[var(--border)] shadow-lg overflow-hidden"
        >
          <button role="menuitem" type="button" onClick={choose(onSwap)} className={`${itemClass} text-[var(--text-primary)]`}>
            <Repeat size={16} className="text-[var(--text-secondary)]" />
            Swap exercise
          </button>
          <button role="menuitem" type="button" onClick={choose(onViewProgress)} className={`${itemClass} text-[var(--text-primary)]`}>
            <LineChart size={16} className="text-[var(--text-secondary)]" />
            View progress
          </button>
          <button role="menuitem" type="button" onClick={choose(onRename)} className={`${itemClass} text-[var(--text-primary)]`}>
            <Pencil size={16} className="text-[var(--text-secondary)]" />
            Rename
          </button>
          <button role="menuitem" type="button" onClick={choose(onEdit)} className={`${itemClass} text-[var(--text-primary)]`}>
            <SlidersHorizontal size={16} className="text-[var(--text-secondary)]" />
            Edit sets and targets
          </button>
          <button role="menuitem" type="button" onClick={choose(onRemove)} className={`${itemClass} text-red-500`}>
            <Trash2 size={16} />
            Remove exercise
          </button>
        </div>
      )}
    </div>
  )
}

export default ExerciseMenu
