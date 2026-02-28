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

export type InboxMessageType = 'done' | 'question' | 'error'

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
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseInboxReturn {
  messages: InboxMessage[]
  unreadCount: number
  addMessage: (msg: InboxMessage) => void
  updateMessage: (id: string, updates: Partial<Omit<InboxMessage, 'id'>>) => void
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

  const dismissMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setMessages([])
  }, [])

  const markRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return { messages, unreadCount, addMessage, updateMessage, dismissMessage, clearAll, markRead }
}
