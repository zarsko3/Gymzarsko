import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  /** Icon buttons shown on the right */
  actions?: ReactNode
}

/** Header for the bottom-nav tab screens. No back button: the tabs are the navigation. */
function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] z-10">
      <div className="flex items-center justify-between gap-3 px-4 min-h-[60px]">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    </div>
  )
}

export const headerIconButtonClass =
  'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors'

export default PageHeader
