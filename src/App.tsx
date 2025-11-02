import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import WorkoutsPage from './pages/WorkoutsPage'
import StartWorkoutPage from './pages/StartWorkoutPage'
import ActiveWorkoutPage from './pages/ActiveWorkoutPage'
import WorkoutSummaryPage from './pages/WorkoutSummaryPage'
import ProgressPage from './pages/ProgressPage'
import ExerciseDetailPage from './pages/ExerciseDetailPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/workout/detail/:workoutId" element={<WorkoutDetailPage />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/workout/start" element={<StartWorkoutPage />} />
        <Route path="/workout/active" element={<ActiveWorkoutPage />} />
        <Route path="/workout/summary" element={<WorkoutSummaryPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/progress/exercise/:exerciseId" element={<ExerciseDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Layout>
  )
}

export default App

