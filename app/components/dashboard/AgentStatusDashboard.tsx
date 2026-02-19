'use client'

import { useEffect, useState } from 'react'
import { DashboardStats, AgentHealthMetrics, ErrorLog } from '@/types'
import DashboardStatsComponent from './DashboardStats'
import AgentHealthCard from './AgentHealthCard'
import ErrorLogViewer from './ErrorLogViewer'

export default function AgentStatusDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [agents, setAgents] = useState<AgentHealthMetrics[]>([])
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchDashboardData = async () => {
    try {
      // Fetch metrics
      const metricsRes = await fetch('/api/dashboard/metrics')
      const metricsData = await metricsRes.json()
      
      setStats(metricsData.stats)
      setAgents(metricsData.agents)

      // Fetch errors
      const errorsRes = await fetch('/api/dashboard/errors?limit=20')
      const errorsData = await errorsRes.json()
      setErrors(errorsData.errors)

      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Agent Status Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time monitoring and health metrics
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Last updated</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={fetchDashboardData}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {stats && <DashboardStatsComponent stats={stats} />}

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Agent Health</h2>
          {agents.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No agents found. Create your first agent to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <AgentHealthCard key={agent.agentId} metrics={agent} />
              ))}
            </div>
          )}
        </div>

        <ErrorLogViewer errors={errors} />
      </div>
    </div>
  )
}
