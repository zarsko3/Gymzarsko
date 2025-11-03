import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import PrivateRoute from './components/auth/PrivateRoute'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import WorkoutsPage from './pages/WorkoutsPage'
import ActiveWorkoutPage from './pages/ActiveWorkoutPage'
import WorkoutSummaryPage from './pages/WorkoutSummaryPage'
import ProgressPage from './pages/ProgressPage'
import ExerciseDetailPage from './pages/ExerciseDetailPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/workout/detail/:workoutId" element={<WorkoutDetailPage />} />
                  <Route path="/workouts" element={<WorkoutsPage />} />
                  <Route path="/workout/active" element={<ActiveWorkoutPage />} />
                  <Route path="/workout/summary" element={<WorkoutSummaryPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/progress/exercise/:exerciseId" element={<ExerciseDetailPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App

