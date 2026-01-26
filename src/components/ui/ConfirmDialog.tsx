import { AlertTriangle, Trash2, LogOut, X } from 'lucide-react'
import Button from './Button'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  icon?: 'warning' | 'delete' | 'logout' | 'none'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

/**
 * Reusable confirmation dialog content for use inside Modal
 * Replaces window.confirm() with a themed, touch-friendly alternative
 */
function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  icon = 'warning',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const iconComponents = {
    warning: <AlertTriangle size={32} className="text-amber-500" />,
    delete: <Trash2 size={32} className="text-red-500" />,
    logout: <LogOut size={32} className="text-[var(--text-secondary)]" />,
    none: null,
  }

  const confirmButtonVariant = variant === 'destructive' ? 'primary' : 'primary'
  const confirmButtonClass = variant === 'destructive'
    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-400'
    : ''

  return (
    <div className="text-center py-2">
      {/* Icon */}
      {icon !== 'none' && (
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
            {iconComponents[icon]}
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      {/* Message */}
      <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
        {message}
      </p>

      {/* Actions - Large touch targets for gym use */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onCancel}
          disabled={isLoading}
          className="order-2 sm:order-1"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={confirmButtonVariant}
          size="lg"
          fullWidth
          onClick={onConfirm}
          disabled={isLoading}
          className={`order-1 sm:order-2 ${confirmButtonClass}`}
        >
          {isLoading ? 'Please wait...' : confirmLabel}
        </Button>
      </div>
    </div>
  )
}

export default ConfirmDialog
