'use client'

import AgentStatusIndicator from '../components/AgentStatusIndicator'
import AgentHealthMetrics from '../components/AgentHealthMetrics'

// Mock data for demonstration
const mockAgents = [
  {
    agentId: '1',
    name: 'Research Assistant',
    role: 'researcher',
    color: '#3b82f6',
    status: 'thinking' as const,
    lastActivity: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    metrics: {
      tasksCompleted: 45,
      averageResponseTime: 1250,
      errorRate: 2.2,
      activityFrequency: 12
    }
  },
  {
    agentId: '2',
    name: 'Strategy Planner',
    role: 'strategist',
    color: '#a855f7',
    status: 'idle' as const,
    lastActivity: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    metrics: {
      tasksCompleted: 32,
      averageResponseTime: 2100,
      errorRate: 0,
      activityFrequency: 8
    }
  },
  {
    agentId: '3',
    name: 'Quality Checker',
    role: 'critic',
    color: '#ef4444',
    status: 'error' as const,
    lastActivity: new Date(Date.now() - 2 * 60000), // 2 minutes ago
    metrics: {
      tasksCompleted: 28,
      averageResponseTime: 890,
      errorRate: 8.5,
      activityFrequency: 15
    }
  },
  {
    agentId: '4',
    name: 'Creative Thinker',
    role: 'ideator',
    color: '#10b981',
    status: 'communicating' as const,
    lastActivity: new Date(Date.now() - 1 * 60000), // 1 minute ago
    metrics: {
      tasksCompleted: 52,
      averageResponseTime: 1580,
      errorRate: 1.5,
      activityFrequency: 18
    }
  }
]

export default function DashboardDemo() {
  const formatLastActivity = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      researcher: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      strategist: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      critic: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      ideator: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
    }
    return colors[role] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
  }

  const activeAgents = mockAgents.filter(a => a.status !== 'idle' && a.status !== 'error').length
  const errorCount = mockAgents.filter(a => a.status === 'error').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 dark:from-neutral-950 to-neutral-100 dark:to-neutral-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
            Agent Status Dashboard - Demo
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Real-time status and health metrics visualization
          </p>
        </div>

        {/* System Overview */}
        <div className="bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Total Agents
              </div>
              <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {mockAgents.length}
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Active Agents
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {activeAgents}
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Errors
              </div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {errorCount}
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                System Health
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 capitalize">
                Warning
              </div>
            </div>
          </div>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockAgents.map((agent) => (
            <div
              key={agent.agentId}
              className="bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                      {agent.name}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(agent.role)}`}>
                      {agent.role}
                    </span>
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

        {/* Status Indicators Legend */}
        <div className="mt-8 bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-4">
            Status Indicators
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2">
              <AgentStatusIndicator status="idle" size="lg" showLabel={false} />
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Idle - Ready for tasks
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentStatusIndicator status="thinking" size="lg" showLabel={false} />
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Thinking - Processing
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentStatusIndicator status="communicating" size="lg" showLabel={false} />
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Communicating - Messaging
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentStatusIndicator status="error" size="lg" showLabel={false} />
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Error - Needs attention
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
