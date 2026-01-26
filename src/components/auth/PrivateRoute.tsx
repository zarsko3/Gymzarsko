import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface PrivateRouteProps {
  children: React.ReactNode
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const { currentUser, loading } = useAuth()

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default PrivateRoute

