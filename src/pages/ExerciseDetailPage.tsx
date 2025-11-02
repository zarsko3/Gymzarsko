import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronLeft, Trophy, TrendingUp, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Card from '../components/ui/Card'
import { getExerciseHistory, getExercisePRs, getExerciseVolumeHistory } from '../services/progressService'
import { getAllExercises } from '../services/workoutService'

function ExerciseDetailPage() {
  const navigate = useNavigate()
  const { exerciseId } = useParams<{ exerciseId: string }>()
  
  if (!exerciseId) {
    navigate('/progress')
    return null
  }

  const exercise = getAllExercises().find(e => e.id === exerciseId)
  const history = getExerciseHistory(exerciseId)
  const volumeHistory = getExerciseVolumeHistory(exerciseId)
  const prs = getExercisePRs()
  const pr = prs.get(exerciseId)

  if (!exercise || history.length === 0) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-mint flex items-center justify-center">
            <Trophy size={40} className="text-primary-500" strokeWidth={2} />
          </div>

          {/* Text Content */}
          <h3 className="text-2xl font-bold text-text-primary mb-3">
            No Data Available
          </h3>
          <p className="text-text-secondary mb-8 text-base leading-relaxed">
            {exercise ? `You haven't performed ${exercise.name} yet. Start a workout to see your progress here.` : 'This exercise hasn\'t been performed yet'}
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/progress')}
            className="text-primary-500 font-semibold hover:text-primary-600 transition-colors text-lg"
          >
            ← Back to Progress
          </button>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const volumeChartData = volumeHistory.map(entry => ({
    date: format(entry.date, 'MMM d'),
    volume: Math.round(entry.volume),
  }))

  // Group history by date and calculate max weight
  const weightByDate = new Map<string, number>()
  history.forEach(entry => {
    const dateKey = format(entry.date, 'MMM d')
    const existing = weightByDate.get(dateKey)
    if (!existing || entry.weight > existing) {
      weightByDate.set(dateKey, entry.weight)
    }
  })

  const weightChartData = Array.from(weightByDate.entries()).map(([date, weight]) => ({
    date,
    weight,
  }))

  return (
    <div className="min-h-screen pb-20 bg-accent-card">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate('/progress')}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-text-primary text-center flex-1 px-4">
            {exercise.name}
          </h1>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Exercise Info */}
        <Card className="bg-white">
          <div className="text-center">
            <div className="text-sm text-text-secondary mb-1">Muscle Group</div>
            <div className="text-lg font-semibold text-text-primary">{exercise.muscleGroup}</div>
          </div>
        </Card>

        {/* PR Card */}
        {pr && (
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                <Trophy size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-text-secondary mb-1">Personal Record</div>
                <div className="text-2xl font-bold text-text-primary">
                  {pr.weight} kg × {pr.reps}
                </div>
                <div className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                  <Calendar size={12} />
                  {format(pr.date, 'MMMM d, yyyy')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-text-secondary">Volume</div>
                <div className="text-xl font-bold text-primary-500">{pr.volume} kg</div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white text-center p-4">
            <div className="text-2xl font-bold text-primary-500">{history.length}</div>
            <div className="text-text-secondary text-xs mt-1">Total Sets</div>
          </Card>
          <Card className="bg-white text-center p-4">
            <div className="text-2xl font-bold text-primary-500">
              {new Set(history.map(h => format(h.date, 'yyyy-MM-dd'))).size}
            </div>
            <div className="text-text-secondary text-xs mt-1">Sessions</div>
          </Card>
          <Card className="bg-white text-center p-4">
            <div className="text-2xl font-bold text-primary-500">
              {Math.round(history.reduce((sum, h) => sum + h.volume, 0))}
            </div>
            <div className="text-text-secondary text-xs mt-1">Total (kg)</div>
          </Card>
        </div>

        {/* Volume Chart */}
        {volumeChartData.length > 1 && (
          <Card className="bg-white p-4">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-500" />
              Volume Progress
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={volumeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  style={{ fontSize: '12px' }}
                  stroke="#64748B"
                />
                <YAxis 
                  style={{ fontSize: '12px' }}
                  stroke="#64748B"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Weight Chart */}
        {weightChartData.length > 1 && (
          <Card className="bg-white p-4">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-primary-500" />
              Max Weight Progress
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  style={{ fontSize: '12px' }}
                  stroke="#64748B"
                />
                <YAxis 
                  style={{ fontSize: '12px' }}
                  stroke="#64748B"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Recent Sets */}
        <div className="space-y-3">
          <h3 className="font-semibold text-text-primary">Recent Sets</h3>
          <Card className="bg-white">
            <div className="space-y-2">
              {history.slice(-10).reverse().map((entry, index) => (
                <div 
                  key={entry.id}
                  className={`flex items-center justify-between py-2 ${
                    index !== 0 ? 'border-t border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-secondary">
                      {format(entry.date, 'MMM d')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-semibold text-text-primary">{entry.weight} kg</span>
                      <span className="text-text-secondary"> × {entry.reps}</span>
                    </div>
                    <div className="text-sm font-medium text-primary-500 w-16 text-right">
                      {entry.volume} kg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ExerciseDetailPage

