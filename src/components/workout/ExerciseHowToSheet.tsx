import { PlayCircle } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import { getExerciseCues, getHowToVideoUrl } from '../../constants/exerciseLibrary'

interface ExerciseHowToSheetProps {
  exercise: { id: string; name: string; muscleGroup: string } | null
  onClose: () => void
}

/** Short form cues and a video link, kept to one glance */
function ExerciseHowToSheet({ exercise, onClose }: ExerciseHowToSheetProps) {
  const cues = exercise ? getExerciseCues(exercise.id, exercise.name) : null

  return (
    <BottomSheet isOpen={exercise !== null} onClose={onClose} label="How to do this exercise">
      {exercise && (
        <div className="pt-1">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{exercise.name}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{exercise.muscleGroup}</p>

          {cues && (
            <ol className="mt-4 space-y-3">
              {cues.map((cue, index) => (
                <li key={cue} className="flex gap-3 text-[var(--text-primary)]">
                  <span className="w-6 h-6 flex-shrink-0 rounded-full bg-primary-100 text-primary-600 dark:text-primary-600 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-6">{cue}</span>
                </li>
              ))}
            </ol>
          )}

          <a
            href={getHowToVideoUrl(exercise.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full min-h-[48px] rounded-xl border border-primary-400 text-primary-600 dark:text-primary-500 font-medium flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
          >
            <PlayCircle size={18} />
            Watch a video
          </a>
        </div>
      )}
    </BottomSheet>
  )
}

export default ExerciseHowToSheet
