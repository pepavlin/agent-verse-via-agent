'use client'

import { VisualAgent } from '@/types/visualization'

interface AgentInfoPanelProps {
  agent: VisualAgent | null
  onClose?: () => void
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  researcher: { label: 'Researcher', color: 'from-primary-dark to-primary' },
  strategist: { label: 'Strategist', color: 'from-secondary-dark to-secondary' },
  critic: { label: 'Critic', color: 'from-danger to-danger' },
  ideator: { label: 'Ideator', color: 'from-warning to-warning' },
  coordinator: { label: 'Coordinator', color: 'from-success to-success' },
  executor: { label: 'Executor', color: 'from-accent to-accent' },
}

export default function AgentInfoPanel({ agent, onClose }: AgentInfoPanelProps) {
  if (!agent) return null

  const roleInfo = ROLE_LABELS[agent.role || 'executor']
  const createdDate = agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-neutral-300 shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-neutral-50 border-b border-neutral-300 p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Agent Details</h2>
        <button
          onClick={onClose}
          className="text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Agent Status Indicator */}
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: agent.color }}
          />
          <span className="text-sm text-neutral-700 font-medium">Active</span>
        </div>

        {/* Agent Name */}
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Name</p>
          <p className="text-xl font-bold text-neutral-900">{agent.name}</p>
        </div>

        {/* Role Badge */}
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Role</p>
          <div className={`inline-block bg-gradient-to-r ${roleInfo.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
            {roleInfo.label}
          </div>
        </div>

        {/* Description */}
        {agent.description && (
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm text-neutral-700 line-clamp-3">{agent.description}</p>
          </div>
        )}

        {/* Model Information */}
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Model</p>
          <p className="text-sm text-neutral-800 font-mono text-xs break-all">{agent.model}</p>
        </div>

        {/* Specialization */}
        {agent.specialization && (
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Specialization</p>
            <p className="text-sm text-neutral-700">{agent.specialization}</p>
          </div>
        )}

        {/* Created Date */}
        <div>
          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Created</p>
          <p className="text-sm text-neutral-700">{createdDate}</p>
        </div>

        {/* Position Information */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-300">
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">Position X</p>
            <p className="text-sm text-neutral-900 font-medium">{Math.round(agent.x)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">Position Y</p>
            <p className="text-sm text-neutral-900 font-medium">{Math.round(agent.y)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t border-neutral-300">
          <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors">
            Send Message
          </button>
          <button className="w-full px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-md text-sm font-medium transition-colors">
            View History
          </button>
        </div>
      </div>
    </div>
  )
}
