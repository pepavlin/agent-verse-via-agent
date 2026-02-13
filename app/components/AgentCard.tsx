'use client'

import Link from 'next/link'

interface AgentCardProps {
  agent: {
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
  onDelete: (id: string) => void
}

const roleColors: Record<string, string> = {
  researcher: 'bg-blue-100 text-blue-800',
  strategist: 'bg-purple-100 text-purple-800',
  critic: 'bg-orange-100 text-orange-800',
  ideator: 'bg-green-100 text-green-800',
  coordinator: 'bg-pink-100 text-pink-800',
  executor: 'bg-indigo-100 text-indigo-800'
}

const roleIcons: Record<string, string> = {
  researcher: '🔍',
  strategist: '🎯',
  critic: '⚖️',
  ideator: '💡',
  coordinator: '🔗',
  executor: '⚡'
}

export default function AgentCard({ agent, onDelete }: AgentCardProps) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (confirm('Are you sure you want to delete this agent?')) {
      onDelete(agent.id)
    }
  }

  const roleColor = agent.role ? roleColors[agent.role] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
  const roleIcon = agent.role ? roleIcons[agent.role] || '🤖' : '🤖'
  const messageCount = agent._count?.messages || 0

  return (
    <Link
      href={`/agents/${agent.id}`}
      className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{agent.name}</h3>
            {agent.role && (
              <span className={`px-2 py-1 text-xs font-medium rounded ${roleColor}`}>
                {roleIcon} {agent.role.charAt(0).toUpperCase() + agent.role.slice(1)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {agent.description || 'No description provided'}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {agent.model.includes('sonnet') ? 'Sonnet' :
               agent.model.includes('opus') ? 'Opus' : 'Haiku'}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {messageCount} {messageCount === 1 ? 'message' : 'messages'}
            </span>
            <span>
              {new Date(agent.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Delete agent"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </Link>
  )
}
