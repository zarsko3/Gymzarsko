import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronLeft, Plus, Settings, TrendingUp, Target, Edit2 } from 'lucide-react'
import Card from '../components/ui/Card'
import AddMetricModal from '../components/bodyMetrics/AddMetricModal'
import EditMetricModal from '../components/bodyMetrics/EditMetricModal'
import MetricChart from '../components/bodyMetrics/MetricChart'
import GoalSettings from '../components/bodyMetrics/GoalSettings'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeToBodyMetrics,
  getBodyMetricGoal,
  getLatestBodyMetric,
} from '../services/firestoreBodyMetricsService'
import type { BodyMetricEntry, BodyMetricGoal } from '../types'

type TimeRange = '7d' | '30d' | '90d' | 'all'

function ProgressPage() {
  const navigate = useNavigate()
  const { currentUser, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<BodyMetricEntry[]>([])
  const [goal, setGoal] = useState<BodyMetricGoal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<BodyMetricEntry | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  // Load goal on mount (only when auth is ready)
  useEffect(() => {
    if (!authLoading && currentUser) {
      loadGoal()
    }
  }, [authLoading, currentUser])

  // Subscribe to body metrics (only when auth is ready)
  useEffect(() => {
    if (!authLoading && currentUser) {
      setIsLoading(true)
      const unsubscribe = subscribeToBodyMetrics((metrics) => {
        setEntries(metrics)
        setIsLoading(false)
      })

      return () => {
        unsubscribe()
      }
    } else {
      setIsLoading(false)
    }
  }, [authLoading, currentUser])

  const loadGoal = async () => {
    try {
      const goalData = await getBodyMetricGoal()
      setGoal(goalData)
    } catch (error) {
      console.error('Error loading goal:', error)
    }
  }

  const handleAdd = () => {
    setShowAddModal(true)
  }

  const handleEdit = (entry: BodyMetricEntry) => {
    setSelectedEntry(entry)
    setShowEditModal(true)
  }

  const handleSave = () => {
    // Data will refresh automatically via subscription
    loadGoal() // Reload goal in case it changed
  }

  const handleDelete = () => {
    // Data will refresh automatically via subscription
  }

  // Get latest entry for current weight
  const latestEntry = entries.length > 0 ? entries[0] : null

  // Calculate progress to goal
  const progressToGoal = goal && latestEntry
    ? latestEntry.weight - goal.targetWeight
    : null

  // Get recent entries (last 7)
  const recentEntries = entries.slice(0, 7)

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    )
  }

  // Empty state
  if (!isLoading && entries.length === 0) {
    return (
      <div className="min-h-full">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-lg font-semibold text-primary-600">Body Metrics</h1>
            <button 
              onClick={handleAdd}
              className="text-primary-500 hover:text-primary-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Add weight entry"
            >
              <Plus size={24} />
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
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              No Metrics Logged Yet
            </h3>
            <p className="text-[var(--text-secondary)] mb-8 text-base leading-relaxed">
              Start tracking your weight to see your progress over time
            </p>

            {/* CTA Button */}
            <button
              onClick={handleAdd}
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Log Your First Weight
            </button>
          </div>
        </div>

        <AddMetricModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSave}
        />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-primary-600">Body Metrics</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowGoalModal(true)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Goal settings"
            >
              <Target size={20} />
            </button>
            <button 
              onClick={handleAdd}
              className="text-primary-500 hover:text-primary-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Add weight entry"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card text-center p-4">
            <div className="text-2xl font-bold text-primary-500">
              {latestEntry ? `${latestEntry.weight.toFixed(1)}` : '--'}
            </div>
            <div className="text-[var(--text-secondary)] text-xs mt-1">Current (kg)</div>
          </Card>
          <Card className="bg-card text-center p-4">
            <div className="text-2xl font-bold text-primary-500">
              {goal ? `${goal.targetWeight.toFixed(1)}` : '--'}
            </div>
            <div className="text-[var(--text-secondary)] text-xs mt-1">Goal (kg)</div>
          </Card>
          <Card className="bg-card text-center p-4">
            <div className={`text-2xl font-bold ${
              progressToGoal !== null
                ? progressToGoal <= 0
                  ? 'text-green-500'
                  : 'text-primary-500'
                : 'text-[var(--text-inactive)]'
            }`}>
              {progressToGoal !== null
                ? progressToGoal <= 0
                  ? `${Math.abs(progressToGoal).toFixed(1)}`
                  : `+${progressToGoal.toFixed(1)}`
                : '--'}
            </div>
            <div className="text-[var(--text-secondary)] text-xs mt-1">
              {progressToGoal !== null && progressToGoal <= 0 ? 'To Goal' : 'Progress'}
            </div>
          </Card>
        </div>

        {/* Chart */}
        <MetricChart
          entries={entries}
          goal={goal}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />

        {/* Recent Entries */}
        <div className="space-y-3">
          <h3 className="font-semibold text-[var(--text-primary)]">Recent Entries</h3>
          {recentEntries.length === 0 ? (
            <Card className="bg-card text-center py-8">
              <TrendingUp size={48} className="mx-auto text-[var(--text-inactive)] mb-3" />
              <p className="text-[var(--text-secondary)]">No entries yet</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className="bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold text-[var(--text-primary)]">
                          {entry.weight.toFixed(1)} kg
                        </div>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">
                        {format(entry.date, 'EEEE, MMM d, yyyy')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-[var(--text-secondary)] hover:text-primary-500 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                      aria-label="Edit entry"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddMetricModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSave}
      />

      <EditMetricModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedEntry(null)
        }}
        entry={selectedEntry}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <GoalSettings
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSave={handleSave}
      />
    </div>
  )
}

export default ProgressPage
