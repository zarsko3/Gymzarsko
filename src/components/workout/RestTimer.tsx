import { useState, useEffect } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import Button from '../ui/Button'

interface RestTimerProps {
  isOpen: boolean
  onClose: () => void
  defaultDuration?: number
}

function RestTimer({ isOpen, onClose, defaultDuration = 90 }: RestTimerProps) {
  const [duration, setDuration] = useState(defaultDuration)
  const [timeLeft, setTimeLeft] = useState(defaultDuration)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false)
      setTimeLeft(duration)
      return
    }

    setIsRunning(true)
    setTimeLeft(duration)
  }, [isOpen, duration])

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          // Play a sound notification here if needed
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const adjustTime = (amount: number) => {
    const newTime = Math.max(10, Math.min(600, duration + amount))
    setDuration(newTime)
    if (!isRunning) {
      setTimeLeft(newTime)
    }
  }

  const handleSkip = () => {
    setIsRunning(false)
    onClose()
  }

  if (!isOpen) return null

  const progress = (timeLeft / duration) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">Rest Timer</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          {/* Progress Circle */}
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="#10B981"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              className="transition-all duration-1000"
            />
          </svg>

          {/* Time Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary-500">
                {formatTime(timeLeft)}
              </div>
              <div className="text-text-secondary text-sm mt-2">
                {timeLeft === 0 ? "Rest Complete!" : "Remaining"}
              </div>
            </div>
          </div>
        </div>

        {/* Time Adjustment */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => adjustTime(-15)}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={duration <= 10}
          >
            <Minus size={20} />
          </button>
          <div className="text-text-secondary text-sm min-w-[60px] text-center">
            {formatTime(duration)}
          </div>
          <button
            onClick={() => adjustTime(15)}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={duration >= 600}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            fullWidth
            variant={isRunning ? "secondary" : "primary"}
            onClick={() => {
              if (isRunning) {
                setIsRunning(false)
              } else {
                setIsRunning(true)
                if (timeLeft === 0) {
                  setTimeLeft(duration)
                }
              }
            }}
          >
            {isRunning ? "Pause" : timeLeft === 0 ? "Restart" : "Resume"}
          </Button>
          <Button
            fullWidth
            variant="ghost"
            onClick={handleSkip}
          >
            Skip Rest
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RestTimer

