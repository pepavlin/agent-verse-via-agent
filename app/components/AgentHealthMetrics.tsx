'use client'

interface AgentHealthMetricsProps {
  metrics: {
    tasksCompleted: number
    averageResponseTime: number
    errorRate: number
    activityFrequency: number
  }
}

export default function AgentHealthMetrics({ metrics }: AgentHealthMetricsProps) {
  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getErrorRateColor = (rate: number) => {
    if (rate === 0) return 'text-green-600 dark:text-green-400'
    if (rate < 5) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
        <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          Tasks Completed
        </div>
        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {metrics.tasksCompleted}
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
        <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          Avg Response Time
        </div>
        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {formatResponseTime(metrics.averageResponseTime)}
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
        <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          Error Rate
        </div>
        <div className={`text-2xl font-bold ${getErrorRateColor(metrics.errorRate)}`}>
          {metrics.errorRate.toFixed(1)}%
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
        <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          Activity (24h)
        </div>
        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {metrics.activityFrequency}
        </div>
      </div>
    </div>
  )
}
