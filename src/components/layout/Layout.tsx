import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-full overflow-x-hidden max-w-full">
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-md mx-auto h-full w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}

export default Layout

