import { Trophy } from 'lucide-react'
import { format } from 'date-fns'
import type { PersonalRecord } from '../../services/workoutAnalyticsService'
import Card from '../ui/Card'

interface RecentRecordsProps {
  records: PersonalRecord[]
  /** How many to show; the rest are summarised */
  limit?: number
}

function RecentRecords({ records, limit = 3 }: RecentRecordsProps) {
  if (records.length === 0) return null

  const shown = records.slice(0, limit)
  const remaining = records.length - shown.length

  return (
    <Card className="bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-primary-500" />
        <h3 className="font-semibold text-[var(--text-primary)]">New records</h3>
      </div>

      <div className="space-y-2">
        {shown.map((record) => (
          <div key={`${record.exerciseName}-${record.date.getTime()}`} className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--text-primary)] truncate">{record.exerciseName}</span>
            <span className="text-sm font-medium text-[var(--text-primary)] flex-shrink-0 tabular-nums">
              {record.weight} × {record.reps}
              <span className="text-[var(--text-secondary)] font-normal"> · {format(record.date, 'MMM d')}</span>
            </span>
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          and {remaining} more in the last two weeks
        </p>
      )}
    </Card>
  )
}

export default RecentRecords
