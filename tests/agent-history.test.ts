import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgentHistory } from '../app/components/use-agent-history'
import type { HistoryEntry } from '../app/components/use-agent-history'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_ENTRY: Omit<HistoryEntry, 'id'> = {
  agentId: 'agent-alice',
  task: 'Map the northern sector',
  type: 'done',
  result: 'Northern sector fully mapped.',
  timestamp: 1_700_000_000_000,
}

// ---------------------------------------------------------------------------
// useAgentHistory — unit tests
// ---------------------------------------------------------------------------

describe('useAgentHistory', () => {
  // ---- getHistory ----

  it('returns empty array for unknown agentId', () => {
    const { result } = renderHook(() => useAgentHistory())
    expect(result.current.getHistory('agent-unknown')).toEqual([])
  })

  it('returns empty array before any entries are added', () => {
    const { result } = renderHook(() => useAgentHistory())
    expect(result.current.getHistory('agent-alice')).toHaveLength(0)
  })

  // ---- addEntry ----

  it('adds a single entry and returns it via getHistory', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry(BASE_ENTRY)
    })

    const history = result.current.getHistory('agent-alice')
    expect(history).toHaveLength(1)
    expect(history[0].task).toBe(BASE_ENTRY.task)
    expect(history[0].type).toBe(BASE_ENTRY.type)
    expect(history[0].result).toBe(BASE_ENTRY.result)
    expect(history[0].agentId).toBe(BASE_ENTRY.agentId)
    expect(history[0].timestamp).toBe(BASE_ENTRY.timestamp)
  })

  it('assigns a unique id to each entry', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry(BASE_ENTRY)
      result.current.addEntry({ ...BASE_ENTRY, task: 'A second task' })
    })

    const history = result.current.getHistory('agent-alice')
    expect(history).toHaveLength(2)
    expect(history[0].id).toBeTruthy()
    expect(history[1].id).toBeTruthy()
    expect(history[0].id).not.toBe(history[1].id)
  })

  it('maintains insertion order (oldest first)', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry({ ...BASE_ENTRY, task: 'Task A', timestamp: 1000 })
      result.current.addEntry({ ...BASE_ENTRY, task: 'Task B', timestamp: 2000 })
      result.current.addEntry({ ...BASE_ENTRY, task: 'Task C', timestamp: 3000 })
    })

    const history = result.current.getHistory('agent-alice')
    expect(history[0].task).toBe('Task A')
    expect(history[1].task).toBe('Task B')
    expect(history[2].task).toBe('Task C')
  })

  it('stores entries separately per agentId', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry({ ...BASE_ENTRY, agentId: 'agent-alice', task: 'Alice task' })
      result.current.addEntry({ ...BASE_ENTRY, agentId: 'agent-bob', task: 'Bob task' })
    })

    const aliceHistory = result.current.getHistory('agent-alice')
    const bobHistory = result.current.getHistory('agent-bob')

    expect(aliceHistory).toHaveLength(1)
    expect(aliceHistory[0].task).toBe('Alice task')

    expect(bobHistory).toHaveLength(1)
    expect(bobHistory[0].task).toBe('Bob task')
  })

  it('supports all three entry types', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry({ ...BASE_ENTRY, type: 'done', result: 'Task complete.' })
      result.current.addEntry({ ...BASE_ENTRY, type: 'question', result: 'What is the priority?' })
      result.current.addEntry({ ...BASE_ENTRY, type: 'error', result: 'Network timeout.' })
    })

    const history = result.current.getHistory('agent-alice')
    expect(history.map((e) => e.type)).toEqual(['done', 'question', 'error'])
  })

  // ---- clearHistory ----

  it('removes all entries for a specific agent', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry(BASE_ENTRY)
      result.current.addEntry({ ...BASE_ENTRY, task: 'Second task' })
    })

    expect(result.current.getHistory('agent-alice')).toHaveLength(2)

    act(() => {
      result.current.clearHistory('agent-alice')
    })

    expect(result.current.getHistory('agent-alice')).toHaveLength(0)
  })

  it('only clears the specified agent, leaving others intact', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry({ ...BASE_ENTRY, agentId: 'agent-alice', task: 'Alice task' })
      result.current.addEntry({ ...BASE_ENTRY, agentId: 'agent-bob', task: 'Bob task' })
    })

    act(() => {
      result.current.clearHistory('agent-alice')
    })

    expect(result.current.getHistory('agent-alice')).toHaveLength(0)
    expect(result.current.getHistory('agent-bob')).toHaveLength(1)
  })

  it('is a no-op when clearing an agent with no history', () => {
    const { result } = renderHook(() => useAgentHistory())

    expect(() => {
      act(() => {
        result.current.clearHistory('agent-nonexistent')
      })
    }).not.toThrow()

    expect(result.current.getHistory('agent-nonexistent')).toHaveLength(0)
  })

  // ---- accumulation ----

  it('accumulates entries across multiple addEntry calls', () => {
    const { result } = renderHook(() => useAgentHistory())

    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.addEntry({ ...BASE_ENTRY, task: `Task ${i}`, timestamp: i * 1000 })
      })
    }

    expect(result.current.getHistory('agent-alice')).toHaveLength(5)
  })
})
