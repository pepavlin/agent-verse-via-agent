'use client'

// ---------------------------------------------------------------------------
// useAgentHistory — manages per-agent chat-style interaction history.
//
// Each agent accumulates a list of AgentHistoryEntry records in chronological
// order (newest last). Entries start as 'pending' when the task is submitted
// and transition to 'done' or 'error' when the run resolves.
//
// Persistence:
//   Entries are stored in localStorage so history survives page refreshes.
//   Key: HISTORY_STORAGE_KEY (a single flat array of all entries).
// ---------------------------------------------------------------------------

import { useState, useCallback, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HistoryEntryStatus = 'pending' | 'done' | 'error'

export interface AgentHistoryEntry {
  /** Matches the RunEngine run id so we can correlate updates. */
  id: string
  /** Which agent this entry belongs to. */
  agentId: string
  /** The user's task description (displayed as a user bubble). */
  task: string
  /** The agent's response or error message (displayed as an agent bubble). */
  result?: string
  /** Current lifecycle state. */
  status: HistoryEntryStatus
  /** ISO-8601 creation timestamp. */
  timestamp: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HISTORY_STORAGE_KEY = 'agent-verse:history'
/** Maximum entries retained per agent (oldest dropped first). */
const MAX_ENTRIES_PER_AGENT = 50

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function loadFromStorage(): AgentHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AgentHistoryEntry[]
  } catch {
    return []
  }
}

function saveToStorage(entries: AgentHistoryEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseAgentHistoryReturn {
  /**
   * Returns all history entries for a given agent, ordered oldest → newest.
   * Returns an empty array if there are no entries for that agent.
   */
  getEntries: (agentId: string) => AgentHistoryEntry[]
  /**
   * Adds a new 'pending' entry to the history for an agent.
   * @param entryId  The run id (used later for updateEntry).
   */
  addEntry: (agentId: string, entryId: string, task: string) => void
  /**
   * Transitions an existing entry to 'done' or 'error' and sets the result.
   */
  updateEntry: (entryId: string, updates: { result: string; status: 'done' | 'error' }) => void
  /**
   * Removes all history entries for a specific agent.
   */
  clearAgentHistory: (agentId: string) => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAgentHistory — pure state management for per-agent interaction history.
 *
 * Does NOT subscribe to RunEngine directly; coordination lives in the
 * component that owns both RunEngine and this hook (Grid2D).
 */
export function useAgentHistory(): UseAgentHistoryReturn {
  // Flat list of all entries across all agents, kept in insertion order.
  const [entries, setEntries] = useState<AgentHistoryEntry[]>([])

  // Hydrate from localStorage once on mount (client-side only).
  useEffect(() => {
    const stored = loadFromStorage()
    if (stored.length > 0) {
      setEntries(stored)
    }
  }, [])

  // Persist to localStorage whenever entries change.
  useEffect(() => {
    saveToStorage(entries)
  }, [entries])

  // ---- Derived selector ----

  const getEntries = useCallback(
    (agentId: string): AgentHistoryEntry[] =>
      entries.filter((e) => e.agentId === agentId),
    [entries],
  )

  // ---- Mutators ----

  const addEntry = useCallback((agentId: string, entryId: string, task: string) => {
    const newEntry: AgentHistoryEntry = {
      id: entryId,
      agentId,
      task,
      status: 'pending',
      timestamp: new Date().toISOString(),
    }

    setEntries((prev) => {
      // Enforce per-agent cap: keep only the newest MAX_ENTRIES_PER_AGENT - 1 existing
      const agentEntries = prev.filter((e) => e.agentId === agentId)
      let next = [...prev]
      if (agentEntries.length >= MAX_ENTRIES_PER_AGENT) {
        // Remove oldest entry for this agent
        const oldestForAgent = prev.find((e) => e.agentId === agentId)!
        next = next.filter((e) => e.id !== oldestForAgent.id)
      }
      return [...next, newEntry]
    })
  }, [])

  const updateEntry = useCallback(
    (entryId: string, updates: { result: string; status: 'done' | 'error' }) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, result: updates.result, status: updates.status } : e,
        ),
      )
    },
    [],
  )

  const clearAgentHistory = useCallback((agentId: string) => {
    setEntries((prev) => prev.filter((e) => e.agentId !== agentId))
  }, [])

  return { getEntries, addEntry, updateEntry, clearAgentHistory }
}
