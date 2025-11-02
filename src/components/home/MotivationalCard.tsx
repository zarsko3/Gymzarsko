import { Moon, Dumbbell, Flame, Activity, Zap, Award, Sun } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

interface DayMotivation {
  Icon: IconComponent
  message: string
}

const dailyMotivations: Record<string, DayMotivation> = {
  Sunday: {
    Icon: Moon,
    message: "Rest and recharge — tomorrow's a new start."
  },
  Monday: {
    Icon: Dumbbell,
    message: "New week, new energy — let's crush it."
  },
  Tuesday: {
    Icon: Flame,
    message: "Keep the fire alive — stay focused."
  },
  Wednesday: {
    Icon: Activity,
    message: "Halfway there — consistency wins."
  },
  Thursday: {
    Icon: Zap,
    message: "Power through — almost weekend!"
  },
  Friday: {
    Icon: Award,
    message: "Finish strong — celebrate your progress."
  },
  Saturday: {
    Icon: Sun,
    message: "Enjoy movement — feel the weekend energy."
  }
}

interface MotivationalCardProps {
  message?: string
  icon?: string
}

function MotivationalCard({ message, icon }: MotivationalCardProps) {
  // Get current day of week
  const today = new Date()
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' })
  
  // Get motivation for today, default to Sunday if not found
  const { Icon, message: dailyMessage } = dailyMotivations[weekday] || dailyMotivations.Sunday
  
  // Use custom message if provided, otherwise use daily message
  const displayMessage = message || dailyMessage

  return (
    <div className="bg-accent-mint rounded-2xl p-8 text-center">
      <div className="flex justify-center mb-4 text-primary-600">
        <Icon size={40} strokeWidth={2} />
      </div>
      <p className="text-text-primary font-medium text-base leading-relaxed">
        {displayMessage}
      </p>
    </div>
  )
}

export default MotivationalCard

