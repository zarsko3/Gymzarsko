import type { ReactNode } from 'react'
import type { KeyboardEvent } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

function Card({ children, className = '', onClick }: CardProps) {
  const baseStyles = 'bg-card rounded-xl shadow-sm p-4'
  const clickableStyles = onClick
    ? 'cursor-pointer hover:shadow-md transition-shadow active:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
    : ''

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div 
      className={`${baseStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}

export default Card

