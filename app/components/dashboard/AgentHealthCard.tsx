'use client'

import { AgentHealthMetrics } from '@/types'

interface AgentHealthCardProps {
  metrics: AgentHealthMetrics
}

const statusColors = {
  idle: 'bg-gray-500',
  thinking: 'bg-blue-500',
  communicating: 'bg-green-500',
  error: 'bg-red-500',
}

const statusLabels = {
  idle: 'Idle',
  thinking: 'Thinking',
  communicating: 'Communicating',
  error: 'Error',
}

const roleColors: Record<string, string> = {
  researcher: 'border-indigo-500',
  strategist: 'border-violet-500',
  critic: 'border-red-500',
  ideator: 'border-orange-500',
  coordinator: 'border-emerald-500',
  executor: 'border-cyan-500',
}

export default function AgentHealthCard({ metrics }: AgentHealthCardProps) {
  const statusColor = statusColors[metrics.currentStatus]
  const statusLabel = statusLabels[metrics.currentStatus]
  const roleColor = roleColors[metrics.role || 'unknown'] || 'border-gray-500'

  const formatLastActivity = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-md p-4 border-l-4 ${roleColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {metrics.agentName}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {metrics.role || 'unknown'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Avg Response</div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {metrics.averageResponseTime}ms
          </div>
        </div>
        <div>
          <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Success Rate</div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {metrics.successRate}%
          </div>
        </div>
        <div>
          <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Executions</div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {metrics.totalExecutions}
          </div>
        </div>
        <div>
          <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Errors</div>
          <div className="font-semibold text-red-600 dark:text-red-400">
            {metrics.errorCount}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-neutral-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last activity: {formatLastActivity(metrics.lastActivity)}
        </div>
      </div>
    </div>
  )
}
