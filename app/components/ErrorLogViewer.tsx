'use client'

import { useState, useEffect } from 'react'

interface ErrorLog {
  id: string
  agentId: string
  agentName: string
  agentRole: string
  errorMessage: string | null
  timestamp: Date
  executionTime: number | null
}

interface ErrorLogViewerProps {
  selectedAgentId?: string
}

export default function ErrorLogViewer({ selectedAgentId }: ErrorLogViewerProps) {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAgent, setFilterAgent] = useState<string>(selectedAgentId || 'all')

  useEffect(() => {
    fetchErrors()
  }, [filterAgent])

  const fetchErrors = async () => {
    try {
      setLoading(true)
      const url = filterAgent === 'all'
        ? '/api/agents/errors'
        : `/api/agents/errors?agentId=${filterAgent}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setErrors(data.errors)
      }
    } catch (error) {
      console.error('Failed to fetch error logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      researcher: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      strategist: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      critic: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      ideator: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      coordinator: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      executor: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
    }
    return colors[role] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600 dark:text-neutral-400">Loading error logs...</div>
      </div>
    )
  }

  if (errors.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <svg
          className="mx-auto h-12 w-12 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-200">No errors found</h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          All agents are running smoothly!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {errors.map((error) => (
        <div
          key={error.id}
          className="bg-white dark:bg-neutral-800/50 rounded-lg border border-red-200 dark:border-red-900/50 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {error.agentName}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(error.agentRole)}`}>
                {error.agentRole}
              </span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatTimestamp(error.timestamp)}
            </div>
          </div>
          
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-3 font-mono">
            {error.errorMessage || 'Unknown error'}
          </div>

          {error.executionTime && (
            <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Execution time: {error.executionTime}ms
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
