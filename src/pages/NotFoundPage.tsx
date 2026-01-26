import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 text-center gap-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-[var(--text-secondary)]">404</p>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Page not found</h1>
        <p className="text-[var(--text-secondary)]">
          We couldn&apos;t find what you were looking for. Check the URL or return home to continue tracking your workouts.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}

export default NotFoundPage

