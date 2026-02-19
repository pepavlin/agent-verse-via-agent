'use client'

import { useState, useEffect, useCallback } from 'react'
import GameCanvas from '@/app/components/GameCanvas'
import AgentChatDialog from '@/app/components/AgentChatDialog'
import CreateAgentModal from '@/app/components/CreateAgentModal'
import AgentCommunicationLog from '@/app/components/AgentCommunicationLog'
import ThemeToggle from '@/components/ThemeToggle'
import { BUILD_CONFIG } from '@/lib/build-config'

interface Agent {
  id: string
  name: string
  description: string | null
  model: string
  color?: string | null
  size?: number | null
}

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showAgentList, setShowAgentList] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCommLog, setShowCommLog] = useState(false)
  const [focusedAgentId, setFocusedAgentId] = useState<string | null>(null)
  const deployDate = BUILD_CONFIG.deployDate

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

  // Fetch agents on component mount and set up polling
  useEffect(() => {
    // Defer initial fetch to next microtask
    Promise.resolve().then(() => fetchAgents())
    // Poll for new agents every 5 seconds
    const interval = setInterval(fetchAgents, 5000)
    return () => clearInterval(interval)
  }, [fetchAgents])

  const formatDeployDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-neutral-900 dark:bg-neutral-950 relative">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-neutral-900/90 dark:from-neutral-950/90 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent-light">
              AgentVerse
            </h1>
            <div className="h-6 w-px bg-primary/30" />
            <span className="text-primary-light text-sm">
              {agents.length} agents active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setShowCommLog(!showCommLog)}
              className="px-4 py-2 bg-neutral-800/80 dark:bg-neutral-800/50 backdrop-blur-sm text-primary-light hover:bg-neutral-700/80 dark:hover:bg-neutral-700/80 rounded-md transition-colors border border-primary/30"
            >
              {showCommLog ? 'Hide' : 'Show'} Comm Log
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-dark dark:hover:bg-primary-dark/80 backdrop-blur-sm text-white rounded-md transition-colors border border-primary/50 font-medium"
            >
              + Create Agent
            </button>
            <button
              onClick={() => setShowAgentList(!showAgentList)}
              className="px-4 py-2 bg-neutral-800/80 dark:bg-neutral-800/50 backdrop-blur-sm text-primary-light hover:bg-neutral-700/80 dark:hover:bg-neutral-700/80 rounded-md transition-colors border border-primary/30"
            >
              {showAgentList ? 'Hide' : 'Show'} Agent List
            </button>
          </div>
        </div>
      </div>

      {/* Agent List Sidebar */}
      {showAgentList && (
        <div className="absolute top-20 right-4 z-20 w-80 max-h-[70vh] overflow-hidden bg-neutral-900/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-primary/30 shadow-2xl">
          <div className="p-4 border-b border-neutral-800 dark:border-neutral-800">
            <h2 className="text-lg font-bold text-neutral-50 dark:text-neutral-50">Active Agents</h2>
            <p className="text-xs text-neutral-400 dark:text-neutral-300 mt-1">Click to chat with an agent</p>
          </div>
          <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
            {agents.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 dark:text-neutral-300">
                No agents found. Create your first agent!
              </div>
            ) : (
              agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent)
                    setFocusedAgentId(agent.id)
                  }}
                  className="w-full p-4 text-left hover:bg-neutral-800/50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-800 dark:border-neutral-800 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-accent-light flex items-center justify-center flex-shrink-0">
                      <span className="text-neutral-50 text-sm font-bold">
                        {agent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-neutral-50 dark:text-neutral-50 font-semibold text-sm">{agent.name}</h3>
                      <p className="text-xs text-neutral-400 dark:text-neutral-300 mt-1">{agent.model}</p>
                      {agent.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
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

      {/* Communication Log Panel */}
      <AgentCommunicationLog
        isOpen={showCommLog}
        onClose={() => setShowCommLog(false)}
      />

      {/* Game Canvas */}
      <GameCanvas
        onAgentClick={(agentId) => {
          const agent = agents.find(a => a.id === agentId)
          if (agent) setSelectedAgent(agent)
        }}
        focusedAgentId={focusedAgentId}
      />

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
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-neutral-900/90 dark:from-neutral-950/90 to-transparent p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-neutral-50">
              {deployDate && (
                <>
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span>Deployed: {formatDeployDate(deployDate)}</span>
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-neutral-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <span>Hover over agents for info</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span>Click to chat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span>Drag to move • Scroll to zoom</span>
              </div>
            </div>
            <div className="w-48" />
          </div>
        </div>
      </div>
    </div>
  )
}
