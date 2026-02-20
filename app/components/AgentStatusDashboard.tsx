'use client'

import { useState, useEffect } from 'react'
import StatusIndicator from './StatusIndicator'
import PerformanceGraph from './PerformanceGraph'
import Link from 'next/link'

interface AgentStatus {
  agentId: string
  name: string
  role: string | null
  color: string | null
  status: 'idle' | 'thinking' | 'communicating' | 'error'
  lastActivity: Date
  metrics: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageResponseTime: number
    successRate: number
  }
  recentExecutions: Array<{
    id: string
    status: string
    responseTime: number | null
    success: boolean
    createdAt: Date
  }>
}

interface DashboardData {
  agents: AgentStatus[]
  summary: {
    totalAgents: number
    activeAgents: number
    errorAgents: number
    idleAgents: number
  }
}

export default function AgentStatusDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<AgentStatus | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 3000) // Refresh every 3 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/status')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      
      const dashboardData = await response.json()
      setData(dashboardData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-neutral-800 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-neutral-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400">Failed to load dashboard data</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Total Agents</p>
              <p className="text-3xl font-bold text-neutral-100 mt-1">
                {data.summary.totalAgents}
              </p>
            </div>
            <div className="text-4xl">🤖</div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Active</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                {data.summary.activeAgents}
              </p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Idle</p>
              <p className="text-3xl font-bold text-gray-400 mt-1">
                {data.summary.idleAgents}
              </p>
            </div>
            <div className="text-4xl">😴</div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Errors</p>
              <p className="text-3xl font-bold text-red-400 mt-1">
                {data.summary.errorAgents}
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Auto-refresh toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-100">Agent Status</h2>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            autoRefresh
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
          }`}
        >
          {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
        </button>
      </div>

      {/* Agent Cards */}
      {data.agents.length === 0 ? (
        <div className="text-center py-12 bg-neutral-800 rounded-lg">
          <p className="text-neutral-400 mb-4">No agents found</p>
          <Link
            href="/agents"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Create your first agent →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.agents.map(agent => (
            <div
              key={agent.agentId}
              className="bg-neutral-800 rounded-lg p-6 hover:bg-neutral-750 transition-colors cursor-pointer"
              onClick={() => setSelectedAgent(
                selectedAgent?.agentId === agent.agentId ? null : agent
              )}
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {agent.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: agent.color }}
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-100">
                      {agent.name}
                    </h3>
                    {agent.role && (
                      <span className="text-xs text-neutral-400 capitalize">
                        {agent.role}
                      </span>
                    )}
                  </div>
                </div>
                <StatusIndicator status={agent.status} size="lg" showLabel />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-neutral-500">Total Executions</p>
                  <p className="text-xl font-semibold text-neutral-200">
                    {agent.metrics.totalExecutions}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Success Rate</p>
                  <p className="text-xl font-semibold text-neutral-200">
                    {agent.metrics.successRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Avg Response</p>
                  <p className="text-xl font-semibold text-neutral-200">
                    {agent.metrics.averageResponseTime.toFixed(0)}ms
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Last Active</p>
                  <p className="text-sm font-medium text-neutral-300">
                    {formatDate(agent.lastActivity)}
                  </p>
                </div>
              </div>

              {/* Performance indicator bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                    <span>Success</span>
                    <span>{agent.metrics.successfulExecutions}</span>
                  </div>
                  <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${agent.metrics.totalExecutions > 0 
                          ? (agent.metrics.successfulExecutions / agent.metrics.totalExecutions) * 100 
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
                {agent.metrics.failedExecutions > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                      <span>Failed</span>
                      <span>{agent.metrics.failedExecutions}</span>
                    </div>
                    <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all"
                        style={{
                          width: `${agent.metrics.totalExecutions > 0 
                            ? (agent.metrics.failedExecutions / agent.metrics.totalExecutions) * 100 
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded view with performance graph */}
              {selectedAgent?.agentId === agent.agentId && (
                <div className="mt-6 pt-6 border-t border-neutral-700">
                  <PerformanceGraph
                    data={agent.recentExecutions.map(exec => ({
                      timestamp: exec.createdAt,
                      responseTime: exec.responseTime || 0,
                      success: exec.success
                    }))}
                    agentName={agent.name}
                  />
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/agents/${agent.agentId}`}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-center text-white text-sm transition-colors"
                    >
                      View Agent
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAgent(null)
                      }}
                      className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md text-neutral-300 text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
