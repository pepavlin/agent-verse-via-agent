'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import AgentStatusCard from '../components/AgentStatusCard'
import SystemMetrics from '../components/SystemMetrics'
import ErrorLogViewer from '../components/ErrorLogViewer'
import PerformanceGraph from '../components/PerformanceGraph'

// Mock data for demonstration
const mockAgents = [
  {
    agentId: 'agent-1',
    agentName: 'Research Agent',
    role: 'researcher',
    state: 'idle' as const,
    lastActivity: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    metrics: {
      totalTasks: 45,
      completedTasks: 43,
      failedTasks: 2,
      averageResponseTime: 2340,
      lastResponseTime: 2100,
      errorRate: 4.4,
    },
    errors: [
      {
        id: 'err-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        message: 'API rate limit exceeded',
        details: 'Claude API returned 429 status code',
      },
    ],
    color: '#3b82f6',
    size: 25,
  },
  {
    agentId: 'agent-2',
    agentName: 'Strategic Planner',
    role: 'strategist',
    state: 'thinking' as const,
    currentTask: 'Analyzing competitive landscape for Q1 2026...',
    lastActivity: new Date(Date.now() - 1000 * 10), // 10 seconds ago
    metrics: {
      totalTasks: 38,
      completedTasks: 38,
      failedTasks: 0,
      averageResponseTime: 3120,
      lastResponseTime: 2950,
      errorRate: 0,
    },
    errors: [],
    color: '#10b981',
    size: 25,
  },
  {
    agentId: 'agent-3',
    agentName: 'Quality Critic',
    role: 'critic',
    state: 'idle' as const,
    lastActivity: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    metrics: {
      totalTasks: 52,
      completedTasks: 48,
      failedTasks: 4,
      averageResponseTime: 1890,
      lastResponseTime: 1650,
      errorRate: 7.7,
    },
    errors: [
      {
        id: 'err-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        message: 'Timeout while waiting for response',
        details: 'Request exceeded 30 second timeout threshold',
      },
      {
        id: 'err-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        message: 'Invalid input format',
        details: 'Expected JSON object but received string',
      },
    ],
    color: '#f59e0b',
    size: 25,
  },
  {
    agentId: 'agent-4',
    agentName: 'Idea Generator',
    role: 'ideator',
    state: 'error' as const,
    lastActivity: new Date(Date.now() - 1000 * 30), // 30 seconds ago
    metrics: {
      totalTasks: 29,
      completedTasks: 23,
      failedTasks: 6,
      averageResponseTime: 2750,
      lastResponseTime: 3200,
      errorRate: 20.7,
    },
    errors: [
      {
        id: 'err-4',
        timestamp: new Date(Date.now() - 1000 * 30),
        message: 'Connection refused',
        details: 'Unable to connect to external API service',
        taskId: 'task-123',
      },
      {
        id: 'err-5',
        timestamp: new Date(Date.now() - 1000 * 60 * 8),
        message: 'Out of memory error',
        details: 'Process exceeded memory limit during execution',
      },
    ],
    color: '#ef4444',
    size: 25,
  },
  {
    agentId: 'agent-5',
    agentName: 'Task Coordinator',
    role: 'coordinator',
    state: 'communicating' as const,
    currentTask: 'Distributing tasks to team agents...',
    lastActivity: new Date(Date.now() - 1000 * 5), // 5 seconds ago
    metrics: {
      totalTasks: 67,
      completedTasks: 65,
      failedTasks: 2,
      averageResponseTime: 1450,
      lastResponseTime: 1390,
      errorRate: 3.0,
    },
    errors: [
      {
        id: 'err-6',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        message: 'Agent not available',
        details: 'Target agent was offline when trying to delegate task',
      },
    ],
    color: '#8b5cf6',
    size: 25,
  },
]

const mockSystemMetrics = {
  totalAgents: 5,
  activeAgents: 2,
  idleAgents: 2,
  erroredAgents: 1,
  totalTasks: 231,
  completedTasks: 217,
  failedTasks: 14,
  averageResponseTime: 2310,
  systemErrorRate: 6.1,
}

export default function DashboardDemoPage() {
  const [agents, setAgents] = useState(mockAgents)
  const [systemMetrics, setSystemMetrics] = useState(mockSystemMetrics)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Update timestamps to simulate activity
      setAgents((prev) =>
        prev.map((agent) => ({
          ...agent,
          lastActivity:
            agent.state === 'thinking' || agent.state === 'communicating'
              ? new Date()
              : agent.lastActivity,
        }))
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [autoRefresh])

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
                href="/dashboard-demo"
                className="text-sm font-medium text-primary dark:text-primary-light border-b-2 border-primary"
              >
                Status Dashboard (Demo)
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {autoRefresh ? '● Live' : '○ Paused'}
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Agent Status Dashboard
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Real-time monitoring of all agents with health metrics and performance data (Demo Mode)
          </p>
        </div>

        {/* System-wide metrics */}
        <SystemMetrics metrics={systemMetrics} />

        {/* Agent status cards */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
            Agent Status ({agents.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentStatusCard
                key={agent.agentId}
                agent={agent}
                onClick={() => setSelectedAgent(agent.agentId)}
                isSelected={selectedAgent === agent.agentId}
              />
            ))}
          </div>
        </div>

        {/* Performance graph & error logs viewer */}
        {selectedAgent && (
          <div className="mt-8 space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ℹ️ Performance graph shows static demo data. In the live dashboard, this would display
                real-time task execution history from the API.
              </p>
            </div>
            <ErrorLogViewer
              agent={agents.find((a) => a.agentId === selectedAgent)!}
              onClose={() => setSelectedAgent(null)}
            />
          </div>
        )}
      </main>
    </div>
  )
}
