'use client'

import { useState, useEffect } from 'react'
import StatusIndicator from './StatusIndicator'

interface ErrorLog {
  id: string
  agentId: string
  agentName: string
  agentRole: string | null
  agentColor: string | null
  status: string
  errorMessage: string | null
  input: string | null
  createdAt: Date
  responseTime: number | null
}

interface ErrorLogViewerProps {
  selectedAgentId?: string | null
}

export default function ErrorLogViewer({ selectedAgentId }: ErrorLogViewerProps) {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAgent, setFilterAgent] = useState<string | null>(selectedAgentId || null)
  const [expandedError, setExpandedError] = useState<string | null>(null)

  useEffect(() => {
    fetchErrors()
    const interval = setInterval(fetchErrors, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [filterAgent])

  const fetchErrors = async () => {
    try {
      const params = new URLSearchParams()
      if (filterAgent) {
        params.append('agentId', filterAgent)
      }
      params.append('limit', '20')

      const response = await fetch(`/api/dashboard/errors?${params}`)
      if (!response.ok) throw new Error('Failed to fetch errors')
      
      const data = await response.json()
      setErrors(data.errors)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch errors:', error)
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-neutral-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-100">Error Logs</h3>
        <button
          onClick={fetchErrors}
          className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded-md text-sm transition-colors text-neutral-200"
        >
          Refresh
        </button>
      </div>

      {errors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-green-500 text-4xl mb-3">✓</div>
          <p className="text-neutral-400">No errors found</p>
          <p className="text-neutral-500 text-sm mt-1">All agents are running smoothly</p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map(error => (
            <div
              key={error.id}
              className="bg-neutral-900 rounded-lg p-4 border border-red-900/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {error.agentColor && (
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: error.agentColor }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-neutral-200">
                        {error.agentName}
                      </h4>
                      {error.agentRole && (
                        <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-xs rounded capitalize">
                          {error.agentRole}
                        </span>
                      )}
                      <StatusIndicator status="error" size="sm" />
                    </div>
                    <p className="text-sm text-red-400 mb-2">
                      {error.errorMessage || 'Unknown error'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>{formatDate(error.createdAt)}</span>
                      {error.responseTime && (
                        <span>{error.responseTime}ms</span>
                      )}
                    </div>
                    {expandedError === error.id && error.input && (
                      <div className="mt-3 p-3 bg-neutral-800 rounded text-xs">
                        <div className="text-neutral-400 mb-1">Input:</div>
                        <div className="text-neutral-300 font-mono whitespace-pre-wrap break-words">
                          {error.input.length > 200 
                            ? error.input.substring(0, 200) + '...' 
                            : error.input}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {error.input && (
                  <button
                    onClick={() => setExpandedError(
                      expandedError === error.id ? null : error.id
                    )}
                    className="text-neutral-400 hover:text-neutral-200 text-xs ml-2 flex-shrink-0"
                  >
                    {expandedError === error.id ? 'Hide' : 'Details'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
