import { NavLink } from 'react-router-dom'
import { Home, Clock, Dumbbell, Calendar, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/workouts', icon: Dumbbell, label: 'Workout' },
  { to: '/progress', icon: Calendar, label: 'Calendar' },
  { to: '/profile', icon: Settings, label: 'Settings' },
]

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom shadow-lg z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-[44px]
              ${isActive 
                ? 'text-primary-500' 
                : 'text-text-inactive hover:text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2 : 1.5}
                  className="mb-0.5"
                />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
