'use client'

import { useState, useEffect, useCallback } from 'react'
import { CommunicationEvent } from '@/types'
import { X, Filter, Search, ChevronDown, ChevronUp, Trash2, Play, Download } from 'lucide-react'

interface CommunicationLogPanelProps {
  onClose: () => void
}

// Agent color mapping for consistent styling
const AGENT_COLORS: Record<string, string> = {
  system: '#6366f1', // indigo
  default: '#8b5cf6', // purple
}

const getAgentColor = (agentName?: string): string => {
  if (!agentName) return AGENT_COLORS.default
  if (agentName === 'System') return AGENT_COLORS.system
  
  // Generate consistent color based on agent name hash
  let hash = 0
  for (let i = 0; i < agentName.length; i++) {
    hash = agentName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

const formatTimestamp = (date: Date): string => {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  
  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`
  
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getEventIcon = (type: string): string => {
  switch (type) {
    case 'message': return '💬'
    case 'workflow_start': return '🚀'
    case 'workflow_end': return '✅'
    case 'execution': return '⚡'
    case 'broadcast': return '📢'
    default: return '•'
  }
}

export default function CommunicationLogPanel({ onClose }: CommunicationLogPanelProps) {
  const [events, setEvents] = useState<CommunicationEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CommunicationEvent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAgent, setFilterAgent] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Close export menu when clicking outside
  useEffect(() => {
    if (!showExportMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-export-menu]')) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/communication-events?limit=100')
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Failed to fetch communication events:', error)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [fetchEvents])

  useEffect(() => {
    let filtered = events

    // Filter by search term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      filtered = filtered.filter(event =>
        event.content.toLowerCase().includes(lower) ||
        event.fromAgentName?.toLowerCase().includes(lower) ||
        event.toAgentName?.toLowerCase().includes(lower)
      )
    }

    // Filter by agent
    if (filterAgent) {
      filtered = filtered.filter(event =>
        event.fromAgentName === filterAgent || event.toAgentName === filterAgent
      )
    }

    // Filter by type
    if (filterType) {
      filtered = filtered.filter(event => event.type === filterType)
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, filterAgent, filterType])

  const toggleExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const clearEvents = async () => {
    try {
      await fetch('/api/communication-events', { method: 'DELETE' })
      setEvents([])
      setFilteredEvents([])
    } catch (error) {
      console.error('Failed to clear events:', error)
    }
  }

  const generateDemoEvents = async () => {
    try {
      await fetch('/api/demo-events', { method: 'POST' })
      // Refresh events after generating demos
      setTimeout(() => fetchEvents(), 500)
    } catch (error) {
      console.error('Failed to generate demo events:', error)
    }
  }

  const exportAsJSON = () => {
    const data = JSON.stringify(filteredEvents, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `agent-communications-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const exportAsCSV = () => {
    const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`
    const headers = ['id', 'type', 'fromAgentName', 'toAgentName', 'content', 'timestamp', 'workflowId', 'taskId']
    const rows = filteredEvents.map(event => [
      escapeCSV(event.id),
      escapeCSV(event.type),
      escapeCSV(event.fromAgentName ?? ''),
      escapeCSV(event.toAgentName ?? ''),
      escapeCSV(event.content),
      escapeCSV(new Date(event.timestamp).toISOString()),
      escapeCSV(event.workflowId ?? ''),
      escapeCSV(event.taskId ?? ''),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `agent-communications-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // Get unique agent names and event types
  const uniqueAgents = Array.from(
    new Set(
      events.flatMap(e => [e.fromAgentName, e.toAgentName].filter(Boolean) as string[])
    )
  ).sort()

  const eventTypes = Array.from(new Set(events.map(e => e.type))).sort()

  return (
    <div className="fixed top-20 left-4 z-20 w-96 max-h-[75vh] bg-neutral-900/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-primary/30 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-50 dark:text-neutral-50">
            Agent Communications
          </h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-300 mt-1">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-neutral-800/50 dark:hover:bg-neutral-800/50 rounded-md transition-colors"
            title="Toggle filters"
          >
            <Filter className="w-4 h-4 text-neutral-400" />
          </button>
          <button
            onClick={generateDemoEvents}
            className="p-2 hover:bg-neutral-800/50 dark:hover:bg-neutral-800/50 rounded-md transition-colors"
            title="Generate demo events"
          >
            <Play className="w-4 h-4 text-neutral-400" />
          </button>
          <button
            onClick={clearEvents}
            className="p-2 hover:bg-neutral-800/50 dark:hover:bg-neutral-800/50 rounded-md transition-colors"
            title="Clear all events"
          >
            <Trash2 className="w-4 h-4 text-neutral-400" />
          </button>
          <div className="relative" data-export-menu>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 hover:bg-neutral-800/50 dark:hover:bg-neutral-800/50 rounded-md transition-colors"
              title="Export events"
              disabled={filteredEvents.length === 0}
            >
              <Download className="w-4 h-4 text-neutral-400" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-50 min-w-32">
                <button
                  onClick={exportAsJSON}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700 transition-colors rounded-t-md"
                >
                  Export JSON
                </button>
                <button
                  onClick={exportAsCSV}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700 transition-colors rounded-b-md"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800/50 dark:hover:bg-neutral-800/50 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="border-b border-neutral-800 dark:border-neutral-800">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-800/50 dark:bg-neutral-800/50 border border-neutral-700 dark:border-neutral-700 rounded-md text-neutral-50 dark:text-neutral-50 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {showFilters && (
          <div className="p-3 pt-0 space-y-2">
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800/50 dark:bg-neutral-800/50 border border-neutral-700 dark:border-neutral-700 rounded-md text-neutral-50 dark:text-neutral-50 text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="">All Agents</option>
              {uniqueAgents.map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800/50 dark:bg-neutral-800/50 border border-neutral-700 dark:border-neutral-700 rounded-md text-neutral-50 dark:text-neutral-50 text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="">All Types</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>
                  {getEventIcon(type)} {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-300">
            {events.length === 0 ? (
              <>
                <div className="text-3xl mb-2">💬</div>
                <div>No communication events yet</div>
                <div className="text-xs mt-2">Events will appear when agents interact</div>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">🔍</div>
                <div>No events match your filters</div>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800 dark:divide-neutral-800">
            {filteredEvents.map(event => {
              const isExpanded = expandedEvents.has(event.id)
              const fromColor = getAgentColor(event.fromAgentName)
              const toColor = event.toAgentName ? getAgentColor(event.toAgentName) : undefined

              return (
                <div
                  key={event.id}
                  className="p-3 hover:bg-neutral-800/30 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="text-lg mt-0.5 flex-shrink-0">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {event.fromAgentName && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${fromColor}20`,
                              color: fromColor,
                              borderLeft: `3px solid ${fromColor}`
                            }}
                          >
                            {event.fromAgentName}
                          </span>
                        )}
                        {event.toAgentName && (
                          <>
                            <span className="text-neutral-400 text-xs">→</span>
                            <span
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: `${toColor}20`,
                                color: toColor,
                                borderLeft: `3px solid ${toColor}`
                              }}
                            >
                              {event.toAgentName}
                            </span>
                          </>
                        )}
                        <span className="text-xs text-neutral-400 dark:text-neutral-300 ml-auto">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-300 dark:text-neutral-200 leading-snug">
                        {isExpanded ? (
                          event.content
                        ) : (
                          event.content.length > 100
                            ? `${event.content.substring(0, 100)}...`
                            : event.content
                        )}
                      </div>
                      {event.content.length > 100 && (
                        <button
                          onClick={() => toggleExpanded(event.id)}
                          className="flex items-center gap-1 text-xs text-primary-light hover:text-primary mt-2"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              Show more
                            </>
                          )}
                        </button>
                      )}
                      {event.metadata && Object.keys(event.metadata).length > 0 && isExpanded && (
                        <div className="mt-2 p-2 bg-neutral-800/50 rounded text-xs text-neutral-400 dark:text-neutral-300 font-mono">
                          {JSON.stringify(event.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
