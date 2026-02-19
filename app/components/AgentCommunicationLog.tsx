'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react'

interface CommunicationMessage {
  id: string
  fromAgentId: string
  fromAgentName: string
  toAgentId: string
  toAgentName: string
  content: string
  type: 'query' | 'response' | 'notification' | 'task'
  timestamp: Date
  metadata?: Record<string, unknown>
}

interface AgentCommunicationLogProps {
  isOpen: boolean
  onClose: () => void
}

// Color palette for agent identification
const AGENT_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
]

export default function AgentCommunicationLog({ isOpen, onClose }: AgentCommunicationLogProps) {
  const [messages, setMessages] = useState<CommunicationMessage[]>([])
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
  const [filterAgent, setFilterAgent] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch communication messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/agent-communication')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch communication log:', error)
    }
  }, [])

  // Poll for new messages every 2 seconds
  useEffect(() => {
    if (isOpen) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen, fetchMessages])

  // Get unique agent names for filtering
  const uniqueAgentNames = useMemo(() => {
    const names = new Set<string>()
    messages.forEach(msg => {
      names.add(msg.fromAgentName)
      names.add(msg.toAgentName)
    })
    return Array.from(names).sort()
  }, [messages])

  // Get unique message types for filtering
  const uniqueMessageTypes = useMemo(() => {
    const types = new Set<string>()
    messages.forEach(msg => types.add(msg.type))
    return Array.from(types).sort()
  }, [messages])

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      const matchesAgent = !filterAgent || 
        msg.fromAgentName.toLowerCase().includes(filterAgent.toLowerCase()) ||
        msg.toAgentName.toLowerCase().includes(filterAgent.toLowerCase())
      const matchesType = !filterType || msg.type === filterType
      return matchesAgent && matchesType
    })
  }, [messages, filterAgent, filterType])

  // Get consistent color for an agent
  const getAgentColor = (agentName: string): string => {
    const hash = agentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return AGENT_COLORS[hash % AGENT_COLORS.length]
  }

  // Toggle message expansion
  const toggleExpand = (messageId: string) => {
    const newExpanded = new Set(expandedMessages)
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId)
    } else {
      newExpanded.add(messageId)
    }
    setExpandedMessages(newExpanded)
  }

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-20 left-4 z-20 w-96 max-h-[70vh] overflow-hidden bg-neutral-900/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-primary/30 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-50 dark:text-neutral-50">
            Agent Communication
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1.5 hover:bg-neutral-800/50 dark:hover:bg-neutral-800/50 rounded transition-colors"
              title="Toggle filters"
            >
              <Filter className="w-4 h-4 text-neutral-400" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800/50 dark:hover:bg-neutral-800/50 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>
        
        <p className="text-xs text-neutral-400 dark:text-neutral-300 mt-1">
          {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} 
          {filterAgent || filterType ? ' (filtered)' : ''}
        </p>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 space-y-2">
            <div>
              <label className="text-xs text-neutral-400 dark:text-neutral-300 block mb-1">
                Filter by Agent
              </label>
              <input
                type="text"
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                placeholder="Agent name..."
                className="w-full px-2 py-1 text-xs bg-neutral-800/50 dark:bg-neutral-800/50 border border-neutral-700 rounded text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 dark:text-neutral-300 block mb-1">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-neutral-800/50 dark:bg-neutral-800/50 border border-neutral-700 rounded text-neutral-50 focus:outline-none focus:border-primary/50"
              >
                <option value="">All types</option>
                {uniqueMessageTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            {(filterAgent || filterType) && (
              <button
                onClick={() => {
                  setFilterAgent('')
                  setFilterType('')
                }}
                className="text-xs text-primary-light hover:text-primary underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
        {filteredMessages.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
            {messages.length === 0 
              ? 'No agent communications yet'
              : 'No messages match your filters'
            }
          </div>
        ) : (
          <div className="divide-y divide-neutral-800 dark:divide-neutral-800">
            {filteredMessages.map((message) => {
              const isExpanded = expandedMessages.has(message.id)
              const fromColor = getAgentColor(message.fromAgentName)
              const toColor = getAgentColor(message.toAgentName)

              return (
                <div
                  key={message.id}
                  className="p-3 hover:bg-neutral-800/30 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  {/* Message Header */}
                  <div
                    className="flex items-start gap-2 cursor-pointer"
                    onClick={() => toggleExpand(message.id)}
                  >
                    <button className="mt-0.5 flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${fromColor}`}>
                          {message.fromAgentName}
                        </span>
                        <span className="text-neutral-500 text-xs">→</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${toColor}`}>
                          {message.toAgentName}
                        </span>
                        <span className="text-neutral-600 dark:text-neutral-400 text-xs ml-auto">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-neutral-800/50 dark:bg-neutral-800/50 text-neutral-300">
                          {message.type}
                        </span>
                      </div>

                      {/* Preview when collapsed */}
                      {!isExpanded && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-300 mt-1 line-clamp-1">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-2 ml-6 space-y-2">
                      <div className="bg-neutral-800/30 dark:bg-neutral-800/30 rounded p-2">
                        <p className="text-xs text-neutral-300 dark:text-neutral-200 whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      
                      {message.metadata && Object.keys(message.metadata).length > 0 && (
                        <div className="text-xs">
                          <div className="text-neutral-500 dark:text-neutral-400 mb-1">
                            Metadata:
                          </div>
                          <div className="bg-neutral-800/30 dark:bg-neutral-800/30 rounded p-2">
                            <pre className="text-neutral-400 dark:text-neutral-300 text-xs overflow-x-auto">
                              {JSON.stringify(message.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
