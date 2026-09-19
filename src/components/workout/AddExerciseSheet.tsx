import { useMemo, useState } from 'react'
import { Minus, Plus, Search } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import {
  MUSCLE_GROUPS,
  searchExercises,
  type LibraryExercise,
} from '../../constants/exerciseLibrary'
import { getTopSet, type LastSession } from '../../services/firestoreProgressService'

const MAX_RESULTS = 25

/** "landmine row" -> "Landmine Row"; names typed with capitals are left alone */
export function formatExerciseName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  if (trimmed !== trimmed.toLowerCase()) return trimmed
  return trimmed.replace(/(^|[\s(/-])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase())
}

interface AddExerciseSheetProps {
  isOpen: boolean
  onClose: () => void
  /** Muscles this workout type trains, used for suggestions before typing */
  suggestedMuscles: string[]
  customLibrary: LibraryExercise[]
  /** Names already in the workout (lowercase) */
  existingNames: Set<string>
  lastSessions: Map<string, LastSession>
  isSaving: boolean
  onAdd: (exercise: LibraryExercise, sets: number) => void
  onCreate: (name: string, muscleGroup: string, sets: number) => void
}

function AddExerciseSheet({
  isOpen,
  onClose,
  suggestedMuscles,
  customLibrary,
  existingNames,
  lastSessions,
  isSaving,
  onAdd,
  onCreate,
}: AddExerciseSheetProps) {
  const [queryText, setQueryText] = useState('')
  const [creating, setCreating] = useState(false)
  const [muscleGroup, setMuscleGroup] = useState<string>('')
  const [sets, setSets] = useState(3)

  const trimmed = queryText.trim()
  const newName = formatExerciseName(queryText)
  const results = useMemo(() => {
    const available = searchExercises(trimmed, customLibrary).filter(
      (exercise) => !existingNames.has(exercise.name.toLowerCase())
    )
    if (trimmed) return available.slice(0, MAX_RESULTS)
    // Before typing: the user's own exercises, then ones for muscles this day trains
    const muscles = new Set(suggestedMuscles.map((muscle) => muscle.toLowerCase()))
    return available
      .filter((exercise) => exercise.source === 'custom' || muscles.has(exercise.muscleGroup.toLowerCase()))
      .sort((a, b) => Number(b.source === 'custom') - Number(a.source === 'custom'))
      .slice(0, MAX_RESULTS)
  }, [trimmed, customLibrary, existingNames, suggestedMuscles])

  const exactMatch = results.some((exercise) => exercise.name.toLowerCase() === trimmed.toLowerCase())
  const canCreate = trimmed.length >= 2 && !exactMatch

  const close = () => {
    setQueryText('')
    setCreating(false)
    setMuscleGroup('')
    setSets(3)
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={close} label="Add exercise">
      <div className="pt-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Add exercise</h2>

        <label className="relative block">
          <span className="sr-only">Search exercises</span>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="search"
            value={queryText}
            onChange={(event) => {
              setQueryText(event.target.value)
              setCreating(false)
            }}
            placeholder="Search by name or muscle"
            className="w-full pl-10 pr-3 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </label>

        {creating ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">New exercise: {newName}</p>
              <p className="text-xs text-[var(--text-secondary)]">Saved to your library for next time</p>
            </div>

            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Muscle group</p>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setMuscleGroup(group)}
                    aria-pressed={muscleGroup === group}
                    className={`px-3 min-h-[36px] rounded-full text-sm transition-colors ${
                      muscleGroup === group
                        ? 'bg-primary-500 text-on-primary font-medium'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--text-primary)]">Sets</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSets((value) => Math.max(1, value - 1))}
                  className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)]"
                  aria-label="Fewer sets"
                >
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center font-semibold text-[var(--text-primary)] tabular-nums">{sets}</span>
                <button
                  type="button"
                  onClick={() => setSets((value) => Math.min(10, value + 1))}
                  className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)]"
                  aria-label="More sets"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={!muscleGroup || isSaving}
              onClick={() => onCreate(newName, muscleGroup, sets)}
              className="w-full min-h-[48px] rounded-xl bg-primary-500 text-on-primary font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Adding...' : muscleGroup ? 'Add to workout' : 'Pick a muscle group'}
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {!trimmed && results.length > 0 && (
              <p className="text-xs font-medium text-[var(--text-secondary)] px-1">Suggested for today</p>
            )}
            {results.map((exercise) => {
              const top = getTopSet(lastSessions.get(exercise.name.toLowerCase()))
              return (
                <button
                  key={exercise.id}
                  type="button"
                  disabled={isSaving}
                  onClick={() => onAdd(exercise, 3)}
                  className="w-full text-left rounded-xl px-4 py-3 bg-[var(--bg-secondary)] hover:opacity-80 flex items-center justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[var(--text-primary)] truncate">{exercise.name}</span>
                    {top && (
                      <span className="block text-xs text-[var(--text-secondary)]">Last: {top.weight}×{top.reps}</span>
                    )}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] flex-shrink-0">{exercise.muscleGroup}</span>
                </button>
              )
            })}

            {canCreate && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full text-left rounded-xl px-4 py-3 border border-dashed border-primary-400"
              >
                <span className="block text-sm font-medium text-primary-600 dark:text-primary-500">+ Create "{newName}"</span>
                <span className="block text-xs text-[var(--text-secondary)]">Saved to your library for next time</span>
              </button>
            )}

            {trimmed && results.length === 0 && !canCreate && (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">Type at least 2 letters to create an exercise.</p>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}

export default AddExerciseSheet
