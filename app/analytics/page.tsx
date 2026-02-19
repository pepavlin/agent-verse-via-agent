'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Zap,
  AlertCircle,
  Download,
} from 'lucide-react'

interface MetricsSummary {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  successRate: number
  averageLatency: number
  totalCost: number
  totalTokens: number
  averageTokensPerExecution: number
}

interface AgentMetrics {
  agentId: string
  agentName: string
  agentRole: string
  totalExecutions: number
  successRate: number
  averageLatency: number
  totalCost: number
}

interface TimeSeriesData {
  timestamp: string
  totalExecutions: number
  successRate: number
  averageLatency: number
  totalCost: number
}

interface ErrorData {
  errorType: string
  count: number
  examples: Array<{
    message: string
    timestamp: string
    agentName: string
  }>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ nickname: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [errorData, setErrorData] = useState<ErrorData[]>([])
  const [dateRange, setDateRange] = useState<{
    startDate: string
    endDate: string
  }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    const currentUser = simpleAuth.getUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
    }
  }, [router])

  useEffect(() => {
    if (user) {
      fetchAllData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, user])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchSummary(),
        fetchAgentMetrics(),
        fetchTimeSeriesData(),
        fetchErrorData(),
      ])
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      const response = await fetch(`/api/analytics/summary?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    }
  }

  const fetchAgentMetrics = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      const response = await fetch(`/api/analytics/agents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAgentMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch agent metrics:', error)
    }
  }

  const fetchTimeSeriesData = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        interval: 'day',
      })
      const response = await fetch(`/api/analytics/timeseries?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTimeSeriesData(data)
      }
    } catch (error) {
      console.error('Failed to fetch time-series data:', error)
    }
  }

  const fetchErrorData = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      const response = await fetch(`/api/analytics/errors?${params}`)
      if (response.ok) {
        const data = await response.json()
        setErrorData(data)
      }
    } catch (error) {
      console.error('Failed to fetch error data:', error)
    }
  }

  const handleExport = () => {
    const exportData = {
      summary,
      agentMetrics,
      timeSeriesData,
      errorData,
      dateRange,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${dateRange.startDate}-to-${dateRange.endDate}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLogout = () => {
    simpleAuth.logout()
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 dark:bg-neutral-950">
        <div className="text-lg text-primary-light">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 dark:from-neutral-950 to-neutral-100 dark:to-neutral-900">
      <nav className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm shadow-sm border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
              >
                AgentVerse
              </Link>
              <Link
                href="/agents"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Agent List
              </Link>
              <Link
                href="/analytics"
                className="text-sm font-medium text-primary dark:text-primary-light"
              >
                Analytics
              </Link>
              <Link
                href="/visualization"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Visualization
              </Link>
              <Link
                href="/live-agents"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Live Map
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-neutral-600 dark:text-neutral-300">
                {user.nickname}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 rounded-md border border-neutral-200 dark:border-neutral-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              Agent Analytics
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Performance metrics and insights for your agents
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export Data</span>
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 flex items-center gap-4 bg-white dark:bg-neutral-800/50 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Date Range:
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          />
          <span className="text-neutral-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          />
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Total Executions
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                    {summary.totalExecutions}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-medium">
                  {summary.successfulExecutions}
                </span>
                <span className="text-neutral-500">successful</span>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Success Rate
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                    {summary.successRate.toFixed(1)}%
                  </p>
                </div>
                {summary.successRate >= 95 ? (
                  <TrendingUp className="w-8 h-8 text-green-500" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-orange-500" />
                )}
              </div>
              <div className="mt-4 text-sm text-neutral-500">
                {summary.failedExecutions} failed executions
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Avg Latency
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                    {(summary.averageLatency / 1000).toFixed(2)}s
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="mt-4 text-sm text-neutral-500">
                Average response time
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Total Cost
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                    ${(summary.totalCost / 100).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4 text-sm text-neutral-500">
                {summary.totalTokens.toLocaleString()} tokens used
              </div>
            </div>
          </div>
        )}

        {/* Agent Comparison Table */}
        <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
              Agent Performance Comparison
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Compare metrics across all your agents
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Agent Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Executions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Avg Latency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800/30 divide-y divide-neutral-200 dark:divide-neutral-700">
                {agentMetrics.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400"
                    >
                      No agent metrics available for the selected date range
                    </td>
                  </tr>
                ) : (
                  agentMetrics.map((agent) => (
                    <tr
                      key={agent.agentId}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {agent.agentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {agent.agentRole || 'executor'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                        {agent.totalExecutions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-medium ${
                            agent.successRate >= 95
                              ? 'text-green-600'
                              : agent.successRate >= 80
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {agent.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                        {(agent.averageLatency / 1000).toFixed(2)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                        ${(agent.totalCost / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Time Series Chart */}
        {timeSeriesData.length > 0 && (
          <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700 mb-8">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                Performance Over Time
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Daily metrics trends
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {timeSeriesData.slice(-10).map((data, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-neutral-600 dark:text-neutral-400">
                      {data.timestamp}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {data.totalExecutions} executions
                        </span>
                        <span className="text-xs text-neutral-500">
                          ({data.successRate.toFixed(1)}% success)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (data.totalExecutions / Math.max(...timeSeriesData.map(d => d.totalExecutions))) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 w-24 text-right">
                      ${(data.totalCost / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Analysis */}
        {errorData.length > 0 && (
          <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Error Analysis
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Common errors and their frequency
              </p>
            </div>
            <div className="p-6 space-y-4">
              {errorData.map((error, index) => (
                <div
                  key={index}
                  className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                      {error.errorType}
                    </h4>
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded">
                      {error.count} occurrences
                    </span>
                  </div>
                  {error.examples.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {error.examples.slice(0, 2).map((example, exIndex) => (
                        <div
                          key={exIndex}
                          className="text-sm bg-neutral-50 dark:bg-neutral-800 p-2 rounded"
                        >
                          <p className="text-neutral-700 dark:text-neutral-300 truncate">
                            {example.message}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {example.agentName} •{' '}
                            {new Date(example.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
