'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth, SimpleUser } from '@/lib/simple-auth'
import GameCanvas from '../components/GameCanvas'
import AgentChatDialog from '../components/AgentChatDialog'
import CreateAgentModal from '../components/CreateAgentModal'

interface Agent {
  id: string
  name: string
  description: string | null
  model: string
  color?: string | null
  size?: number | null
}

export default function GamePage() {
  const router = useRouter()
  const [user, setUser] = useState<SimpleUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showAgentList, setShowAgentList] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }, [])

  // Initialize user state and fetch agents on mount
  useEffect(() => {
    const currentUser = simpleAuth.getUser()
    if (!currentUser) {
      void router.push('/login')
    } else {
      // Use Promise to defer state updates to next microtask
      Promise.resolve().then(() => {
        setUser(currentUser)
        setLoading(false)
        void fetchAgents()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleLogout = () => {
    simpleAuth.logout()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-lg text-purple-300">Loading universe...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 relative">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-gray-900/90 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              AgentVerse
            </h1>
            <div className="h-6 w-px bg-purple-500/30" />
            <span className="text-purple-300 text-sm">
              Welcome, {user?.nickname}
            </span>
            <div className="h-6 w-px bg-purple-500/30" />
            <span className="text-purple-300 text-sm">
              {agents.length} agents active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600/80 backdrop-blur-sm text-white rounded-md hover:bg-purple-700/80 transition-colors border border-purple-500/50 font-medium"
            >
              + Create Agent
            </button>
            <button
              onClick={() => setShowAgentList(!showAgentList)}
              className="px-4 py-2 bg-gray-800/80 backdrop-blur-sm text-purple-300 rounded-md hover:bg-gray-700/80 transition-colors border border-purple-500/30"
            >
              {showAgentList ? 'Hide' : 'Show'} Agent List
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-800/80 backdrop-blur-sm text-purple-300 rounded-md hover:bg-gray-700/80 transition-colors border border-purple-500/30"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Agent List Sidebar */}
      {showAgentList && (
        <div className="absolute top-20 right-4 z-20 w-80 max-h-[70vh] overflow-hidden bg-gray-900/95 backdrop-blur-sm rounded-lg border border-purple-500/30 shadow-2xl">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">Active Agents</h2>
            <p className="text-xs text-gray-400 mt-1">Click to chat with an agent</p>
          </div>
          <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
            {agents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No agents found
              </div>
            ) : (
              agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="w-full p-4 text-left hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {agent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{agent.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{agent.model}</p>
                      {agent.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <GameCanvas onAgentClick={(agentId) => {
        const agent = agents.find(a => a.id === agentId)
        if (agent) setSelectedAgent(agent)
      }} />

      {/* Chat Dialog */}
      {selectedAgent && (
        <AgentChatDialog
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchAgents()
          setShowCreateModal(false)
        }}
      />

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-gray-900/90 to-transparent p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-8 text-sm text-purple-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
              <span>Hover over agents for info</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span>Click to chat</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Drag to move • Scroll to zoom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
