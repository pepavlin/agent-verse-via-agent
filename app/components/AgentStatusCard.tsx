'use client'

import { Clock, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface AgentStatusCardProps {
  agent: {
    agentId: string
    agentName: string
    role: string | null
    state: 'idle' | 'thinking' | 'communicating' | 'error'
    currentTask?: string
    lastActivity: Date
    metrics: {
      totalTasks: number
      completedTasks: number
      failedTasks: number
      averageResponseTime: number
      lastResponseTime?: number
      errorRate: number
    }
    color: string
  }
  onClick: () => void
  isSelected: boolean
}

const stateConfig = {
  idle: {
    label: 'Idle',
    color: 'bg-neutral-400',
    textColor: 'text-neutral-600 dark:text-neutral-400',
    borderColor: 'border-neutral-300 dark:border-neutral-600',
    icon: Activity,
  },
  thinking: {
    label: 'Thinking',
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-600',
    icon: Activity,
  },
  communicating: {
    label: 'Communicating',
    color: 'bg-green-500',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-600',
    icon: Activity,
  },
  error: {
    label: 'Error',
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-600',
    icon: AlertCircle,
  },
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return `${diffDay}d ago`
}

function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export default function AgentStatusCard({ agent, onClick, isSelected }: AgentStatusCardProps) {
  const config = stateConfig[agent.state]
  const StateIcon = config.icon

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
        isSelected
          ? 'border-primary shadow-lg scale-105'
          : `${config.borderColor} hover:border-primary/50`
      }`}
    >
      {/* Header with status indicator */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-3 h-3 rounded-full ${config.color} ${
                agent.state === 'thinking' || agent.state === 'communicating'
                  ? 'animate-pulse'
                  : ''
              }`}
            />
            <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {agent.agentName}
          </h3>
          {agent.role && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize mt-0.5">
              {agent.role}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: agent.color + '20', color: agent.color }}
        >
          <StateIcon size={20} />
        </div>
      </div>

      {/* Current task */}
      {agent.currentTask && (
        <div className="mb-3 p-2 bg-neutral-100 dark:bg-neutral-700/50 rounded text-xs text-neutral-700 dark:text-neutral-300">
          <span className="font-medium">Task:</span> {agent.currentTask}
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-neutral-50 dark:bg-neutral-700/30 rounded p-2">
          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <CheckCircle size={12} />
            <span>Completed</span>
          </div>
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {agent.metrics.completedTasks}
          </p>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-700/30 rounded p-2">
          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <XCircle size={12} />
            <span>Failed</span>
          </div>
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {agent.metrics.failedTasks}
          </p>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-700 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-600 dark:text-neutral-400">Avg Response</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-50">
            {formatResponseTime(agent.metrics.averageResponseTime)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-600 dark:text-neutral-400">Error Rate</span>
          <span
            className={`font-medium ${
              agent.metrics.errorRate > 20
                ? 'text-red-600 dark:text-red-400'
                : agent.metrics.errorRate > 10
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
            }`}
          >
            {agent.metrics.errorRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
          <Clock size={12} />
          <span>Last activity {formatTimeAgo(agent.lastActivity)}</span>
        </div>
      </div>
    </div>
  )
}
