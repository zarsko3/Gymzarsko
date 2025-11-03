import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-accent-card max-w-full w-full">
      {/* Main content area */}
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden w-full"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)',
        }}
      >
        <div className="max-w-md mx-auto w-full overflow-x-hidden px-0">
          {children}
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}

export default Layout

