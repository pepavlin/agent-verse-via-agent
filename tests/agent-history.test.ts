import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgentHistory } from '../app/components/use-agent-history'
import type { AgentHistoryEntry } from '../app/components/use-agent-history'

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorageMock.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  localStorageMock.clear()
})

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('useAgentHistory — initial state', () => {
  it('starts with empty history for any agent', () => {
    const { result } = renderHook(() => useAgentHistory())
    expect(result.current.getEntries('agent-alice')).toEqual([])
  })

  it('getEntries returns empty array for unknown agentId', () => {
    const { result } = renderHook(() => useAgentHistory())
    expect(result.current.getEntries('nonexistent')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// addEntry
// ---------------------------------------------------------------------------

describe('useAgentHistory — addEntry', () => {
  it('adds a pending entry for the correct agent', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Explore the map')
    })

    const entries = result.current.getEntries('agent-alice')
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject<Partial<AgentHistoryEntry>>({
      id: 'run-1',
      agentId: 'agent-alice',
      task: 'Explore the map',
      status: 'pending',
    })
  })

  it('entry has a valid ISO timestamp', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Task A')
    })

    const entry = result.current.getEntries('agent-alice')[0]
    expect(() => new Date(entry.timestamp)).not.toThrow()
    expect(new Date(entry.timestamp).toString()).not.toBe('Invalid Date')
  })

  it('entries for different agents are isolated', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Alice task')
      result.current.addEntry('agent-bob', 'run-2', 'Bob task')
    })

    expect(result.current.getEntries('agent-alice')).toHaveLength(1)
    expect(result.current.getEntries('agent-bob')).toHaveLength(1)
    expect(result.current.getEntries('agent-alice')[0].task).toBe('Alice task')
    expect(result.current.getEntries('agent-bob')[0].task).toBe('Bob task')
  })

  it('multiple entries for same agent are appended in insertion order', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'First task')
      result.current.addEntry('agent-alice', 'run-2', 'Second task')
      result.current.addEntry('agent-alice', 'run-3', 'Third task')
    })

    const entries = result.current.getEntries('agent-alice')
    expect(entries).toHaveLength(3)
    expect(entries[0].id).toBe('run-1')
    expect(entries[1].id).toBe('run-2')
    expect(entries[2].id).toBe('run-3')
  })

  it('new entry has no result field', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Task')
    })

    const entry = result.current.getEntries('agent-alice')[0]
    expect(entry.result).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// updateEntry
// ---------------------------------------------------------------------------

describe('useAgentHistory — updateEntry', () => {
  it('transitions a pending entry to done with result', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Explore')
    })

    act(() => {
      result.current.updateEntry('run-1', { result: 'Exploration complete.', status: 'done' })
    })

    const entry = result.current.getEntries('agent-alice')[0]
    expect(entry.status).toBe('done')
    expect(entry.result).toBe('Exploration complete.')
  })

  it('transitions a pending entry to error with result', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Task')
    })

    act(() => {
      result.current.updateEntry('run-1', { result: 'API key missing.', status: 'error' })
    })

    const entry = result.current.getEntries('agent-alice')[0]
    expect(entry.status).toBe('error')
    expect(entry.result).toBe('API key missing.')
  })

  it('does not affect other entries when updating one', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Task 1')
      result.current.addEntry('agent-alice', 'run-2', 'Task 2')
    })

    act(() => {
      result.current.updateEntry('run-1', { result: 'Done.', status: 'done' })
    })

    const entries = result.current.getEntries('agent-alice')
    expect(entries[0].status).toBe('done')
    expect(entries[1].status).toBe('pending')
  })

  it('is a no-op for non-existent entry id', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Task')
    })

    act(() => {
      result.current.updateEntry('nonexistent-id', { result: 'X', status: 'done' })
    })

    const entry = result.current.getEntries('agent-alice')[0]
    expect(entry.status).toBe('pending')
    expect(entry.result).toBeUndefined()
  })

  it('preserves other entry fields when updating', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'My task')
    })

    const originalTimestamp = result.current.getEntries('agent-alice')[0].timestamp

    act(() => {
      result.current.updateEntry('run-1', { result: 'Done.', status: 'done' })
    })

    const entry = result.current.getEntries('agent-alice')[0]
    expect(entry.task).toBe('My task')
    expect(entry.agentId).toBe('agent-alice')
    expect(entry.id).toBe('run-1')
    expect(entry.timestamp).toBe(originalTimestamp)
  })
})

