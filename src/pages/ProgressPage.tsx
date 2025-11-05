import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronLeft, MoreVertical, TrendingUp, Trophy, Calendar } from 'lucide-react'
import Card from '../components/ui/Card'
import { getExercisePRs, getPerformedExercises } from '../services/progressService'
import { getWorkouts } from '../services/workoutService'

function ProgressPage() {
  const navigate = useNavigate()
  const [selectedView, setSelectedView] = useState<'prs' | 'exercises'>('prs')
  
  const workouts = getWorkouts()
  const prs = getExercisePRs()
  const performedExercises = getPerformedExercises()

  if (workouts.length === 0) {
    return (
      <div className="min-h-full">
        {/* Header */}
        <div className="sticky top-0 bg-primary border-b border-border-primary z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-lg font-semibold text-primary-600">Progress</h1>
            <button className="text-text-secondary hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center">
              <MoreVertical size={24} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="max-w-sm w-full text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-mint flex items-center justify-center">
              <TrendingUp size={40} className="text-primary-500" strokeWidth={2} />
            </div>

            {/* Text Content */}
            <h3 className="text-2xl font-bold text-text-primary mb-3">
              No Progress Data Yet
            </h3>
            <p className="text-text-secondary mb-8 text-base leading-relaxed">
              Complete workouts to track your progress and see your personal records here
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 bg-primary border-b border-border-primary z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-primary-600">Progress</h1>
          <button className="text-text-secondary hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card text-center p-4">
            <div className="text-2xl font-bold text-primary-500">{workouts.length}</div>
            <div className="text-text-secondary text-xs mt-1">Workouts</div>
          </Card>
          <Card className="bg-card text-center p-4">
            <div className="text-2xl font-bold text-primary-500">{performedExercises.length}</div>
            <div className="text-text-secondary text-xs mt-1">Exercises</div>
          </Card>
          <Card className="bg-card text-center p-4">
            <div className="text-2xl font-bold text-primary-500">{prs.size}</div>
            <div className="text-text-secondary text-xs mt-1">PRs</div>
          </Card>
        </div>

        {/* View Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('prs')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              selectedView === 'prs'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <Trophy size={20} className="inline mr-2" />
            Personal Records
          </button>
          <button
            onClick={() => setSelectedView('exercises')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              selectedView === 'exercises'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <TrendingUp size={20} className="inline mr-2" />
            Exercises
          </button>
        </div>

        {/* Personal Records View */}
        {selectedView === 'prs' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">Your Personal Records</h3>
            {prs.size === 0 ? (
              <Card className="bg-card text-center py-8">
                <Trophy size={48} className="mx-auto text-text-inactive mb-3" />
                <p className="text-text-secondary">No PRs yet - complete more workouts!</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {Array.from(prs.entries()).map(([exerciseId, pr]) => {
                  const exercise = performedExercises.find(e => e.id === exerciseId)
                  if (!exercise) return null

                  return (
                    <Card 
                      key={exerciseId}
                      className="bg-card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/progress/exercise/${exerciseId}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Trophy size={20} className="text-yellow-500" />
                            <h4 className="font-semibold text-text-primary">{exercise.name}</h4>
                          </div>
                          <p className="text-sm text-text-secondary mt-1">{exercise.muscleGroup}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary-500 text-lg">
                            {pr.weight} kg × {pr.reps}
                          </div>
                          <div className="text-xs text-text-secondary flex items-center gap-1 justify-end mt-1">
                            <Calendar size={12} />
                            {format(pr.date, 'MMM d')}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Exercises View */}
        {selectedView === 'exercises' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">Exercise History</h3>
            {performedExercises.length === 0 ? (
              <Card className="bg-card text-center py-8">
                <TrendingUp size={48} className="mx-auto text-text-inactive mb-3" />
                <p className="text-text-secondary">No exercises logged yet</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {performedExercises.map(exercise => {
                  const pr = prs.get(exercise.id)

                  return (
                    <Card
                      key={exercise.id}
                      className="bg-card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/progress/exercise/${exercise.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-text-primary">{exercise.name}</h4>
                          <p className="text-sm text-text-secondary mt-1">{exercise.muscleGroup}</p>
                        </div>
                        {pr && (
                          <div className="text-right">
                            <div className="text-sm text-text-secondary">Best</div>
                            <div className="font-semibold text-primary-500">
                              {pr.weight} kg × {pr.reps}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressPage
