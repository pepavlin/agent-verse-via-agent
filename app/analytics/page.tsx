'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface AgentStat {
  id: string
  name: string
  model: string
  role: string | null
  messageCount: number
  tasksAssigned: number
  tasksCompleted: number
  tasksFailed: number
  estimatedTokens: number
  estimatedCostUSD: number
}

interface AnalyticsData {
  summary: {
    totalAgents: number
    totalMessages: number
    totalTasks: number
    totalWorkflows: number
    completedTasks: number
    failedTasks: number
    taskSuccessRate: number
    totalEstimatedCostUSD: number
  }
  agents: AgentStat[]
  tasksByStatus: Record<string, number>
  workflows: {
    total: number
    completed: number
    failed: number
    avgExecutionTimeMs: number
    successRate: number
  }
  dailyActivity: { date: string; count: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500',
  in_progress: 'bg-blue-500',
  pending: 'bg-yellow-500',
  failed: 'bg-red-500',
  blocked: 'bg-orange-500',
}

const ROLE_ICONS: Record<string, string> = {
  researcher: '🔍',
  strategist: '🎯',
  critic: '⚖️',
  ideator: '💡',
  coordinator: '🔗',
  executor: '⚡',
}

function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 shadow-sm">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-1">{value}</p>
      {sub && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{sub}</p>}
    </div>
  )
}

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary/70 dark:bg-primary/60 rounded-t"
            style={{ height: `${Math.round((d.count / max) * 80)}px`, minHeight: d.count > 0 ? '4px' : '0' }}
            title={`${d.date}: ${d.count} messages`}
          />
          <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate w-full text-center">
            {d.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ nickname: string } | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = simpleAuth.getUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      fetchAnalytics()
    }
  }, [router])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const json = await response.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
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
        <div className="text-lg text-primary-light">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 dark:from-neutral-950 to-neutral-100 dark:to-neutral-900">
      <nav className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm shadow-sm border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                AgentVerse
              </Link>
              <Link href="/game" className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors">
                2D World
              </Link>
              <Link href="/agents" className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors">
                Agent List
              </Link>
              <Link href="/visualization" className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors">
                Visualization (Demo)
              </Link>
              <Link href="/live-agents" className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors">
                Live Map
              </Link>
              <Link href="/analytics" className="text-sm font-medium text-primary dark:text-primary-light border-b-2 border-primary dark:border-primary-light transition-colors">
                Analytics
              </Link>
            </div>
            <div className="flex items-center gap-4">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Agent performance metrics, cost tracking, and usage analytics
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 text-sm bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded-md border border-primary/30 hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Summary Cards */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Agents" value={data.summary.totalAgents} />
                <SummaryCard label="Total Messages" value={data.summary.totalMessages} />
                <SummaryCard label="Total Tasks" value={data.summary.totalTasks} sub={`${data.summary.taskSuccessRate}% success rate`} />
                <SummaryCard
                  label="Estimated Cost"
                  value={`$${data.summary.totalEstimatedCostUSD.toFixed(4)}`}
                  sub="Based on token estimates"
                />
              </div>
            </section>

            {/* Daily Activity + Workflow Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                  Message Activity (Last 7 Days)
                </h2>
                <BarChart data={data.dailyActivity} />
              </div>

              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                  Workflow Executions
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Total Workflows</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{data.workflows.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Completed</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{data.workflows.completed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Failed</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{data.workflows.failed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Success Rate</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{data.workflows.successRate}%</span>
                  </div>
                  {data.workflows.avgExecutionTimeMs > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">Avg Execution Time</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {(data.workflows.avgExecutionTimeMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                  )}
                  {data.workflows.total > 0 && (
                    <div className="mt-3">
                      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${data.workflows.successRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Task Status Breakdown */}
            <section className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 shadow-sm">
              <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                Task Status Breakdown
              </h2>
              {data.summary.totalTasks === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No tasks recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.tasksByStatus).map(([status, count]) => {
                    const pct = Math.round((count / data.summary.totalTasks) * 100)
                    const barColor = STATUS_COLORS[status] || 'bg-neutral-400'
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-neutral-700 dark:text-neutral-300">{status.replace('_', ' ')}</span>
                          <span className="text-neutral-500 dark:text-neutral-400">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Per-Agent Performance Table */}
            <section className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm overflow-hidden">
              <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                  Agent Performance Comparison
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Cost estimates use character-count token approximation (chars ÷ 4)
                </p>
              </div>
              {data.agents.length === 0 ? (
                <div className="p-5 text-sm text-neutral-500 dark:text-neutral-400">No agents found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50">
                        <th className="px-4 py-3 font-medium">Agent</th>
                        <th className="px-4 py-3 font-medium">Model</th>
                        <th className="px-4 py-3 font-medium text-right">Messages</th>
                        <th className="px-4 py-3 font-medium text-right">Tasks</th>
                        <th className="px-4 py-3 font-medium text-right">Completed</th>
                        <th className="px-4 py-3 font-medium text-right">Est. Tokens</th>
                        <th className="px-4 py-3 font-medium text-right">Est. Cost (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {data.agents
                        .slice()
                        .sort((a, b) => b.estimatedCostUSD - a.estimatedCostUSD)
                        .map((agent) => (
                          <tr key={agent.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span>{agent.role ? ROLE_ICONS[agent.role] ?? '🤖' : '🤖'}</span>
                                <div>
                                  <Link
                                    href={`/agents/${agent.id}`}
                                    className="font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary dark:hover:text-primary-light"
                                  >
                                    {agent.name}
                                  </Link>
                                  {agent.role && (
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{agent.role}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                              <span className="px-2 py-0.5 text-xs bg-primary/10 dark:bg-primary/20 text-primary-dark dark:text-primary-light rounded">
                                {agent.model.includes('sonnet') ? 'Sonnet' : agent.model.includes('opus') ? 'Opus' : 'Haiku'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{agent.messageCount}</td>
                            <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{agent.tasksAssigned}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={agent.tasksCompleted > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}>
                                {agent.tasksCompleted}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">
                              {agent.estimatedTokens.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-neutral-100">
                              ${agent.estimatedCostUSD.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
