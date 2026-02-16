'use client'

import { VisualAgent } from '@/types/visualization'
import { X, Target } from 'lucide-react'

interface AgentSidebarProps {
  selectedAgents: VisualAgent[]
  onClose?: () => void
  onFocusAgent?: (agentId: string) => void
}

export default function AgentSidebar({ selectedAgents, onClose, onFocusAgent }: AgentSidebarProps) {
  if (selectedAgents.length === 0) {
    return null
  }

  return (
    <div className="w-80 bg-neutral-50 border-l border-neutral-300 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Selected Agents ({selectedAgents.length})
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-600 hover:text-neutral-900 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {selectedAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-lg p-3 border border-neutral-300 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: agent.color }}
              />
              <h3 className="font-medium text-neutral-900 truncate flex-1">
                {agent.name}
              </h3>
              {onFocusAgent && (
                <button
                  onClick={() => onFocusAgent(agent.id)}
                  className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 p-1.5 rounded transition-colors"
                  title="Focus camera on agent"
                  aria-label="Focus on agent"
                >
                  <Target size={16} />
                </button>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Role:</span>
                <span className="text-neutral-900 capitalize font-medium">
                  {agent.role || 'N/A'}
                </span>
              </div>

              {agent.specialization && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Specialization:</span>
                  <span className="text-neutral-900 text-right text-xs font-medium">
                    {agent.specialization}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Position:</span>
                <span className="text-neutral-900 text-xs font-medium">
                  ({Math.round(agent.x)}, {Math.round(agent.y)})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Model:</span>
                <span className="text-neutral-900 text-xs truncate max-w-[150px] font-medium">
                  {agent.model}
                </span>
              </div>
            </div>

            {agent.description && (
              <p className="mt-2 text-xs text-neutral-700 line-clamp-2">
                {agent.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {selectedAgents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-300">
          <h3 className="text-sm font-medium text-neutral-800 mb-2">Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Total selected:</span>
              <span className="text-neutral-900 font-medium">{selectedAgents.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Roles:</span>
              <span className="text-neutral-900 font-medium">
                {new Set(selectedAgents.map((a) => a.role)).size}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
