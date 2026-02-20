'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface AgentMetric {
  id: string
  name: string
  role: string | null
  model: string
  messageCount: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
  taskCount: number
  completedTasks: number
  failedTasks: number
  successRate: number | null
  avgLatencyMs: number | null
}

interface DailyTrend {
  date: string
  messages: number
  cost: number
}

interface Summary {
  totalAgents: number
  totalMessages: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  estimatedCost: number
  totalTasks: number
  completedTasks: number
  failedTasks: number
  overallSuccessRate: number | null
  totalWorkflows: number
  workflowSuccessRate: number | null
  avgWorkflowTimeMs: number | null
  periodDays: number
}

interface AnalyticsData {
  summary: Summary
  agentMetrics: AgentMetric[]
  dailyTrend: DailyTrend[]
}

const DATE_RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatLatency(ms: number | null): string {
  if (ms === null) return 'N/A'
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}

function StatCard({
  label,
  value,
  sub,
  colorClass = 'text-neutral-900 dark:text-neutral-50',
}: {
  label: string
  value: string
  sub?: string
  colorClass?: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>}
    </div>
  )
}

function MiniBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function TrendChart({ data }: { data: DailyTrend[] }) {
  if (data.length === 0) return null
  const maxMessages = Math.max(...data.map((d) => d.messages), 1)

  // Show at most 30 bars; if more days, thin bars
  const visible = data.slice(-30)

  return (
    <div className="flex items-end gap-px h-24 w-full">
      {visible.map((d) => {
        const height = Math.max(2, Math.round((d.messages / maxMessages) * 96))
        return (
          <div
            key={d.date}
            className="flex-1 bg-primary/60 hover:bg-primary rounded-t transition-colors cursor-default"
            style={{ height: `${height}px` }}
            title={`${d.date}: ${d.messages} msgs, ${formatCost(d.cost)}`}
          />
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics?days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const json: AnalyticsData = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${days}d-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const maxCost = data
    ? Math.max(...data.agentMetrics.map((a) => a.estimatedCost), 0.001)
    : 1
  const maxTokens = data
    ? Math.max(...data.agentMetrics.map((a) => a.totalTokens), 1)
    : 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 dark:from-neutral-950 to-neutral-100 dark:to-neutral-900">
      {/* Nav */}
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
                href="/game"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                2D World
              </Link>
              <Link
                href="/agents"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Agent List
              </Link>
              <Link
                href="/visualization"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Visualization (Demo)
              </Link>
              <Link
                href="/live-agents"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Live Map
              </Link>
              <Link
                href="/analytics"
                className="text-sm font-medium text-primary dark:text-primary-light border-b-2 border-primary"
              >
                Analytics
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Agent performance metrics, cost analytics, and historical trends
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date range selector */}
            <div className="flex rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 text-sm">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  className={`px-3 py-2 transition-colors ${
                    days === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '⟳' : '↺'} Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!data}
              className="px-3 py-2 text-sm rounded-md bg-primary hover:bg-primary-dark text-white disabled:opacity-50 transition-colors"
            >
              ↓ Export
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-24">
            <div className="text-neutral-500 dark:text-neutral-400">Loading analytics…</div>
          </div>
        )}

        {data && (
          <>
            {/* Summary Cards */}
            <section aria-label="Summary metrics" className="mb-8">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                Overview — last {days} days
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <StatCard
                  label="Total Agents"
                  value={String(data.summary.totalAgents)}
                />
                <StatCard
                  label="Messages"
                  value={formatNumber(data.summary.totalMessages)}
                  sub={`${days}d period`}
                />
                <StatCard
                  label="Total Tokens"
                  value={formatNumber(data.summary.totalTokens)}
                  sub={`In: ${formatNumber(data.summary.totalInputTokens)} / Out: ${formatNumber(data.summary.totalOutputTokens)}`}
                />
                <StatCard
                  label="Estimated Cost"
                  value={formatCost(data.summary.estimatedCost)}
                  colorClass="text-emerald-600 dark:text-emerald-400"
                  sub="Claude API (approx)"
                />
                <StatCard
                  label="Tasks"
                  value={String(data.summary.totalTasks)}
                  sub={`✓ ${data.summary.completedTasks}  ✗ ${data.summary.failedTasks}`}
                />
                <StatCard
                  label="Success Rate"
                  value={
                    data.summary.overallSuccessRate !== null
                      ? `${data.summary.overallSuccessRate.toFixed(1)}%`
                      : 'N/A'
                  }
                  colorClass={
                    data.summary.overallSuccessRate !== null && data.summary.overallSuccessRate >= 70
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }
                  sub="task completion"
                />
              </div>
            </section>

            {/* Trend Chart */}
            <section aria-label="Activity trend" className="mb-8">
              <div className="bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                    Daily Message Activity
                  </h2>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Hover bars for details
                  </span>
                </div>
                <TrendChart data={data.dailyTrend} />
                <div className="mt-2 flex justify-between text-xs text-neutral-400 dark:text-neutral-500">
                  <span>{data.dailyTrend[0]?.date}</span>
                  <span>{data.dailyTrend[data.dailyTrend.length - 1]?.date}</span>
                </div>
              </div>
            </section>

            {/* Agent Comparison Table */}
            <section aria-label="Agent performance comparison" className="mb-8">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                Agent Performance Comparison
              </h2>
              {data.agentMetrics.length === 0 ? (
                <div className="bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 p-10 text-center text-neutral-500 dark:text-neutral-400">
                  No agent data for this period.
                </div>
              ) : (
                <div className="bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            Agent
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            Messages
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            Tokens
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            Cost
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            Token Usage
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            Tasks
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            Success
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            Avg Latency
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                        {data.agentMetrics.map((agent) => (
                          <tr
                            key={agent.id}
                            className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                {agent.name}
                              </div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                                {agent.role ?? '—'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">
                              {formatNumber(agent.messageCount)}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">
                              {formatNumber(agent.totalTokens)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCost(agent.estimatedCost)}
                            </td>
                            <td className="px-4 py-3 w-32">
                              <MiniBar
                                value={agent.totalTokens}
                                max={maxTokens}
                                colorClass="bg-primary"
                              />
                              <MiniBar
                                value={agent.estimatedCost}
                                max={maxCost}
                                colorClass="bg-emerald-500 mt-1"
                              />
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">
                              {agent.taskCount}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {agent.successRate !== null ? (
                                <span
                                  className={
                                    agent.successRate >= 70
                                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                      : 'text-amber-600 dark:text-amber-400 font-medium'
                                  }
                                >
                                  {agent.successRate.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-neutral-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">
                              {formatLatency(agent.avgLatencyMs)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* Workflow stats */}
            {data.summary.totalWorkflows > 0 && (
              <section aria-label="Workflow metrics" className="mb-8">
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                  Workflow Execution Metrics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    label="Total Workflows"
                    value={String(data.summary.totalWorkflows)}
                    sub={`last ${days} days`}
                  />
                  <StatCard
                    label="Workflow Success Rate"
                    value={
                      data.summary.workflowSuccessRate !== null
                        ? `${data.summary.workflowSuccessRate.toFixed(1)}%`
                        : 'N/A'
                    }
                    colorClass={
                      data.summary.workflowSuccessRate !== null && data.summary.workflowSuccessRate >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  />
                  <StatCard
                    label="Avg Execution Time"
                    value={formatLatency(data.summary.avgWorkflowTimeMs)}
                    sub="per workflow"
                  />
                </div>
              </section>
            )}

            {/* Cost breakdown */}
            <section aria-label="Cost breakdown" className="mb-8">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                Cost Breakdown by Agent
              </h2>
              <div className="bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
                {data.agentMetrics.length === 0 ? (
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm text-center py-4">
                    No cost data available for this period.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.agentMetrics
                      .slice()
                      .sort((a, b) => b.estimatedCost - a.estimatedCost)
                      .map((agent) => (
                        <div key={agent.id}>
                          <div className="flex items-center justify-between mb-1 text-sm">
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                              {agent.name}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatCost(agent.estimatedCost)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                                style={{
                                  width: `${Math.min(100, (agent.estimatedCost / maxCost) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 w-20 text-right">
                              {formatNumber(agent.totalTokens)} tok
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
                  * Costs are estimates based on Claude 3.5 Sonnet pricing and character-level token approximation.
                  Actual costs may vary.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
