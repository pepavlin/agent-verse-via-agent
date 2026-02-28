import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RunEngine } from '../app/run-engine/engine'
import type { ChildAgentDef } from '../app/run-engine/engine'
import type { AgentConfigSnapshot } from '../app/run-engine/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AGENT_ID = 'agent-alice'
const AGENT_NAME = 'Alice'
const AGENT_ROLE = 'Explorer'
const TASK = 'Map the northern sector'

const SNAPSHOT: AgentConfigSnapshot = {
  id: AGENT_ID,
  name: AGENT_NAME,
  role: AGENT_ROLE,
  goal: 'Map all unexplored areas',
  persona: 'Curious and bold',
  configVersion: 1,
}

function instantEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
}

function questionEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
}

// ---------------------------------------------------------------------------
// createRun — configSnapshot storage
// ---------------------------------------------------------------------------

describe('RunEngine.createRun — configSnapshot', () => {
  it('stores the provided configSnapshot on the run', () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, undefined, SNAPSHOT)

    expect(run.configSnapshot).toBeDefined()
    expect(run.configSnapshot!.name).toBe(AGENT_NAME)
    expect(run.configSnapshot!.role).toBe(AGENT_ROLE)
    expect(run.configSnapshot!.goal).toBe('Map all unexplored areas')
    expect(run.configSnapshot!.persona).toBe('Curious and bold')
    expect(run.configSnapshot!.configVersion).toBe(1)
  })

  it('run has no configSnapshot when none is provided', () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    expect(run.configSnapshot).toBeUndefined()
  })

  it('stores a snapshot with only required fields (no optional fields)', () => {
    const engine = new RunEngine()
    const minimalSnapshot: AgentConfigSnapshot = {
      id: AGENT_ID,
      name: AGENT_NAME,
      role: AGENT_ROLE,
      configVersion: 1,
    }
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, undefined, minimalSnapshot)

    expect(run.configSnapshot!.id).toBe(AGENT_ID)
    expect(run.configSnapshot!.goal).toBeUndefined()
    expect(run.configSnapshot!.persona).toBeUndefined()
  })

  it('snapshot is distinct from original object (not same reference)', () => {
    const engine = new RunEngine()
    const snapshot = { ...SNAPSHOT }
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, undefined, snapshot)

    // Mutate original after creation
    snapshot.name = 'MUTATED'

    // Run snapshot should still hold original value
    expect(run.configSnapshot!.name).toBe(AGENT_NAME)
  })
})

// ---------------------------------------------------------------------------
// dispatch — configSnapshot forwarded
// ---------------------------------------------------------------------------

describe('RunEngine.dispatch — configSnapshot', () => {
  it('stores configSnapshot passed to dispatch on the resulting run', () => {
    const engine = new RunEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, undefined, SNAPSHOT)

    expect(run.configSnapshot).toBeDefined()
    expect(run.configSnapshot!.configVersion).toBe(1)
  })

  it('dispatch without snapshot produces run with no configSnapshot', () => {
    const engine = new RunEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    expect(run.configSnapshot).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// configSnapshot preserved through state transitions
// ---------------------------------------------------------------------------

describe('configSnapshot — preserved through run lifecycle', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('snapshot is preserved when run transitions to completed', async () => {
    const engine = instantEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, undefined, SNAPSHOT)
    engine.startRun(run.id)
    vi.runAllTimers()
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))

    expect(engine.getRun(run.id)!.configSnapshot).toBeDefined()
    expect(engine.getRun(run.id)!.configSnapshot!.configVersion).toBe(1)
  })

  it('snapshot is preserved when run transitions to awaiting', async () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, undefined, SNAPSHOT)
    engine.startRun(run.id)
    vi.runAllTimers()
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))

    expect(engine.getRun(run.id)!.configSnapshot).toBeDefined()
    expect(engine.getRun(run.id)!.configSnapshot!.name).toBe(AGENT_NAME)
  })

  it('snapshot is preserved when run is resumed after awaiting', async () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, undefined, SNAPSHOT)
    engine.startRun(run.id)
    vi.runAllTimers()
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))

    engine.resumeRun(run.id, 'user answer', vi.fn().mockResolvedValue('done'))
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))

    expect(engine.getRun(run.id)!.configSnapshot).toBeDefined()
    expect(engine.getRun(run.id)!.configSnapshot!.configVersion).toBe(1)
    expect(engine.getRun(run.id)!.configSnapshot!.name).toBe(AGENT_NAME)
  })

  it('snapshot is preserved when run transitions to failed', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, undefined, SNAPSHOT)
    engine.startRun(run.id, vi.fn().mockRejectedValue(new Error('fail')))
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('failed'))

    expect(engine.getRun(run.id)!.configSnapshot).toBeDefined()
    expect(engine.getRun(run.id)!.configSnapshot!.configVersion).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Child runs — config snapshots via startRunWithChildren
// ---------------------------------------------------------------------------

