'use client'

import { Activity, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

interface SystemMetricsProps {
  metrics: {
    totalAgents: number
    activeAgents: number
    idleAgents: number
    erroredAgents: number
    totalTasks: number
    completedTasks: number
    failedTasks: number
    averageResponseTime: number
    systemErrorRate: number
  }
}

function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export default function SystemMetrics({ metrics }: SystemMetricsProps) {
  const successRate =
    metrics.totalTasks > 0
      ? ((metrics.completedTasks / metrics.totalTasks) * 100).toFixed(1)
      : '100.0'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Agents */}
      <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total Agents
            </p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
              {metrics.totalAgents}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {metrics.activeAgents} active
              </span>
              <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                <div className="w-2 h-2 rounded-full bg-neutral-400" />
                {metrics.idleAgents} idle
              </span>
              {metrics.erroredAgents > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  {metrics.erroredAgents} error
                </span>
              )}
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Activity className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Task Completion */}
      <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Task Completion
            </p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
              {successRate}%
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle size={12} />
                {metrics.completedTasks} done
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <XCircle size={12} />
                {metrics.failedTasks} failed
              </span>
            </div>
          </div>
          <div className="p-3 bg-green-500/10 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Average Response Time */}
      <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Avg Response Time
            </p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
              {formatResponseTime(metrics.averageResponseTime)}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
              Across all agents
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-full">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              System Health
            </p>
            <p
              className={`text-3xl font-bold mt-2 ${
                metrics.systemErrorRate < 5
                  ? 'text-green-600 dark:text-green-400'
                  : metrics.systemErrorRate < 15
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {metrics.systemErrorRate < 5
                ? 'Healthy'
                : metrics.systemErrorRate < 15
                  ? 'Warning'
                  : 'Critical'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
              Error rate: {metrics.systemErrorRate.toFixed(1)}%
            </p>
          </div>
          <div
            className={`p-3 rounded-full ${
              metrics.systemErrorRate < 5
                ? 'bg-green-500/10'
                : metrics.systemErrorRate < 15
                  ? 'bg-yellow-500/10'
                  : 'bg-red-500/10'
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${
                metrics.systemErrorRate < 5
                  ? 'text-green-600'
                  : metrics.systemErrorRate < 15
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
