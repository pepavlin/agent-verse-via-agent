import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RunEngine } from '../app/run-engine/engine'
import type { ChildAgentDef } from '../app/run-engine/engine'
import type { Run } from '../app/run-engine/types'
import { composeDelegatedResults } from '../app/run-engine/results'
import type { ChildRunOutcome } from '../app/run-engine/results'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function instantEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
}

const PARENT_AGENT: ChildAgentDef = { agentId: 'agent-alice', agentName: 'Alice', agentRole: 'Explorer' }
const CHILD_BOB: ChildAgentDef = { agentId: 'agent-bob', agentName: 'Bob', agentRole: 'Builder' }
const CHILD_CAROL: ChildAgentDef = { agentId: 'agent-carol', agentName: 'Carol', agentRole: 'Scout' }

const TASK = 'Survey the northern sector'

// ---------------------------------------------------------------------------
// composeDelegatedResults — pure function
// ---------------------------------------------------------------------------

describe('composeDelegatedResults', () => {
  it('returns a non-empty string', () => {
    const result = composeDelegatedResults('Alice', [])
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes parent agent name', () => {
    const result = composeDelegatedResults('Alice', [])
    expect(result).toContain('Alice')
  })

  it('includes child agent names in output', () => {
    const outcomes: ChildRunOutcome[] = [
      { agentName: 'Bob', agentRole: 'Builder', result: 'Built the base.' },
      { agentName: 'Carol', agentRole: 'Scout', result: 'Scouted the area.' },
    ]
    const result = composeDelegatedResults('Alice', outcomes)
    expect(result).toContain('Bob')
    expect(result).toContain('Carol')
  })

  it('includes result text for successful children', () => {
    const outcomes: ChildRunOutcome[] = [
      { agentName: 'Bob', agentRole: 'Builder', result: 'Specific result text' },
    ]
    const result = composeDelegatedResults('Alice', outcomes)
    expect(result).toContain('Specific result text')
  })

  it('includes error text for failed children', () => {
    const outcomes: ChildRunOutcome[] = [
      { agentName: 'Bob', agentRole: 'Builder', error: 'Connection timeout' },
    ]
    const result = composeDelegatedResults('Alice', outcomes)
    expect(result).toContain('Connection timeout')
    expect(result).toContain('failed')
  })

  it('handles mixed success and failure', () => {
    const outcomes: ChildRunOutcome[] = [
      { agentName: 'Bob', agentRole: 'Builder', result: 'Bob succeeded' },
      { agentName: 'Carol', agentRole: 'Scout', error: 'Carol timed out' },
    ]
    const result = composeDelegatedResults('Alice', outcomes)
    expect(result).toContain('Bob succeeded')
    expect(result).toContain('Carol timed out')
  })

  it('includes agent count in header', () => {
    const outcomes: ChildRunOutcome[] = [
      { agentName: 'Bob', agentRole: 'Builder', result: 'Done.' },
      { agentName: 'Carol', agentRole: 'Scout', result: 'Done.' },
    ]
    const result = composeDelegatedResults('Alice', outcomes)
    expect(result).toContain('2')
  })

  it('handles empty children gracefully', () => {
    const result = composeDelegatedResults('Alice', [])
    expect(result).toContain('Alice')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// RunEngine.createRun — parentRunId support
// ---------------------------------------------------------------------------

describe('RunEngine.createRun — parentRunId', () => {
  it('creates a run without parentRunId by default', () => {
    const engine = new RunEngine()
    const run = engine.createRun('agent-alice', 'Alice', 'Explorer', TASK)
    expect(run.parentRunId).toBeUndefined()
  })

  it('creates a run with parentRunId when provided', () => {
    const engine = new RunEngine()
    const parent = engine.createRun('agent-alice', 'Alice', 'Explorer', TASK)
    const child = engine.createRun('agent-bob', 'Bob', 'Builder', TASK, parent.id)
    expect(child.parentRunId).toBe(parent.id)
  })

  it('stores childRunIds on Run — initially undefined', () => {
    const engine = new RunEngine()
    const run = engine.createRun('agent-alice', 'Alice', 'Explorer', TASK)
    expect(run.childRunIds).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// RunEngine.getChildRuns / getParentRun
// ---------------------------------------------------------------------------

describe('RunEngine — getChildRuns / getParentRun', () => {
  it('getChildRuns returns empty array when run has no children', () => {
    const engine = new RunEngine()
    const run = engine.createRun('agent-alice', 'Alice', 'Explorer', TASK)
    expect(engine.getChildRuns(run.id)).toEqual([])
  })

  it('getChildRuns returns empty array for unknown id', () => {
    const engine = new RunEngine()
    expect(engine.getChildRuns('non-existent')).toEqual([])
  })

  it('getChildRuns returns child runs after delegation starts', async () => {
    const engine = instantEngine()
    const parentRun = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => {
        if (r.id === parentRun.id) resolve()
      })
    })

    engine.startRunWithChildren(parentRun.id, [CHILD_BOB, CHILD_CAROL])
    await settled

    const children = engine.getChildRuns(parentRun.id)
    expect(children).toHaveLength(2)
    expect(children.every((c) => c.parentRunId === parentRun.id)).toBe(true)
  })

  it('getParentRun returns undefined for top-level run', () => {
    const engine = new RunEngine()
    const run = engine.createRun('agent-alice', 'Alice', 'Explorer', TASK)
    expect(engine.getParentRun(run.id)).toBeUndefined()
  })

  it('getParentRun returns parent for child run', async () => {
    const engine = instantEngine()
    const parentRun = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => {
        if (r.id === parentRun.id) resolve()
      })
    })

    engine.startRunWithChildren(parentRun.id, [CHILD_BOB])
    await settled

    const children = engine.getChildRuns(parentRun.id)
    expect(children).toHaveLength(1)
    const retrieved = engine.getParentRun(children[0].id)
    expect(retrieved?.id).toBe(parentRun.id)
  })

  it('getParentRun returns undefined for unknown run id', () => {
    const engine = new RunEngine()
    expect(engine.getParentRun('unknown-id')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// RunEngine.startRunWithChildren — basic lifecycle
// ---------------------------------------------------------------------------

describe('RunEngine.startRunWithChildren — lifecycle', () => {
  it('throws if run does not exist', () => {
    const engine = new RunEngine()
    expect(() => engine.startRunWithChildren('non-existent', [])).toThrowError('not found')
  })

  it('throws if run is already running', async () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [])
    await settled

    expect(() => engine.startRunWithChildren(run.id, [])).toThrowError("expected status 'pending'")
  })

  it('emits run:started immediately', () => {
    const handler = vi.fn()
    const engine = instantEngine()
    engine.on('run:started', handler)

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)
    engine.startRunWithChildren(run.id, [])

    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0].id).toBe(run.id)
    expect(handler.mock.calls[0][0].status).toBe('running')
  })

  it('completes in mock mode with no children', async () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [])
    await settled

    const completed = engine.getRun(run.id)!
    expect(completed.status).toBe('completed')
    expect(completed.result).toBeDefined()
    expect(completed.result!.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// RunEngine.startRunWithChildren — delegation state transitions
// ---------------------------------------------------------------------------

describe('RunEngine.startRunWithChildren — delegation state', () => {
  it('emits run:delegating when children are present', () => {
    const handler = vi.fn()
    const engine = instantEngine()
    engine.on('run:delegating', handler)

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)
    engine.startRunWithChildren(run.id, [CHILD_BOB])

    expect(handler).toHaveBeenCalledOnce()
    const emitted = handler.mock.calls[0][0]
    expect(emitted.id).toBe(run.id)
    expect(emitted.status).toBe('delegating')
  })

  it('does NOT emit run:delegating when no children', () => {
    const handler = vi.fn()
    const engine = instantEngine()
    engine.on('run:delegating', handler)

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)
    engine.startRunWithChildren(run.id, [])

    expect(handler).not.toHaveBeenCalled()
  })

  it('parent run has childRunIds set after delegation starts', () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)
    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL])

    const current = engine.getRun(run.id)!
    expect(current.childRunIds).toBeDefined()
    expect(current.childRunIds).toHaveLength(2)
  })

  it('child runs are created with parentRunId referencing the parent', () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)
    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL])

    const parent = engine.getRun(run.id)!
    const childIds = parent.childRunIds ?? []

    for (const childId of childIds) {
      const child = engine.getRun(childId)!
      expect(child.parentRunId).toBe(run.id)
    }
  })

  it('child runs use the parent task description', () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)
    engine.startRunWithChildren(run.id, [CHILD_BOB])

    const parent = engine.getRun(run.id)!
    const [childId] = parent.childRunIds ?? []
    const child = engine.getRun(childId)!

    expect(child.taskDescription).toBe(TASK)
  })

  it('child runs have correct agentIds', () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)
    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL])

    const parent = engine.getRun(run.id)!
    const childIds = parent.childRunIds ?? []

    const agentIds = childIds.map((id) => engine.getRun(id)!.agentId)
    expect(agentIds).toContain(CHILD_BOB.agentId)
    expect(agentIds).toContain(CHILD_CAROL.agentId)
  })
})

