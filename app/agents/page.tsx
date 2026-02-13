'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'
import Link from 'next/link'
import CreateAgentModal from '../components/CreateAgentModal'
import AgentCard from '../components/AgentCard'

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
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-lg text-purple-300">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <nav className="bg-gray-900/50 backdrop-blur-sm shadow-lg border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                AgentVerse
              </Link>
              <Link
                href="/game"
                className="text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors"
              >
                2D World
              </Link>
              <Link
                href="/agents"
                className="text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors"
              >
                Agent List
              </Link>
              <Link
                href="/visualization"
                className="text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors"
              >
                Visualization
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-purple-300">
                {user.nickname}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-purple-300 hover:bg-gray-800/50 rounded-md border border-purple-500/30 transition-colors"
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
            <h2 className="text-3xl font-bold text-purple-100">Your Agents</h2>
            <p className="mt-1 text-sm text-purple-300">
              Create and manage your AI agents powered by Claude
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-md hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-lg"
          >
            + Create Agent
          </button>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 backdrop-blur-sm rounded-lg border border-purple-500/30">
            <svg
              className="mx-auto h-12 w-12 text-purple-400"
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
            <h3 className="mt-2 text-sm font-medium text-purple-200">No agents yet</h3>
            <p className="mt-1 text-sm text-purple-400">
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
