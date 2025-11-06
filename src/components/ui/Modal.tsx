import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <>
      {/* Full Screen Backdrop - Fixed to cover entire screen */}
      <div 
        className="fixed inset-0 z-50 transition-opacity"
        style={{ backgroundColor: 'var(--overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
        {/* Modal - Bottom Sheet on Mobile, Centered on Desktop */}
        <div 
          className={`
            relative bg-card rounded-t-2xl sm:rounded-2xl w-full ${sizeStyles[size]}
            h-[95vh] sm:h-auto sm:max-h-[85vh] flex flex-col
            animate-slide-up shadow-2xl
            pointer-events-auto
            mb-0 sm:mb-0
          `}
          style={{ 
            maxHeight: '95vh',
            height: '95vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Drag Handle (Mobile Only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-secondary)' }} />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-primary)' }}>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:opacity-70"
              style={{ backgroundColor: 'transparent' }}
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border-primary)' }}>
            {footer}
          </div>
        )}
        </div>
      </div>
    </>
  )
}

export default Modal