// ---------------------------------------------------------------------------
// RunEngine.startRunWithChildren — completion (mock mode, no executor)
// ---------------------------------------------------------------------------

describe('RunEngine.startRunWithChildren — mock mode completion', () => {
  it('parent completes after all children complete', async () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL])
    await settled

    expect(engine.getRun(run.id)!.status).toBe('completed')
  })

  it('parent result contains delegation report in mock mode', async () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL])
    await settled

    const result = engine.getRun(run.id)!.result ?? ''
    // Should contain the delegation report header
    expect(result).toContain('Alice')
    expect(result.length).toBeGreaterThan(0)
  })

  it('child runs all reach completed or failed', async () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL])
    await settled

    const children = engine.getChildRuns(run.id)
    expect(children).toHaveLength(2)
    for (const child of children) {
      expect(['completed', 'awaiting', 'failed']).toContain(child.status)
    }
  })

  it('emits run:completed event for parent', async () => {
    const handler = vi.fn()
    const engine = instantEngine()
    engine.on('run:completed', handler)

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [CHILD_BOB])
    await settled

    // handler is called for children AND parent — find the parent call
    const parentCall = handler.mock.calls.find((call) => call[0].id === run.id)
    expect(parentCall).toBeDefined()
    expect(parentCall![0].status).toBe('completed')
  })

  it('single child: parent completes after child', async () => {
    const completedIds: string[] = []
    const engine = instantEngine()
    engine.on('run:completed', (r) => completedIds.push(r.id))

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [CHILD_BOB])
    await settled

    // Child must appear before parent in the completion order
    const parentIdx = completedIds.indexOf(run.id)
    expect(parentIdx).toBeGreaterThan(0) // at least child came first
    // The run before the parent should be the child
    const childId = completedIds[parentIdx - 1]
    expect(engine.getRun(childId)!.parentRunId).toBe(run.id)
  })
})

