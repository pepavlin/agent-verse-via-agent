'use client'

import { VisualAgent } from '@/types/visualization'
import { Trash2, MessageSquare, Play, Pause, Settings } from 'lucide-react'

interface AgentToolbarProps {
  selectedAgents: VisualAgent[]
  onAction?: (action: string, agents: VisualAgent[]) => void
}

export default function AgentToolbar({ selectedAgents, onAction }: AgentToolbarProps) {
  const handleAction = (action: string) => {
    if (selectedAgents.length === 0) return
    onAction?.(action, selectedAgents)
  }

  const isDisabled = selectedAgents.length === 0

  return (
    <div className="bg-white border-b border-neutral-300 p-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-700 font-medium mr-2">Actions:</span>

        <button
          onClick={() => handleAction('chat')}
          disabled={isDisabled}
          className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white text-sm rounded-md transition-colors font-medium"
          title="Chat with selected agents"
        >
          <MessageSquare size={16} />
          <span>Chat</span>
        </button>

        <button
          onClick={() => handleAction('start')}
          disabled={isDisabled}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white text-sm rounded-md transition-colors font-medium"
          title="Start selected agents"
        >
          <Play size={16} />
          <span>Start</span>
        </button>

        <button
          onClick={() => handleAction('pause')}
          disabled={isDisabled}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white text-sm rounded-md transition-colors font-medium"
          title="Pause selected agents"
        >
          <Pause size={16} />
          <span>Pause</span>
        </button>

        <button
          onClick={() => handleAction('configure')}
          disabled={isDisabled}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white text-sm rounded-md transition-colors font-medium"
          title="Configure selected agents"
        >
          <Settings size={16} />
          <span>Configure</span>
        </button>

        <div className="flex-1" />

        <button
          onClick={() => handleAction('delete')}
          disabled={isDisabled}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white text-sm rounded-md transition-colors font-medium"
          title="Delete selected agents"
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  )
}
