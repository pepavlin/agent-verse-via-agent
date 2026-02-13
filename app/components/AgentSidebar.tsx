'use client'

import { VisualAgent } from '@/types/visualization'
import { X } from 'lucide-react'

interface AgentSidebarProps {
  selectedAgents: VisualAgent[]
  onClose?: () => void
}

export default function AgentSidebar({ selectedAgents, onClose }: AgentSidebarProps) {
  if (selectedAgents.length === 0) {
    return null
  }

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Selected Agents ({selectedAgents.length})
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
            className="bg-gray-800 rounded-lg p-3 border border-gray-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: agent.color }}
              />
              <h3 className="font-medium text-white truncate flex-1">
                {agent.name}
              </h3>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Role:</span>
                <span className="text-gray-200 capitalize">
                  {agent.role || 'N/A'}
                </span>
              </div>

              {agent.specialization && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Specialization:</span>
                  <span className="text-gray-200 text-right text-xs">
                    {agent.specialization}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Position:</span>
                <span className="text-gray-200 text-xs">
                  ({Math.round(agent.x)}, {Math.round(agent.y)})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Model:</span>
                <span className="text-gray-200 text-xs truncate max-w-[150px]">
                  {agent.model}
                </span>
              </div>
            </div>

            {agent.description && (
              <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                {agent.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {selectedAgents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total selected:</span>
              <span className="text-white font-medium">{selectedAgents.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Roles:</span>
              <span className="text-white font-medium">
                {new Set(selectedAgents.map((a) => a.role)).size}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
