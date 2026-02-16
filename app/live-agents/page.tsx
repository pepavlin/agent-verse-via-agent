'use client'

import { useState, useCallback, useEffect } from 'react'
import { Agent } from '@/types'
import { VisualAgent } from '@/types/visualization'
import AgentVisualization from '@/app/components/AgentVisualization'
import AgentInfoPanel from '@/app/components/AgentInfoPanel'
import AgentSidebar from '@/app/components/AgentSidebar'
import { createVisualAgent } from '@/lib/demoAgents'
import Link from 'next/link'

export default function LiveAgentsPage() {
  const [agents, setAgents] = useState<VisualAgent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<VisualAgent[]>([])
  const [focusedAgent, setFocusedAgent] = useState<VisualAgent | null>(null)
  const [focusedAgentId, setFocusedAgentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/agents')
        if (!response.ok) {
          throw new Error('Failed to fetch agents')
        }
        const data: Agent[] = await response.json()

        // Convert API agents to visual agents
        const visualAgents = data.map((agent) => createVisualAgent(agent))
        setAgents(visualAgents)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Failed to fetch agents:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchAgents, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSelectionChange = useCallback((selected: VisualAgent[]) => {
    setSelectedAgents(selected)
  }, [])

  const handleAgentClick = useCallback((agent: VisualAgent) => {
    setFocusedAgent(agent.selected ? agent : null)
  }, [])

  const handleFocusAgent = useCallback((agentId: string | null) => {
    setFocusedAgentId(agentId)
    if (agentId) {
      const agent = agents.find((a) => a.id === agentId)
      setFocusedAgent(agent || null)
    } else {
      setFocusedAgent(null)
    }
  }, [agents])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Live Agent Map
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Real-time 2D visualization of your agents
            </p>
          </div>

          <Link
            href="/agents"
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md text-sm transition-colors text-white"
          >
            ← Back to Agents
          </Link>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-3">
          <p className="text-sm">
            <span className="font-semibold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 p-6 overflow-auto">
          {agents.length === 0 ? (
            <div className="h-full flex items-center justify-center bg-neutral-900 rounded-lg">
              <div className="text-center">
                <p className="text-neutral-400 mb-4">No agents found</p>
                <Link
                  href="/agents"
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  Create an agent to get started →
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 rounded-lg overflow-hidden shadow-xl h-full flex flex-col">
              <AgentVisualization
                agents={agents}
                onSelectionChange={handleSelectionChange}
                onAgentClick={handleAgentClick}
                onFocusAgent={handleFocusAgent}
                focusedAgentId={focusedAgentId}
                width={1200}
                height={700}
                showConnections={true}
              />
            </div>
          )}
        </div>

        {/* Agent Sidebar with Focus functionality */}
        {showSidebar && selectedAgents.length > 0 ? (
          <AgentSidebar
            selectedAgents={selectedAgents}
            onClose={() => setShowSidebar(false)}
            onFocusAgent={handleFocusAgent}
          />
        ) : (
          <div className="w-64 bg-neutral-900 border-l border-neutral-700 p-6 overflow-y-auto">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4 uppercase tracking-wider">Map Info</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-neutral-400">Total Agents</p>
                <p className="text-2xl font-bold text-indigo-400">{agents.length}</p>
              </div>
              <div>
                <p className="text-neutral-400">Selected</p>
                <p className="text-2xl font-bold text-violet-400">{selectedAgents.length}</p>
              </div>
            </div>

            <hr className="my-6 border-neutral-700" />

            <h3 className="text-sm font-semibold text-neutral-300 mb-4 uppercase tracking-wider">Agent Roles</h3>
            <div className="space-y-2 text-xs text-neutral-400">
              {[
                { role: 'researcher', color: '#6366f1', name: 'Researcher', count: agents.filter((a) => a.role === 'researcher').length },
                { role: 'strategist', color: '#8b5cf6', name: 'Strategist', count: agents.filter((a) => a.role === 'strategist').length },
                { role: 'critic', color: '#ef4444', name: 'Critic', count: agents.filter((a) => a.role === 'critic').length },
                { role: 'ideator', color: '#f97316', name: 'Ideator', count: agents.filter((a) => a.role === 'ideator').length },
                { role: 'coordinator', color: '#10b981', name: 'Coordinator', count: agents.filter((a) => a.role === 'coordinator').length },
                { role: 'executor', color: '#06b6d4', name: 'Executor', count: agents.filter((a) => a.role === 'executor').length },
              ].map(({ color, name, count }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span>{name}</span>
                  </div>
                  <span className="text-neutral-500">{count}</span>
                </div>
              ))}
            </div>

            <hr className="my-6 border-neutral-700" />

            <h3 className="text-sm font-semibold text-neutral-300 mb-4 uppercase tracking-wider">Controls</h3>
            <div className="space-y-3 text-xs text-neutral-400">
              <div>
                <p className="font-semibold text-neutral-300">Click Agent</p>
                <p>View agent details</p>
              </div>
              <div>
                <p className="font-semibold text-neutral-300">Drag to Select</p>
                <p>Select multiple agents</p>
              </div>
              <div>
                <p className="font-semibold text-neutral-300">Ctrl + Click</p>
                <p>Multi-select agents</p>
              </div>
            </div>
          </div>
        )}

        {/* Agent Info Panel */}
        <AgentInfoPanel
          agent={focusedAgent}
          onClose={() => setFocusedAgent(null)}
        />
      </div>
    </div>
  )
}
