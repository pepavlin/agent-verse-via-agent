'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'
import Link from 'next/link'
import AgentStatusDashboard from '../components/AgentStatusDashboard'
import ErrorLogViewer from '../components/ErrorLogViewer'
import ThemeToggle from '@/components/ThemeToggle'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ nickname: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'errors'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = simpleAuth.getUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      setLoading(false)
    }
  }, [router])

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
              <Link
                href="/agents"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Agent List
              </Link>
              <Link
                href="/admin"
                className="text-sm font-medium text-primary dark:text-primary-light transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/visualization"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Visualization
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-neutral-600 dark:text-neutral-300">
                {user.nickname}
              </span>
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
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
            Agent Monitoring Dashboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Real-time status and health metrics for all your agents
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-neutral-200 dark:border-neutral-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary dark:text-primary-light'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'errors'
                  ? 'border-primary text-primary dark:text-primary-light'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              Error Logs
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <AgentStatusDashboard refreshInterval={5000} />
        )}

        {activeTab === 'errors' && (
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Error Logs
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                View and troubleshoot agent errors
              </p>
            </div>
            <ErrorLogViewer />
          </div>
        )}
      </main>
    </div>
  )
}