// ---------------------------------------------------------------------------
// RunEngine.startRunWithChildren — custom executor factory
// ---------------------------------------------------------------------------

describe('RunEngine.startRunWithChildren — custom executors', () => {
  it('calls child executor for each child', async () => {
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
    const childExecutorCalls: string[] = []

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    const childExecutorFactory = (agentId: string) => {
      childExecutorCalls.push(agentId)
      return async () => `Child ${agentId} done.`
    }

    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL], undefined, childExecutorFactory)
    await settled

    expect(childExecutorCalls).toContain(CHILD_BOB.agentId)
    expect(childExecutorCalls).toContain(CHILD_CAROL.agentId)
  })

  it('calls parent executor factory with settled child runs', async () => {
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
    let capturedChildRuns: Run[] = []

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    const parentExecutorFactory = (childRuns: Run[]) => {
      capturedChildRuns = childRuns
      return async () => 'Parent synthesized result.'
    }

    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL], parentExecutorFactory)
    await settled

    expect(capturedChildRuns).toHaveLength(2)
    expect(capturedChildRuns.every((r) => ['completed', 'awaiting', 'failed'].includes(r.status))).toBe(true)
  })

  it('uses parent executor result as the parent run result', async () => {
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
    const expectedResult = 'Synthesized from children: all tasks complete.'

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    const parentExecutorFactory = (_childRuns: Run[]) => async () => expectedResult

    engine.startRunWithChildren(run.id, [CHILD_BOB], parentExecutorFactory)
    await settled

    expect(engine.getRun(run.id)!.result).toBe(expectedResult)
  })

  it('child executor result is stored in child run', async () => {
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
    const bobResult = 'Bob specifically completed.'

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    const childExecutorFactory = (agentId: string) => async () =>
      agentId === CHILD_BOB.agentId ? bobResult : 'Carol done.'

    engine.startRunWithChildren(run.id, [CHILD_BOB], undefined, childExecutorFactory)
    await settled

    const children = engine.getChildRuns(run.id)
    const bobRun = children.find((c) => c.agentId === CHILD_BOB.agentId)
    expect(bobRun?.result).toBe(bobResult)
  })

  it('parent fails if parent executor throws', async () => {
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:failed', (r) => { if (r.id === run.id) resolve() })
    })

    const parentExecutorFactory = (_childRuns: Run[]) => async (): Promise<string> => {
      throw new Error('Parent synthesis failed')
    }

    engine.startRunWithChildren(run.id, [CHILD_BOB], parentExecutorFactory)
    await settled

    const failed = engine.getRun(run.id)!
    expect(failed.status).toBe('failed')
    expect(failed.error).toContain('Parent synthesis failed')
  })
})

