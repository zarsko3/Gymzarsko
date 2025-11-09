import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement
      
      // Lock body scroll
      document.body.style.overflow = 'hidden'
      
      // Focus the modal container for accessibility
      if (modalRef.current) {
        modalRef.current.focus()
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset'
      
      // Return focus to the previously focused element
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus()
      }
    }
    
    return () => {
      document.body.style.overflow = 'unset'
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus()
      }
    }
  }, [isOpen])

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const modal = modalRef.current
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    modal.addEventListener('keydown', handleTabKey)
    return () => {
      modal.removeEventListener('keydown', handleTabKey)
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  // Create portal root if it doesn't exist
  let portalRoot = document.getElementById('modal-root')
  if (!portalRoot) {
    portalRoot = document.createElement('div')
    portalRoot.id = 'modal-root'
    document.body.appendChild(portalRoot)
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container - Centered with padding */}
      <div className="relative z-[101] h-full w-full flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        {/* Modal Content */}
        <div 
          ref={modalRef}
          className={`
            relative w-full ${sizeStyles[size]} 
            max-h-[calc(100vh-1rem)] sm:max-h-[90vh]
            flex flex-col
            bg-card rounded-2xl shadow-2xl
            pointer-events-auto
            overflow-hidden
            animate-slide-up
          `}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          {/* Header */}
          {title && (
            <div 
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" 
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <h2 
                id="modal-title"
                className="text-xl font-semibold text-[var(--text-primary)]"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:opacity-70 hover:bg-[var(--bg-secondary)]"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
          )}

          {/* Content - Scrollable Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 overscroll-contain min-h-0">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div 
              className="px-6 py-4 border-t flex-shrink-0" 
              style={{ borderColor: 'var(--border-primary)' }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, portalRoot)
}

export default Modal

