'use client'

import { X, AlertCircle, Clock, FileText } from 'lucide-react'
import { useState } from 'react'

interface ErrorLogViewerProps {
  agent: {
    agentId: string
    agentName: string
    role: string | null
    errors: Array<{
      id: string
      timestamp: Date
      message: string
      details?: string
      taskId?: string
    }>
  }
  onClose: () => void
}

function formatTimestamp(date: Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function ErrorLogViewer({ agent, onClose }: ErrorLogViewerProps) {
  const [expandedError, setExpandedError] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
              Error Logs - {agent.agentName}
            </h3>
            {agent.role && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 capitalize mt-1">
                {agent.role}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X size={20} className="text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {agent.errors.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <AlertCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
                No errors recorded
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                This agent is running smoothly with no recent errors
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agent.errors.map((error) => (
                <div
                  key={error.id}
                  className="border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-900/10 overflow-hidden"
                >
                  {/* Error summary */}
                  <button
                    onClick={() =>
                      setExpandedError(expandedError === error.id ? null : error.id)
                    }
                    className="w-full p-4 text-left hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100 break-words">
                          {error.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-red-700 dark:text-red-300">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTimestamp(error.timestamp)}
                          </span>
                          {error.taskId && (
                            <span className="flex items-center gap-1">
                              <FileText size={12} />
                              Task: {error.taskId.slice(0, 8)}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 transition-transform ${
                          expandedError === error.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Error details (expanded) */}
                  {expandedError === error.id && error.details && (
                    <div className="border-t border-red-200 dark:border-red-900/50 p-4 bg-red-100 dark:bg-red-900/20">
                      <p className="text-xs font-medium text-red-900 dark:text-red-100 mb-2">
                        Error Details:
                      </p>
                      <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap break-words font-mono bg-white dark:bg-neutral-900 p-3 rounded border border-red-200 dark:border-red-800">
                        {error.details}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {agent.errors.length > 0
              ? `Showing ${agent.errors.length} most recent error${agent.errors.length === 1 ? '' : 's'}`
              : 'No errors to display'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-50 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
