'use client'

import { useState, useCallback } from 'react'
import { VisualAgent } from '@/types/visualization'
import { generateDemoAgents } from '@/lib/demoAgents'
import AgentVisualization from '@/app/components/AgentVisualization'
import AgentInfoPanel from '@/app/components/AgentInfoPanel'
import AgentSidebar from '@/app/components/AgentSidebar'
import AgentToolbar from '@/app/components/AgentToolbar'
import AgentStatusBar from '@/app/components/AgentStatusBar'

export default function VisualizationPage() {
  const [agents] = useState<VisualAgent[]>(() => generateDemoAgents(30))
  const [selectedAgents, setSelectedAgents] = useState<VisualAgent[]>([])
  const [focusedAgent, setFocusedAgent] = useState<VisualAgent | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

  const handleSelectionChange = useCallback((selected: VisualAgent[]) => {
    setSelectedAgents(selected)
  }, [])

  const handleAgentClick = useCallback((agent: VisualAgent) => {
    setFocusedAgent(agent.selected ? agent : null)
  }, [])

  const handleAction = useCallback((action: string, agents: VisualAgent[]) => {
    console.log(`Action: ${action}`, agents)

    // Handle different actions
    switch (action) {
      case 'chat':
        alert(`Opening chat with ${agents.length} agent(s)`)
        break
      case 'start':
        alert(`Starting ${agents.length} agent(s)`)
        break
      case 'pause':
        alert(`Pausing ${agents.length} agent(s)`)
        break
      case 'configure':
        alert(`Configuring ${agents.length} agent(s)`)
        break
      case 'delete':
        if (confirm(`Are you sure you want to delete ${agents.length} agent(s)?`)) {
          alert(`Deleting ${agents.length} agent(s)`)
        }
        break
    }
  }, [])

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Agent Visualization
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Interactive 2D map with real-time agent tracking and communication
            </p>
          </div>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-md text-sm transition-colors text-white"
          >
            {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <AgentToolbar selectedAgents={selectedAgents} onAction={handleAction} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-neutral-900 rounded-lg overflow-hidden shadow-xl h-full flex flex-col">
            <AgentVisualization
              agents={agents}
              onSelectionChange={handleSelectionChange}
              onAgentClick={handleAgentClick}
              width={1200}
              height={700}
              showConnections={true}
            />
          </div>
        </div>

        {/* Legend Panel */}
        <div className="w-64 bg-neutral-900 border-l border-neutral-700 p-6 overflow-y-auto">
          <h3 className="text-sm font-semibold text-neutral-300 mb-4 uppercase tracking-wider">Agent Roles</h3>
          <div className="space-y-3">
            {[
              { role: 'researcher', color: '#6366f1', name: 'Researcher' },
              { role: 'strategist', color: '#8b5cf6', name: 'Strategist' },
              { role: 'critic', color: '#ef4444', name: 'Critic' },
              { role: 'ideator', color: '#f97316', name: 'Ideator' },
              { role: 'coordinator', color: '#10b981', name: 'Coordinator' },
              { role: 'executor', color: '#06b6d4', name: 'Executor' },
            ].map(({ role, color, name }) => (
              <div key={role} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-neutral-300">{name}</span>
              </div>
            ))}
          </div>

          <hr className="my-6 border-neutral-700" />

          <h3 className="text-sm font-semibold text-neutral-300 mb-4 uppercase tracking-wider">Controls</h3>
          <div className="space-y-3 text-xs text-neutral-400">
            <div>
              <p className="font-semibold text-neutral-300 mb-1">Click Agent</p>
              <p>View agent details</p>
            </div>
            <div>
              <p className="font-semibold text-neutral-300 mb-1">Drag to Select</p>
              <p>Select multiple agents</p>
            </div>
            <div>
              <p className="font-semibold text-neutral-300 mb-1">Ctrl + Click</p>
              <p>Multi-select agents</p>
            </div>
            <div>
              <p className="font-semibold text-neutral-300 mb-1">ESC Key</p>
              <p>Clear selection</p>
            </div>
          </div>

          <hr className="my-6 border-neutral-700" />

          <div className="text-xs text-neutral-500">
            <p><span className="font-semibold">Total Agents:</span> {agents.length}</p>
            <p><span className="font-semibold">Selected:</span> {selectedAgents.length}</p>
          </div>
        </div>

        {/* Agent Info Panel */}
        <AgentInfoPanel
          agent={focusedAgent}
          onClose={() => setFocusedAgent(null)}
        />

        {/* Sidebar */}
        {showSidebar && (
          <AgentSidebar
            selectedAgents={selectedAgents}
            onClose={() => setShowSidebar(false)}
          />
        )}
      </div>

      {/* Status Bar */}
      <AgentStatusBar totalAgents={agents.length} selectedAgents={selectedAgents} />
    </div>
  )
}
