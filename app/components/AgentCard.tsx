'use client'

import Link from 'next/link'

interface AgentCardProps {
  agent: {
    id: string
    name: string
    description: string | null
    model: string
    createdAt: Date
  }
  onDelete: (id: string) => void
}

export default function AgentCard({ agent, onDelete }: AgentCardProps) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (confirm('Are you sure you want to delete this agent?')) {
      onDelete(agent.id)
    }
  }

  return (
    <Link
      href={`/agents/${agent.id}`}
      className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{agent.name}</h3>
          <p className="text-sm text-gray-600 mb-3">
            {agent.description || 'No description provided'}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {agent.model.includes('sonnet') ? 'Sonnet' :
               agent.model.includes('opus') ? 'Opus' : 'Haiku'}
            </span>
            <span>
              Created {new Date(agent.createdAt).toLocaleDateString()}
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
