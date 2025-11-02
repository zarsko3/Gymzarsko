import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  chart?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ title, value, chart, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-text-secondary text-xs font-medium mb-2">{title}</div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        {chart && (
          <div className="flex-1 ml-3 h-12 flex items-end">
            {chart}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard

