import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

function Card({ children, className = '', onClick }: CardProps) {
  const baseStyles = 'bg-card rounded-xl shadow-sm p-4'
  const clickableStyles = onClick ? 'cursor-pointer hover:shadow-md transition-shadow active:shadow-sm' : ''

  return (
    <div 
      className={`${baseStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

export default Card

