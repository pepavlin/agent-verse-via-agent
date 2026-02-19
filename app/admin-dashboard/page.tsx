'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import AgentStatusCard from '../components/AgentStatusCard'
import SystemMetrics from '../components/SystemMetrics'
import ErrorLogViewer from '../components/ErrorLogViewer'

interface AgentStatusData {
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
  errors: Array<{
    id: string
    timestamp: Date
    message: string
    details?: string
    taskId?: string
  }>
  color: string
  size: number
}

interface SystemMetrics {
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

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ nickname: string } | null>(null)
  const [agents, setAgents] = useState<AgentStatusData[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = simpleAuth.getUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      fetchAgentStatus()
    }
  }, [router])

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchAgentStatus()
    }, 3000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agents/status-all')
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents)
        setSystemMetrics(data.systemMetrics)
      }
    } catch (error) {
      console.error('Failed to fetch agent status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    simpleAuth.logout()
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 dark:bg-neutral-950">
        <div className="text-lg text-primary-light">Loading dashboard...</div>
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
                href="/admin-dashboard"
                className="text-sm font-medium text-primary dark:text-primary-light border-b-2 border-primary"
              >
                Status Dashboard
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
              <span className="text-sm text-neutral-600 dark:text-neutral-300">{user.nickname}</span>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Agent Status Dashboard
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Real-time monitoring of all agents with health metrics and performance data
          </p>
        </div>

        {/* System-wide metrics */}
        {systemMetrics && <SystemMetrics metrics={systemMetrics} />}

        {/* Agent status cards */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
            Agent Status ({agents.length})
          </h3>
          {agents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700">
              <svg
                className="mx-auto h-12 w-12 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-200">
                No agents to monitor
              </h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Create agents to see their status here
              </p>
              <Link
                href="/agents"
                className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Create Agent
              </Link>
            </div>
          ) : (
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
          )}
        </div>

        {/* Error logs viewer */}
        {selectedAgent && (
          <ErrorLogViewer
            agent={agents.find((a) => a.agentId === selectedAgent)!}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </main>
    </div>
  )
}
