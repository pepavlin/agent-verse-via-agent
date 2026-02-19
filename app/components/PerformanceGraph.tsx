'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface PerformanceGraphProps {
  agentId: string
  agentName: string
}

interface PerformanceDataPoint {
  timestamp: Date
  responseTime: number
  success: boolean
}

export default function PerformanceGraph({ agentId, agentName }: PerformanceGraphProps) {
  const [history, setHistory] = useState<PerformanceDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceHistory()
    // Refresh every 5 seconds
    const interval = setInterval(fetchPerformanceHistory, 5000)
    return () => clearInterval(interval)
  }, [agentId])

  const fetchPerformanceHistory = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/performance-history`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to fetch performance history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-4">
          Performance History
        </h4>
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          Loading...
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-4">
          Performance History
        </h4>
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          No performance data available yet
        </div>
      </div>
    )
  }

  // Calculate statistics
  const successCount = history.filter((d) => d.success).length
  const failureCount = history.length - successCount
  const avgResponseTime =
    history.reduce((sum, d) => sum + d.responseTime, 0) / history.length
  const maxResponseTime = Math.max(...history.map((d) => d.responseTime))

  // Prepare chart data (last 20 points)
  const chartData = history.slice(-20)
  const maxValue = Math.max(...chartData.map((d) => d.responseTime))
  const chartHeight = 120

  return (
    <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          Performance History - {agentName}
        </h4>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <TrendingUp size={14} />
            {successCount} success
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <TrendingDown size={14} />
            {failureCount} failed
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-neutral-50 dark:bg-neutral-700/30 rounded p-2">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Avg Time</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {avgResponseTime < 1000
              ? `${Math.round(avgResponseTime)}ms`
              : `${(avgResponseTime / 1000).toFixed(2)}s`}
          </p>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-700/30 rounded p-2">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Max Time</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {maxResponseTime < 1000
              ? `${Math.round(maxResponseTime)}ms`
              : `${(maxResponseTime / 1000).toFixed(2)}s`}
          </p>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-700/30 rounded p-2">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Success Rate</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {((successCount / history.length) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Simple bar chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <div className="absolute inset-0 flex items-end justify-between gap-0.5">
          {chartData.map((point, index) => {
            const height = maxValue > 0 ? (point.responseTime / maxValue) * chartHeight : 0
            return (
              <div
                key={index}
                className="flex-1 relative group cursor-pointer"
                style={{ height: chartHeight }}
              >
                <div
                  className={`absolute bottom-0 left-0 right-0 rounded-t transition-all ${
                    point.success
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  style={{ height: `${height}px` }}
                />
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                  {point.responseTime < 1000
                    ? `${Math.round(point.responseTime)}ms`
                    : `${(point.responseTime / 1000).toFixed(2)}s`}
                  <br />
                  {point.success ? 'Success' : 'Failed'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* X-axis label */}
      <div className="flex justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span>Latest {chartData.length} tasks</span>
        <span>→ Time</span>
      </div>
    </div>
  )
}
