import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import type { LibraryExercise } from '../../constants/exerciseLibrary'
import { getTopSet, type LastSession } from '../../services/firestoreProgressService'
import { describeLastDone } from '../../utils/workoutTypeStats'

export type SwapScope = 'today' | 'always'

interface SwapExerciseSheetProps {
  isOpen: boolean
  onClose: () => void
  exerciseName: string
  muscleGroup: string
  alternatives: LibraryExercise[]
  /** Program exercise to go back to, when the slot is currently swapped */
  original: LibraryExercise | null
  /** Offer "every workout" only for exercises that belong to the program */
  canRemember: boolean
  workoutTypeName: string
  completedSets: number
  lastSessions: Map<string, LastSession>
  onSwap: (exercise: LibraryExercise, scope: SwapScope) => void
}

function describeLast(session: LastSession | undefined) {
  const top = getTopSet(session)
  if (!session || !top) return 'Never done'
  return `Last: ${top.weight}×${top.reps} · ${describeLastDone(session.date)}`
}

function SwapExerciseSheet({
  isOpen,
  onClose,
  exerciseName,
  muscleGroup,
  alternatives,
  original,
  canRemember,
  workoutTypeName,
  completedSets,
  lastSessions,
  onSwap,
}: SwapExerciseSheetProps) {
  const [scope, setScope] = useState<SwapScope>('today')

  const option = (exercise: LibraryExercise, highlight = false) => {
    const session = lastSessions.get(exercise.name.toLowerCase())
    return (
      <button
        key={exercise.id}
        type="button"
        onClick={() => onSwap(exercise, canRemember ? scope : 'today')}
        className={`w-full text-left rounded-xl px-4 py-3 transition-colors ${
          highlight ? 'border border-primary-400 bg-primary-50' : 'bg-[var(--bg-secondary)] hover:opacity-80'
        }`}
      >
        <div className="flex items-center gap-2">
          {highlight && <RotateCcw size={14} className="text-primary-500 flex-shrink-0" />}
          <span className="text-sm font-medium text-[var(--text-primary)]">{exercise.name}</span>
          {exercise.source === 'custom' && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">yours</span>
          )}
        </div>
        <p className={`text-xs mt-0.5 ${session ? 'text-[var(--text-secondary)]' : 'text-[var(--text-inactive)]'}`}>
          {highlight ? `Program default · ${describeLast(session)}` : describeLast(session)}
        </p>
      </button>
    )
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label={`Swap ${exerciseName}`}>
      <div className="pt-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Swap {exerciseName}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{muscleGroup} alternatives</p>

        {canRemember && (
          <div className="grid grid-cols-2 gap-1 p-1 mt-4 rounded-xl bg-[var(--bg-secondary)]" role="radiogroup" aria-label="How long to keep the swap">
            {(['today', 'always'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={scope === value}
                onClick={() => setScope(value)}
                className={`min-h-[40px] rounded-lg text-sm font-medium transition-colors ${
                  scope === value ? 'bg-primary-500 text-on-primary shadow-sm' : 'text-[var(--text-secondary)]'
                }`}
              >
                {value === 'today' ? 'Just today' : `Every ${workoutTypeName.toLowerCase()}`}
              </button>
            ))}
          </div>
        )}

        {completedSets > 0 && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            {completedSets} completed {completedSets === 1 ? 'set' : 'sets'} of {exerciseName} will be cleared.
          </p>
        )}

        <div className="mt-4 space-y-2">
          {original && option(original, true)}
          {alternatives.map((exercise) => option(exercise))}
          {alternatives.length === 0 && !original && (
            <p className="text-sm text-[var(--text-secondary)] py-4 text-center">
              No other {muscleGroup.toLowerCase()} exercises yet. Add one from "Add Exercise" and it will show up here.
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

export default SwapExerciseSheet
