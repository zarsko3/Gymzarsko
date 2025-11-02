import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical, ChevronRight, Clock, Dumbbell, Plus, Flame, Activity } from 'lucide-react'
import type { WorkoutType, WorkoutTemplate } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getTemplatesByType, createWorkoutFromTemplate } from '../services/templateService'
import { startWorkout as saveWorkout } from '../services/workoutService'

const workoutTypes = [
  { id: 'push' as WorkoutType, name: 'Push Day', description: 'Chest, Shoulders, Triceps', color: 'bg-blue-50 border-blue-200', Icon: Dumbbell },
  { id: 'pull' as WorkoutType, name: 'Pull Day', description: 'Back, Biceps, Rear Delts', color: 'bg-green-50 border-green-200', Icon: Flame },
  { id: 'legs' as WorkoutType, name: 'Leg Day', description: 'Quads, Hamstrings, Calves', color: 'bg-purple-50 border-purple-200', Icon: Activity },
]

function StartWorkoutPage() {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  const templates = selectedType ? getTemplatesByType(selectedType) : []

  const handleStartFromTemplate = (template: WorkoutTemplate) => {
    const workout = createWorkoutFromTemplate(template)
    const savedWorkout = saveWorkout(workout.type)
    // Update the workout with template exercises
    savedWorkout.exercises = workout.exercises
    localStorage.setItem('gymzarski_current_workout', JSON.stringify(savedWorkout))
    navigate('/workout/active')
  }

  const handleQuickStart = (type: WorkoutType) => {
    navigate(`/workout/active?type=${type}`)
  }

  const handleSelectType = (type: WorkoutType) => {
    setSelectedType(type)
    setShowTemplates(true)
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-accent-card border-b border-gray-100 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-primary-600">Start Workout</h1>
          <button className="text-text-secondary hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {!showTemplates ? (
          <>
            {/* Page Title */}
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Start Workout</h2>
              <p className="text-text-secondary mt-1">Choose your workout type</p>
            </div>

            {/* Workout Type Cards */}
            <div className="space-y-3">
              {workoutTypes.map((workout) => (
                <Card
                  key={workout.id}
                  className={`${workout.color} border-2 transition-all`}
                >
                  <div className="space-y-3 p-2">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                        <workout.Icon size={24} strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary text-lg">
                          {workout.name}
                        </h3>
                        <p className="text-text-secondary text-sm mt-0.5">
                          {workout.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        fullWidth
                        variant="primary"
                        onClick={() => handleQuickStart(workout.id)}
                        className="flex-1"
                      >
                        <Plus size={16} />
                        Quick Start
                      </Button>
                      <Button
                        fullWidth
                        variant="secondary"
                        onClick={() => handleSelectType(workout.id)}
                        className="flex-1"
                      >
                        <Dumbbell size={16} />
                        Templates
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Back to Workout Selection */}
            <button
              onClick={() => setShowTemplates(false)}
              className="flex items-center gap-2 text-primary-500 font-medium hover:text-primary-600 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Back to Workout Types</span>
            </button>

            {/* Selected Workout Type Header */}
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {workoutTypes.find(w => w.id === selectedType)?.name} Templates
              </h2>
              <p className="text-text-secondary mt-1">Choose a template to start</p>
            </div>

            {/* Quick Start Option */}
            <Button
              fullWidth
              size="lg"
              onClick={() => selectedType && handleQuickStart(selectedType)}
              className="bg-gradient-to-r from-primary-500 to-primary-600"
            >
              <Plus size={20} />
              Quick Start (Empty Workout)
            </Button>

            {/* Templates List */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-text-primary">Available Templates</h3>
              
              {templates.length === 0 ? (
                <Card className="text-center py-8 bg-accent-mint">
                  <Dumbbell size={40} className="mx-auto text-primary-500 mb-2" strokeWidth={1.5} />
                  <p className="text-text-secondary text-sm">No templates yet for this workout type</p>
                </Card>
              ) : (
                templates.map((template) => (
                  <Card
                    key={template.id}
                    onClick={() => handleStartFromTemplate(template)}
                    className="hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-text-primary text-lg">{template.name}</h4>
                          {template.description && (
                            <p className="text-text-secondary text-sm mt-0.5">{template.description}</p>
                          )}
                        </div>
                        <ChevronRight size={20} className="text-text-secondary flex-shrink-0 ml-2" />
                      </div>

                      {/* Template Info */}
                      <div className="flex items-center gap-4 text-text-secondary text-sm">
                        <div className="flex items-center gap-1">
                          <Dumbbell size={16} />
                          <span>{template.exercises.length} exercises</span>
                        </div>
                        {template.lastUsed && (
                          <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>Used {template.useCount} {template.useCount === 1 ? 'time' : 'times'}</span>
                          </div>
                        )}
                        {!template.isCustom && (
                          <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                            Default
                          </span>
                        )}
                      </div>

                      {/* Exercise List Preview */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="text-xs text-text-secondary space-y-1">
                          {template.exercises.slice(0, 3).map((ex, i) => (
                            <div key={i}>
                              • {ex.exercise.name} - {ex.sets} sets
                              {ex.targetWeight && ex.targetReps && (
                                <span className="ml-1">({ex.targetWeight}kg × {ex.targetReps} reps)</span>
                              )}
                            </div>
                          ))}
                          {template.exercises.length > 3 && (
                            <div className="text-text-inactive">
                              +{template.exercises.length - 3} more exercises
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default StartWorkoutPage

