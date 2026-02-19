'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import AgentStatusDashboard from '@/app/components/AgentStatusDashboard'
import ErrorLogViewer from '@/app/components/ErrorLogViewer'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Agent Status Dashboard
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Real-time monitoring and health metrics for all your agents
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/live-agents"
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md text-sm transition-colors text-white"
              >
                🗺️ Live Map
              </Link>
              <Link
                href="/agents"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm transition-colors text-white"
              >
                View All Agents
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <div className="space-y-8">
            {/* Agent Status Dashboard */}
            <AgentStatusDashboard />

            {/* Error Logs */}
            <div>
              <h2 className="text-xl font-semibold text-neutral-100 mb-4">
                Recent Errors
              </h2>
              <ErrorLogViewer />
            </div>
          </div>
        </Suspense>
      </main>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-neutral-800 rounded-lg"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-64 bg-neutral-800 rounded-lg"></div>
        ))}
      </div>
    </div>
  )
}
