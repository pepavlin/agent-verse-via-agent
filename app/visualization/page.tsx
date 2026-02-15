'use client'

import { useState, useCallback } from 'react'
import { VisualAgent } from '@/types/visualization'
import { generateDemoAgents } from '@/lib/demoAgents'
import AgentVisualization from '@/app/components/AgentVisualization'
import AgentSidebar from '@/app/components/AgentSidebar'
import AgentToolbar from '@/app/components/AgentToolbar'
import AgentStatusBar from '@/app/components/AgentStatusBar'

export default function VisualizationPage() {
  const [agents] = useState<VisualAgent[]>(() => generateDemoAgents(30))
  const [selectedAgents, setSelectedAgents] = useState<VisualAgent[]>([])
  const [showSidebar, setShowSidebar] = useState(true)

  const handleSelectionChange = useCallback((selected: VisualAgent[]) => {
    setSelectedAgents(selected)
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
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Agent Visualization
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Interactive 2D visualization with rect selection tool
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
      <div className="flex">
        <div className="flex-1 p-6">
          <div className="bg-neutral-900 rounded-lg overflow-hidden shadow-xl">
            <AgentVisualization
              agents={agents}
              onSelectionChange={handleSelectionChange}
              width={1200}
              height={700}
            />
          </div>

          {/* Legend */}
          <div className="mt-4 bg-neutral-900 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">Agent Roles</h3>
            <div className="flex flex-wrap gap-4">
              {[
                { role: 'researcher', color: '#6366f1', name: 'Researcher' },
                { role: 'strategist', color: '#8b5cf6', name: 'Strategist' },
                { role: 'critic', color: '#ef4444', name: 'Critic' },
                { role: 'ideator', color: '#f97316', name: 'Ideator' },
                { role: 'coordinator', color: '#10b981', name: 'Coordinator' },
                { role: 'executor', color: '#06b6d4', name: 'Executor' },
              ].map(({ role, color, name }) => (
                <div key={role} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-neutral-400">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

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
