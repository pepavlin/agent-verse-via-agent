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
  researcher: 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300',
  strategist: 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300',
  critic: 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300',
  ideator: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-300',
  coordinator: 'bg-green-50 dark:bg-green-950/40 text-green-900 dark:text-green-300',
  executor: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300'
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

  const roleColor = agent.role ? roleColors[agent.role] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200'
  const roleIcon = agent.role ? roleIcons[agent.role] || '🤖' : '🤖'
  const messageCount = agent._count?.messages || 0

  return (
    <Link
      href={`/agents/${agent.id}`}
      className="block p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all hover:border-primary/50 dark:hover:border-primary-light/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">{agent.name}</h3>
            {agent.role && (
              <span className={`px-2 py-1 text-xs font-medium rounded ${roleColor}`}>
                {roleIcon} {agent.role.charAt(0).toUpperCase() + agent.role.slice(1)}
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            {agent.description || 'No description provided'}
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary-dark dark:text-primary-light rounded">
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
          className="ml-4 p-2 text-danger hover:bg-danger/10 dark:hover:bg-danger/20 rounded-md transition-colors"
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
