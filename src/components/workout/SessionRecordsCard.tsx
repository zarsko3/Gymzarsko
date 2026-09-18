import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import type { SessionRecord } from '../../utils/workoutSummary'
import { hapticSuccess } from '../../utils/haptic'

interface SessionRecordsCardProps {
  records: SessionRecord[]
}

function describeImprovement(record: SessionRecord) {
  return record.kind === 'weight' ? `+${record.improvement} kg` : `+${record.improvement} reps`
}

/** Records broken in this workout, revealed with a small celebration */
function SessionRecordsCard({ records }: SessionRecordsCardProps) {
  const shouldReduceMotion = useReducedMotion() ?? false

  useEffect(() => {
    if (records.length > 0) hapticSuccess()
  }, [records.length])

  if (records.length === 0) return null

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
      className="rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 p-4"
    >
      <div className="flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-200">
        <motion.span
          initial={shouldReduceMotion ? false : { rotate: -20, scale: 0.6 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 10, delay: 0.35 }}
          className="inline-flex"
        >
          <Trophy size={20} />
        </motion.span>
        <h3 className="font-semibold">
          {records.length === 1 ? 'New record' : `${records.length} new records`}
        </h3>
      </div>

      <div className="space-y-2">
        {records.map((record, index) => (
          <motion.div
            key={record.exerciseName}
            initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + index * 0.1 }}
            className="flex items-center justify-between gap-3 text-sm text-amber-900 dark:text-amber-100"
          >
            <span className="truncate">{record.exerciseName}</span>
            <span className="flex-shrink-0 font-medium tabular-nums">
              {record.weight} × {record.reps}
              <span className="ml-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                {describeImprovement(record)}
              </span>
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default SessionRecordsCard
