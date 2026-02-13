'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface WorkflowStep {
  stepNumber: number
  agentRole: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  output?: string
  error?: string
  startedAt?: string
  completedAt?: string
}

interface ExecutionResult {
  success: boolean
  workflowId: string
  departmentId: string
  result?: {
    summary: string
    steps: any[]
    context: any
  }
  error?: string
  steps: WorkflowStep[]
  executionTime: number
  timestamp: string
  agentsUsed: {
    id: string
    name: string
    role: string
  }[]
}

export default function MarketResearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [targetMarket, setTargetMarket] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [timeframe, setTimeframe] = useState('12 months')
  const [specificQuestions, setSpecificQuestions] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [departmentInfo, setDepartmentInfo] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDepartmentInfo()
    }
  }, [status])

  const fetchDepartmentInfo = async () => {
    try {
      const response = await fetch('/api/departments/market-research/run')
      if (!response.ok) {
        throw new Error('Failed to fetch department info')
      }
      const data = await response.json()
      setDepartmentInfo(data)

      if (!data.isReady) {
        setError(`Missing required agents: ${data.missingRoles.join(', ')}. Please create these agents first.`)
      }
    } catch (err) {
      console.error('Failed to load department info:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const options: any = {}
      if (targetMarket) options.targetMarket = targetMarket
      if (competitors) options.competitors = competitors.split(',').map(c => c.trim())
      if (timeframe) options.timeframe = timeframe
      if (specificQuestions) {
        options.specificQuestions = specificQuestions
          .split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 0)
      }

      const response = await fetch('/api/departments/market-research/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          options: Object.keys(options).length > 0 ? options : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to execute market research')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      researcher: '🔍',
      strategist: '🎯',
      critic: '⚖️',
      ideator: '💡'
    }
    return icons[role] || '🤖'
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      researcher: 'bg-blue-100 text-blue-800 border-blue-200',
      strategist: 'bg-purple-100 text-purple-800 border-purple-200',
      critic: 'bg-orange-100 text-orange-800 border-orange-200',
      ideator: 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      failed: { bg: 'bg-red-100', text: 'text-red-800' },
      skipped: { bg: 'bg-yellow-100', text: 'text-yellow-800' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link href="/departments" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                ← Back to Departments
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Market Research Department</h1>
              <p className="mt-2 text-gray-600">
                Comprehensive market analysis through collaborative AI agents
              </p>
            </div>
          </div>

          {/* Department Status */}
          {departmentInfo && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Department Status</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {departmentInfo.requiredRoles.map((role: string) => {
                      const hasAgent = departmentInfo.availableAgents?.some((a: any) => a.role === role)
                      return (
                        <span
                          key={role}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            hasAgent
                              ? getRoleColor(role)
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}
                        >
                          {getRoleIcon(role)} {role} {hasAgent && '✓'}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  departmentInfo.isReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {departmentInfo.isReady ? '✓ Ready' : '⚠ Setup Required'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Research Request</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
                  Research Query *
                </label>
                <textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What market research would you like to conduct?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label htmlFor="targetMarket" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Market
                </label>
                <input
                  id="targetMarket"
                  type="text"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="e.g., SMBs in North America"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="competitors" className="block text-sm font-medium text-gray-700 mb-1">
                  Key Competitors
                </label>
                <input
                  id="competitors"
                  type="text"
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  placeholder="Comma-separated list"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">
                  Timeframe
                </label>
                <select
                  id="timeframe"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="12 months">12 months</option>
                  <option value="2 years">2 years</option>
                  <option value="5 years">5 years</option>
                </select>
              </div>

              <div>
                <label htmlFor="specificQuestions" className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Questions (one per line)
                </label>
                <textarea
                  id="specificQuestions"
                  value={specificQuestions}
                  onChange={(e) => setSpecificQuestions(e.target.value)}
                  placeholder="What are the key market trends?&#10;Who are the main competitors?&#10;What are the growth opportunities?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !query || !departmentInfo?.isReady}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Running Research...' : 'Start Market Research'}
              </button>
            </form>
          </div>

          {/* Results Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Research Results</h2>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Running multi-agent workflow...</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Workflow Status */}
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Workflow Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'Completed' : 'Failed'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Execution time: {(result.executionTime / 1000).toFixed(2)}s
                  </p>
                </div>

                {/* Workflow Steps */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Workflow Steps</h3>
                  <div className="space-y-3">
                    {result.steps.map((step) => (
                      <div key={step.stepNumber} className="border border-gray-200 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {getRoleIcon(step.agentRole)} {step.agentRole}
                            </span>
                          </div>
                          {getStatusBadge(step.status)}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                        {step.output && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <p className="text-gray-700 line-clamp-3">{step.output.substring(0, 200)}...</p>
                          </div>
                        )}
                        {step.error && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800">
                            {step.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Summary */}
                {result.result?.summary && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Final Report</h3>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-xs text-gray-800 font-sans">
                          {result.result.summary}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !result && !error && (
              <div className="text-center py-12 text-gray-500">
                <p>Submit a research query to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