describe('startRunWithChildren — child configSnapshot', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const PARENT_ID = 'agent-alice'
  const CHILD_BOB_ID = 'agent-bob'
  const CHILD_CAROL_ID = 'agent-carol'

  const BOB_SNAPSHOT: AgentConfigSnapshot = {
    id: CHILD_BOB_ID,
    name: 'Bob',
    role: 'Builder',
    goal: 'Build structures',
    persona: 'Methodical',
    configVersion: 2,
  }

  const CAROL_SNAPSHOT: AgentConfigSnapshot = {
    id: CHILD_CAROL_ID,
    name: 'Carol',
    role: 'Scout',
    configVersion: 3,
  }

  const childDefs: ChildAgentDef[] = [
    { agentId: CHILD_BOB_ID, agentName: 'Bob', agentRole: 'Builder', configSnapshot: BOB_SNAPSHOT },
    { agentId: CHILD_CAROL_ID, agentName: 'Carol', agentRole: 'Scout', configSnapshot: CAROL_SNAPSHOT },
  ]

  it('child runs receive the configSnapshot from their ChildAgentDef', async () => {
    const engine = instantEngine()
    const parentRun = engine.createRun(PARENT_ID, 'Alice', 'Explorer', TASK, undefined, SNAPSHOT)
    engine.startRunWithChildren(parentRun.id, childDefs)
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(parentRun.id)!.status).toBe('completed'))

    // Find child runs
    const allRuns = engine.getAllRuns()
    const bobRun = allRuns.find((r) => r.agentId === CHILD_BOB_ID && r.parentRunId === parentRun.id)
    const carolRun = allRuns.find((r) => r.agentId === CHILD_CAROL_ID && r.parentRunId === parentRun.id)

    expect(bobRun).toBeDefined()
    expect(bobRun!.configSnapshot).toBeDefined()
    expect(bobRun!.configSnapshot!.configVersion).toBe(2)
    expect(bobRun!.configSnapshot!.persona).toBe('Methodical')

    expect(carolRun).toBeDefined()
    expect(carolRun!.configSnapshot).toBeDefined()
    expect(carolRun!.configSnapshot!.configVersion).toBe(3)
    expect(carolRun!.configSnapshot!.goal).toBeUndefined()
  })

  it('child runs without configSnapshot in ChildAgentDef have no configSnapshot', async () => {
    const engine = instantEngine()
    const defsWithoutSnapshot: ChildAgentDef[] = [
      { agentId: CHILD_BOB_ID, agentName: 'Bob', agentRole: 'Builder' },
    ]
    const parentRun = engine.createRun(PARENT_ID, 'Alice', 'Explorer', TASK)
    engine.startRunWithChildren(parentRun.id, defsWithoutSnapshot)
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(parentRun.id)!.status).toBe('completed'))

    const allRuns = engine.getAllRuns()
    const bobRun = allRuns.find((r) => r.agentId === CHILD_BOB_ID && r.parentRunId === parentRun.id)

    expect(bobRun).toBeDefined()
    expect(bobRun!.configSnapshot).toBeUndefined()
  })

  it('parent run snapshot is independent from child run snapshots', async () => {
    const engine = instantEngine()
    const parentRun = engine.createRun(PARENT_ID, 'Alice', 'Explorer', TASK, undefined, SNAPSHOT)
    engine.startRunWithChildren(parentRun.id, childDefs)
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(parentRun.id)!.status).toBe('completed'))

    // Parent snapshot should remain unchanged
    expect(engine.getRun(parentRun.id)!.configSnapshot!.configVersion).toBe(1)
    expect(engine.getRun(parentRun.id)!.configSnapshot!.name).toBe('Alice')
  })
})

// ---------------------------------------------------------------------------
// configVersion — increment semantics (unit test of the concept, not engine)
// ---------------------------------------------------------------------------

describe('AgentConfigSnapshot — configVersion semantics', () => {
  it('two snapshots with different configVersions represent different config states', () => {
    const v1: AgentConfigSnapshot = { id: 'agent-alice', name: 'Alice', role: 'Explorer', configVersion: 1 }
    const v2: AgentConfigSnapshot = { id: 'agent-alice', name: 'Alexandra', role: 'Explorer', configVersion: 2 }

    expect(v1.configVersion).toBeLessThan(v2.configVersion)
    expect(v1.name).not.toBe(v2.name)
  })

  it('two runs created at different configVersions carry distinct version numbers', () => {
    const engine = new RunEngine()
    const snapshot_v1: AgentConfigSnapshot = { id: AGENT_ID, name: 'Alice', role: 'Explorer', configVersion: 1 }
    const snapshot_v2: AgentConfigSnapshot = { id: AGENT_ID, name: 'Alexandra', role: 'Explorer', configVersion: 2 }

    const run1 = engine.createRun(AGENT_ID, 'Alice', 'Explorer', 'Task 1', undefined, snapshot_v1)
    const run2 = engine.createRun(AGENT_ID, 'Alexandra', 'Explorer', 'Task 2', undefined, snapshot_v2)

    expect(run1.configSnapshot!.configVersion).toBe(1)
    expect(run2.configSnapshot!.configVersion).toBe(2)
    expect(run1.configSnapshot!.name).toBe('Alice')
    expect(run2.configSnapshot!.name).toBe('Alexandra')
  })
})
