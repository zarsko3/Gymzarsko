import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import PrivateRoute from './components/auth/PrivateRoute'
import Layout from './components/layout/Layout'
import SplashScreen from './components/SplashScreen'

const HomePage = lazy(() => import('./pages/HomePage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const WorkoutDetailPage = lazy(() => import('./pages/WorkoutDetailPage'))
const WorkoutsPage = lazy(() => import('./pages/WorkoutsPage'))
const ActiveWorkoutPage = lazy(() => import('./pages/ActiveWorkoutPage'))
const WorkoutSummaryPage = lazy(() => import('./pages/WorkoutSummaryPage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const ExerciseDetailPage = lazy(() => import('./pages/ExerciseDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <SplashScreen minDurationMs={900} onePerSession={true} />
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">
                Loading...
              </div>
            }
          >
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected routes */}
              <Route
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="workout/detail/:workoutId" element={<WorkoutDetailPage />} />
                <Route path="workouts" element={<WorkoutsPage />} />
                <Route path="workout/active" element={<ActiveWorkoutPage />} />
                <Route path="workout/summary" element={<WorkoutSummaryPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="progress/exercise/:exerciseId" element={<ExerciseDetailPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Catch-all for non-matching public routes */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App

