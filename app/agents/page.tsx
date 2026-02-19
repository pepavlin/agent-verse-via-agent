'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'
import Link from 'next/link'
import CreateAgentModal from '../components/CreateAgentModal'
import AgentCard from '../components/AgentCard'
import ThemeToggle from '@/components/ThemeToggle'

interface Agent {
  id: string
  name: string
  description: string | null
  model: string
  role: string | null
  createdAt: Date
  _count?: {
    messages: number
  }
}

export default function AgentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ nickname: string } | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = simpleAuth.getUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      fetchAgents()
    }
  }, [router])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAgents(agents.filter(agent => agent.id !== agentId))
      }
    } catch (error) {
      console.error('Failed to delete agent:', error)
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
                href="/admin"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                Dashboard
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Your Agents</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Create and manage your AI agents powered by Claude
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-dark text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-lg"
          >
            + Create Agent
          </button>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700">
            <svg
              className="mx-auto h-12 w-12 text-primary"
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
            <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-200">No agents yet</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Get started by creating your first AI agent
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={handleDeleteAgent}
              />
            ))}
          </div>
        )}
      </main>

      <CreateAgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAgents}
      />
    </div>
  )
}