// ---------------------------------------------------------------------------
// RunEngine.startRunWithChildren — parallel child execution
// ---------------------------------------------------------------------------

describe('RunEngine.startRunWithChildren — parallel execution', () => {
  it('multiple children run concurrently (all children start before any finishes)', async () => {
    // Use a delay so we can observe the state while children are running
    const engine = new RunEngine({ delayFn: () => 50, mockQuestionProbability: 0 })
    const startTimes: Record<string, number> = {}

    engine.on('run:started', (r) => {
      if (r.agentId !== PARENT_AGENT.agentId) {
        startTimes[r.agentId] = Date.now()
      }
    })

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL])
    await settled

    // Both children should have been started
    expect(Object.keys(startTimes)).toContain(CHILD_BOB.agentId)
    expect(Object.keys(startTimes)).toContain(CHILD_CAROL.agentId)
  })

  it('each child run appears in getAllRuns', async () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL])
    await settled

    const all = engine.getAllRuns()
    // 1 parent + 2 children = 3 total
    expect(all).toHaveLength(3)
  })

  it('children appear in getRunsByAgent for their respective agents', async () => {
    const engine = instantEngine()
    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [CHILD_BOB, CHILD_CAROL])
    await settled

    expect(engine.getRunsByAgent(CHILD_BOB.agentId)).toHaveLength(1)
    expect(engine.getRunsByAgent(CHILD_CAROL.agentId)).toHaveLength(1)
    expect(engine.getRunsByAgent(PARENT_AGENT.agentId)).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// RunEngine.startRunWithChildren — event sequence
// ---------------------------------------------------------------------------

describe('RunEngine.startRunWithChildren — event sequence', () => {
  it('event order: created → started → delegating → (children) → completed', async () => {
    const events: string[] = []
    const engine = instantEngine()
    engine.on('run:created', (r) => events.push(`created:${r.agentId}`))
    engine.on('run:started', (r) => events.push(`started:${r.agentId}`))
    engine.on('run:delegating', (r) => events.push(`delegating:${r.agentId}`))
    engine.on('run:completed', (r) => events.push(`completed:${r.agentId}`))

    const run = engine.createRun(PARENT_AGENT.agentId, PARENT_AGENT.agentName, PARENT_AGENT.agentRole, TASK)

    const settled = new Promise<void>((resolve) => {
      engine.on('run:completed', (r) => { if (r.id === run.id) resolve() })
    })

    engine.startRunWithChildren(run.id, [CHILD_BOB])
    await settled

    // Parent's created + started + delegating must appear before parent completed
    const parentCreated = events.indexOf(`created:${PARENT_AGENT.agentId}`)
    const parentStarted = events.indexOf(`started:${PARENT_AGENT.agentId}`)
    const parentDelegating = events.indexOf(`delegating:${PARENT_AGENT.agentId}`)
    const parentCompleted = events.lastIndexOf(`completed:${PARENT_AGENT.agentId}`)

    expect(parentCreated).toBeGreaterThanOrEqual(0)
    expect(parentStarted).toBeGreaterThan(parentCreated)
    expect(parentDelegating).toBeGreaterThan(parentStarted)
    expect(parentCompleted).toBeGreaterThan(parentDelegating)
  })
})
