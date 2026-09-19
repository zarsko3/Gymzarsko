import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { getGreeting } from '../../utils/workoutTypeStats'

interface HomeHeaderProps {
  name: string
}

function HomeHeader({ name }: HomeHeaderProps) {
  const navigate = useNavigate()
  const now = new Date()
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-[var(--text-secondary)]">{format(now, 'EEEE, MMM d')}</p>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] truncate">
          {getGreeting(now)}, {name}
        </h1>
      </div>
      <button
        type="button"
        onClick={() => navigate('/settings')}
        className="w-11 h-11 flex-shrink-0 rounded-full bg-primary-100 text-primary-600 dark:text-primary-600 font-semibold flex items-center justify-center"
        aria-label="Open settings"
      >
        {initial}
      </button>
    </div>
  )
}

export default HomeHeader
