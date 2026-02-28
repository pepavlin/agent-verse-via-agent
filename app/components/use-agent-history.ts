'use client'

// ---------------------------------------------------------------------------
// useAgentHistory — manages per-agent interaction history
//
// Stores a chronological log of agent run outcomes (completed tasks,
// questions asked, and errors) in a chat-style history for each agent.
//
// History entries are kept in insertion order (oldest first) so that
// the UI can show them in reverse order (newest first / newest at bottom
// depending on layout preference).
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Visual category of a history entry — mirrors the run terminal states.
 * - 'done'     : run completed successfully
 * - 'question' : run asked a clarifying question (paused or answered)
 * - 'error'    : run failed
 */
export type HistoryEntryType = 'done' | 'question' | 'error'

/** A single recorded interaction between the user and an agent. */
export interface HistoryEntry {
  /** Unique entry identifier (cuid-style). */
  id: string
  /** ID of the agent this entry belongs to. */
  agentId: string
  /** The user's task description (acts as the "user message" in chat view). */
  task: string
  /** Terminal state type — determines visual styling. */
  type: HistoryEntryType
  /** Agent response text: result prose, question text, or error description. */
  result: string
  /** Unix timestamp (ms) when this entry was recorded. */
  timestamp: number
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseAgentHistoryReturn {
  /**
   * Retrieve all history entries for a given agent, oldest first.
   * Returns an empty array if the agent has no history.
   */
  getHistory: (agentId: string) => HistoryEntry[]
  /** Record a new interaction outcome for an agent. */
  addEntry: (entry: Omit<HistoryEntry, 'id'>) => void
  /** Remove all history entries for a specific agent. */
  clearHistory: (agentId: string) => void
}

// ---------------------------------------------------------------------------
// Simple ID generator — avoids external deps
// ---------------------------------------------------------------------------

let _seq = 0
function genId(): string {
  return `hist-${Date.now()}-${(++_seq).toString(36)}`
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAgentHistory — pure React state management for per-agent interaction logs.
 *
 * Does not communicate with the run engine directly; the caller (Grid2D) is
 * responsible for calling `addEntry` when run events fire.
 */
export function useAgentHistory(): UseAgentHistoryReturn {
  // Map from agentId → ordered array of history entries (oldest first)
  const [historyMap, setHistoryMap] = useState<Map<string, HistoryEntry[]>>(new Map())

  const getHistory = useCallback(
    (agentId: string): HistoryEntry[] => {
      return historyMap.get(agentId) ?? []
    },
    [historyMap],
  )

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id'>) => {
    const withId: HistoryEntry = { ...entry, id: genId() }
    setHistoryMap((prev) => {
      const next = new Map(prev)
      const existing = next.get(entry.agentId) ?? []
      next.set(entry.agentId, [...existing, withId])
      return next
    })
  }, [])

  const clearHistory = useCallback((agentId: string) => {
    setHistoryMap((prev) => {
      const next = new Map(prev)
      next.delete(agentId)
      return next
    })
  }, [])

  return { getHistory, addEntry, clearHistory }
}