// ---------------------------------------------------------------------------
// clearAgentHistory
// ---------------------------------------------------------------------------

describe('useAgentHistory — clearAgentHistory', () => {
  it('removes all entries for the specified agent', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Task 1')
      result.current.addEntry('agent-alice', 'run-2', 'Task 2')
    })

    act(() => {
      result.current.clearAgentHistory('agent-alice')
    })

    expect(result.current.getEntries('agent-alice')).toHaveLength(0)
  })

  it('does not affect entries for other agents', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Alice task')
      result.current.addEntry('agent-bob', 'run-2', 'Bob task')
    })

    act(() => {
      result.current.clearAgentHistory('agent-alice')
    })

    expect(result.current.getEntries('agent-alice')).toHaveLength(0)
    expect(result.current.getEntries('agent-bob')).toHaveLength(1)
  })

  it('is safe to call when agent has no history', () => {
    const { result } = renderHook(() => useAgentHistory())

    expect(() => {
      act(() => {
        result.current.clearAgentHistory('agent-alice')
      })
    }).not.toThrow()

    expect(result.current.getEntries('agent-alice')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// MAX_ENTRIES_PER_AGENT cap (50 entries)
// ---------------------------------------------------------------------------

describe('useAgentHistory — per-agent entry cap', () => {
  it('keeps at most 50 entries per agent, dropping the oldest when exceeded', () => {
    const { result } = renderHook(() => useAgentHistory())

    // Add 51 entries for the same agent
    act(() => {
      for (let i = 1; i <= 51; i++) {
        result.current.addEntry('agent-alice', `run-${i}`, `Task ${i}`)
      }
    })

    const entries = result.current.getEntries('agent-alice')
    expect(entries).toHaveLength(50)
    // The oldest (run-1) should have been dropped; run-2 is now the oldest
    expect(entries[0].id).toBe('run-2')
    // The newest (run-51) should be the last entry
    expect(entries[entries.length - 1].id).toBe('run-51')
  })

  it('cap is per-agent: adding to agent B does not evict entries for agent A', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      // Fill agent-alice to exactly the cap
      for (let i = 1; i <= 50; i++) {
        result.current.addEntry('agent-alice', `alice-${i}`, `Alice task ${i}`)
      }
      // Add one entry for agent-bob
      result.current.addEntry('agent-bob', 'bob-1', 'Bob task')
    })

    // Alice still has all 50 entries (cap was not exceeded for alice)
    expect(result.current.getEntries('agent-alice')).toHaveLength(50)
    // Bob has 1 entry
    expect(result.current.getEntries('agent-bob')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

describe('useAgentHistory — localStorage persistence', () => {
  it('saves entries to localStorage on add', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => {
      result.current.addEntry('agent-alice', 'run-1', 'Persisted task')
    })

    expect(localStorageMock.setItem).toHaveBeenCalled()
    const savedData = JSON.parse(localStorageMock.setItem.mock.calls.at(-1)![1] as string) as AgentHistoryEntry[]
    expect(savedData.some((e) => e.id === 'run-1')).toBe(true)
  })

  it('saves entries to localStorage on update', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => { result.current.addEntry('agent-alice', 'run-1', 'Task') })
    vi.clearAllMocks()

    act(() => { result.current.updateEntry('run-1', { result: 'Done.', status: 'done' }) })

    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('saves entries to localStorage on clear', () => {
    const { result } = renderHook(() => useAgentHistory())

    act(() => { result.current.addEntry('agent-alice', 'run-1', 'Task') })
    vi.clearAllMocks()

    act(() => { result.current.clearAgentHistory('agent-alice') })

    expect(localStorageMock.setItem).toHaveBeenCalled()
    const savedData = JSON.parse(localStorageMock.setItem.mock.calls.at(-1)![1] as string) as AgentHistoryEntry[]
    expect(savedData.some((e) => e.agentId === 'agent-alice')).toBe(false)
  })
})
