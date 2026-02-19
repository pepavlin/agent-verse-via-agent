'use client'

import { useState } from 'react'
import { ErrorLog } from '@/types'

interface ErrorLogViewerProps {
  errors: ErrorLog[]
}

const errorTypeColors: Record<string, string> = {
  execution_error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  timeout: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  api_error: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  validation_error: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
}

export default function ErrorLogViewer({ errors }: ErrorLogViewerProps) {
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved')
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)

  const filteredErrors = filter === 'unresolved' 
    ? errors.filter(e => !e.resolved)
    : errors

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error Logs</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All ({errors.length})
          </button>
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'unresolved'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Unresolved ({errors.filter(e => !e.resolved).length})
          </button>
        </div>
      </div>

      {filteredErrors.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No errors to display
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredErrors.map((error) => (
            <div
              key={error.id}
              className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
              onClick={() => setSelectedError(error)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {error.agentName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${errorTypeColors[error.errorType]}`}>
                      {error.errorType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    {error.errorMessage}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(error.timestamp)}
                  </p>
                </div>
                {error.resolved && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded">
                    Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Error Details</h3>
              <button
                onClick={() => setSelectedError(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Agent</label>
                <p className="text-gray-900 dark:text-white">{selectedError.agentName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Error Type</label>
                <p className="text-gray-900 dark:text-white">{selectedError.errorType}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Message</label>
                <p className="text-gray-900 dark:text-white">{selectedError.errorMessage}</p>
              </div>
              {selectedError.stackTrace && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Stack Trace</label>
                  <pre className="mt-1 p-3 bg-gray-100 dark:bg-neutral-900 rounded text-xs overflow-x-auto">
                    {selectedError.stackTrace}
                  </pre>
                </div>
              )}
              {selectedError.context && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Context</label>
                  <pre className="mt-1 p-3 bg-gray-100 dark:bg-neutral-900 rounded text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedError.context), null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Timestamp</label>
                <p className="text-gray-900 dark:text-white">{formatDate(selectedError.timestamp)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
