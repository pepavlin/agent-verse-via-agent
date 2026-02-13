'use client'

import { VisualAgent } from '@/types/visualization'

interface AgentStatusBarProps {
  totalAgents: number
  selectedAgents: VisualAgent[]
  showHelp?: boolean
}

export default function AgentStatusBar({
  totalAgents,
  selectedAgents,
  showHelp = true,
}: AgentStatusBarProps) {
  const selectedCount = selectedAgents.length
  const roleBreakdown = selectedAgents.reduce((acc, agent) => {
    const role = agent.role || 'unknown'
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="bg-gray-900 border-t border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">
            Total Agents: <span className="text-white font-medium">{totalAgents}</span>
          </span>

          <span className="text-gray-400">
            Selected: <span className="text-purple-400 font-medium">{selectedCount}</span>
          </span>

          {selectedCount > 0 && Object.keys(roleBreakdown).length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Roles:</span>
              {Object.entries(roleBreakdown).map(([role, count]) => (
                <span
                  key={role}
                  className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs capitalize"
                >
                  {role}: {count}
                </span>
              ))}
            </div>
          )}
        </div>

        {showHelp && (
          <div className="text-gray-500 text-xs">
            Click to select • Drag to select multiple • Ctrl/Cmd+Click for multi-select • Esc to clear
          </div>
        )}
      </div>
    </div>
  )
}
