'use client'

import { useState, useEffect } from 'react'
import AgentStatusIndicator from './AgentStatusIndicator'
import AgentHealthMetrics from './AgentHealthMetrics'
import { Activity, Clock, AlertCircle, TrendingUp } from 'lucide-react'

interface AgentMetrics {
  agentId: string
  name: string
  role: string | null
  color: string | null
  status: 'idle' | 'thinking' | 'communicating' | 'error'
  lastActivity: Date | null
  metrics: {
    tasksCompleted: number
    averageResponseTime: number
    errorRate: number
    activityFrequency: number
  }
}

interface AgentStatusDashboardProps {
  refreshInterval?: number
}

export default function AgentStatusDashboard({
  refreshInterval = 5000
}: AgentStatusDashboardProps) {
  const [agentsMetrics, setAgentsMetrics] = useState<AgentMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedAgent, setSelectedAgent] = useState<AgentMetrics | null>(null)

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/agents/metrics')
      if (response.ok) {
        const data = await response.json()
        setAgentsMetrics(data.agents)
        setLastUpdate(new Date(data.timestamp))
      }
    } catch (error) {
      console.error('Failed to fetch agent metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatLastActivity = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getRoleBadgeColor = (role: string | null) => {
    const colors: Record<string, string> = {
      researcher: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      strategist: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      critic: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      ideator: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      coordinator: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      executor: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
    }
    return colors[role || ''] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
  }

  const getOverallHealth = () => {
    if (agentsMetrics.length === 0) return 'unknown'
    const errorCount = agentsMetrics.filter(a => a.status === 'error').length
    const errorPercentage = (errorCount / agentsMetrics.length) * 100
    
    if (errorPercentage === 0) return 'healthy'
    if (errorPercentage < 20) return 'warning'
    return 'critical'
  }

  const overallHealth = getOverallHealth()
  const healthColors = {
    healthy: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    critical: 'text-red-600 dark:text-red-400',
    unknown: 'text-neutral-600 dark:text-neutral-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600 dark:text-neutral-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Agent Status Dashboard
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={fetchMetrics}
              className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-sm rounded-md transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Overall System Health */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-primary" />
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Total Agents
              </div>
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {agentsMetrics.length}
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Active Agents
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {agentsMetrics.filter(a => a.status !== 'idle' && a.status !== 'error').length}
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Errors
              </div>
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {agentsMetrics.filter(a => a.status === 'error').length}
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                System Health
              </div>
            </div>
            <div className={`text-2xl font-bold ${healthColors[overallHealth]} capitalize`}>
              {overallHealth}
            </div>
          </div>
        </div>
      </div>

      {/* Agent List */}
      {agentsMetrics.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <Activity className="mx-auto h-12 w-12 text-neutral-400" />
          <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-200">No agents yet</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Create your first agent to start monitoring
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agentsMetrics.map((agent) => (
            <div
              key={agent.agentId}
              className="bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedAgent(agent)}
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: agent.color || '#a855f7' }}
                  >
                    {agent.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                      {agent.name}
                    </h3>
                    {agent.role && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(agent.role)}`}>
                        {agent.role}
                      </span>
                    )}
                  </div>
                </div>
                <AgentStatusIndicator status={agent.status} size="md" showLabel={false} />
              </div>

              {/* Agent Status */}
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                <AgentStatusIndicator status={agent.status} size="sm" />
              </div>

              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Last Activity:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatLastActivity(agent.lastActivity)}
                </span>
              </div>

              {/* Agent Metrics */}
              <AgentHealthMetrics metrics={agent.metrics} />
            </div>
          ))}
        </div>
      )}

      {/* Selected Agent Detail Modal - could be enhanced later */}
      {selectedAgent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAgent(null)}
        >
          <div
            className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {selectedAgent.name}
              </h3>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Current Status
                </h4>
                <AgentStatusIndicator status={selectedAgent.status} size="lg" />
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Performance Metrics
                </h4>
                <AgentHealthMetrics metrics={selectedAgent.metrics} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
