'use client'

// ---------------------------------------------------------------------------
// useInbox — manages the inbox message state
//
// The inbox stores messages from agent task runs delivered with mode='inbox'.
// Each message has a type:
//   'question' — task is in progress (agent is working on it)
//   'done'     — task completed successfully
//   'error'    — task failed
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InboxMessageType = 'done' | 'question' | 'error' | 'delegating'

export interface InboxMessage {
  /** Run ID — unique identifier, used to update in-progress messages. */
  id: string
  /** Visual category of the message. */
  type: InboxMessageType
  /** Display name of the agent that performed the task. */
  agentName: string
  /** Agent brand colour as a 0xRRGGBB number. */
  agentColor: number
  /** Plain-language description of the task. */
  task: string
  /** Status text: result prose for done, error description for error, placeholder for question. */
  text: string
  /**
   * When true, the message represents an agent waiting for the user's answer.
   * Enables the inline reply form in the Inbox UI.
   * Only meaningful when type === 'question'.
   */
  awaitingAnswer?: boolean
  /**
   * Sub-messages for child runs spawned by this parent run during delegation.
   * Each entry corresponds to a single child agent's sub-run result.
   */
  childMessages?: ChildRunMessage[]
}

/** A condensed result entry for a single child sub-run inside a parent inbox message. */
export interface ChildRunMessage {
  /** Child run ID. */
  id: string
  /** Type reflects the child run's terminal state. */
  type: 'done' | 'question' | 'error'
  /** Display name of the child agent. */
  agentName: string
  /** Child agent brand colour. */
  agentColor: number
  /** Result or error text. */
  text: string
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseInboxReturn {
  messages: InboxMessage[]
  unreadCount: number
  addMessage: (msg: InboxMessage) => void
  updateMessage: (id: string, updates: Partial<Omit<InboxMessage, 'id'>>) => void
  addChildMessage: (parentId: string, child: ChildRunMessage) => void
  dismissMessage: (id: string) => void
  clearAll: () => void
  markRead: () => void
}

/**
 * useInbox — pure state management for the inbox message feed.
 *
 * Does NOT subscribe to RunEngine directly; coordination lives in the
 * component that owns both RunEngine and this hook (Grid2D).
 */
export function useInbox(): UseInboxReturn {
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const addMessage = useCallback((msg: InboxMessage) => {
    setMessages((prev) => [msg, ...prev])
    setUnreadCount((c) => c + 1)
  }, [])

  const updateMessage = useCallback(
    (id: string, updates: Partial<Omit<InboxMessage, 'id'>>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      )
      // If updating to a terminal state ('done'|'error'), bump unread count
      if (updates.type === 'done' || updates.type === 'error') {
        setUnreadCount((c) => c + 1)
      }
    },
    [],
  )

  const addChildMessage = useCallback((parentId: string, child: ChildRunMessage) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== parentId) return m
        const existing = m.childMessages ?? []
        // Replace if already present (update), otherwise append
        const idx = existing.findIndex((c) => c.id === child.id)
        const updated =
          idx >= 0
            ? existing.map((c, i) => (i === idx ? child : c))
            : [...existing, child]
        return { ...m, childMessages: updated }
      }),
    )
  }, [])

  const dismissMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setMessages([])
  }, [])

  const markRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return { messages, unreadCount, addMessage, updateMessage, addChildMessage, dismissMessage, clearAll, markRead }
}
