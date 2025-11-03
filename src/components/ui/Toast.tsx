import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

const toastColors = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
}

function ToastComponent({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, 2500)

    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const Icon = toastIcons[toast.type]
  const colorClasses = toastColors[toast.type]

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[280px] max-w-[90vw] ${colorClasses}`}
      style={{ willChange: 'transform, opacity' }}
      role="alert"
      aria-live="polite"
    >
      <Icon size={20} className="flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div 
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ 
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastComponent toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

