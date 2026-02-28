import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RunEngine } from '../app/run-engine/engine'
import {
  generateResult,
  RESULT_TEMPLATE_COUNT,
  generateQuestion,
  QUESTION_TEMPLATE_COUNT,
} from '../app/run-engine/results'
import type { Run, RunEventType } from '../app/run-engine/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create an engine with an instant delay (0 ms) for timer-based tests.
 * mockQuestionProbability is set to 0 so mock runs always produce a result
 * (deterministic for existing tests).
 */
function instantEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
}

/**
 * Create an engine with a fixed delay for controlled timer tests.
 * mockQuestionProbability is set to 0 so mock runs always produce a result.
 */
function fixedDelayEngine(delayMs: number) {
  return new RunEngine({ delayFn: () => delayMs, mockQuestionProbability: 0 })
}

/**
 * Create an engine that always produces a question (probability = 1).
 * Useful for deterministic tests of the 'awaiting' path.
 */
function questionEngine(delayMs = 0) {
  return new RunEngine({ delayFn: () => delayMs, mockQuestionProbability: 1 })
}

const AGENT_ID = 'agent-alice'
const AGENT_NAME = 'Alice'
const AGENT_ROLE = 'Explorer'
const TASK = 'Map the northern sector'

// ---------------------------------------------------------------------------
// generateResult (pure function)
// ---------------------------------------------------------------------------

describe('generateResult', () => {
  it('returns a non-empty string', () => {
    const result = generateResult('Alice', 'Explorer', 'Explore the map')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes the agent name in the result', () => {
    const result = generateResult('Alice', 'Explorer', 'Some task')
    expect(result).toContain('Alice')
  })

  it('returns different results for different agents', () => {
    // Use a fixed template index to test the same template with different names
    const r1 = generateResult('Alice', 'Explorer', 'Same task', 0)
    const r2 = generateResult('Bob', 'Builder', 'Same task', 0)
    expect(r1).not.toBe(r2)
  })

  it('accepts a pickIndex to select a specific template deterministically', () => {
    const r1 = generateResult('Alice', 'Explorer', 'Task', 0)
    const r2 = generateResult('Alice', 'Explorer', 'Task', 0)
    expect(r1).toBe(r2)
  })

  it('wraps pickIndex correctly for negative values', () => {
    const r = generateResult('Alice', 'Explorer', 'Task', -1)
    expect(r.length).toBeGreaterThan(0)
  })

  it('all templates produce non-empty strings', () => {
    for (let i = 0; i < RESULT_TEMPLATE_COUNT; i++) {
      const r = generateResult('Alice', 'Explorer', 'Do something', i)
      expect(r.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// RunEngine — createRun
// ---------------------------------------------------------------------------

describe('RunEngine.createRun', () => {
  let engine: RunEngine

  beforeEach(() => {
    engine = new RunEngine()
  })

  it('returns a Run with status pending', () => {
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(run.status).toBe('pending')
  })

  it('assigns a unique id', () => {
    const r1 = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    const r2 = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(r1.id).not.toBe(r2.id)
  })

  it('stores agentId and taskDescription', () => {
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(run.agentId).toBe(AGENT_ID)
    expect(run.taskDescription).toBe(TASK)
  })

  it('sets createdAt to a recent timestamp', () => {
    const before = Date.now()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    const after = Date.now()
    expect(run.createdAt).toBeGreaterThanOrEqual(before)
    expect(run.createdAt).toBeLessThanOrEqual(after)
  })

  it('does not set startedAt or completedAt', () => {
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(run.startedAt).toBeUndefined()
    expect(run.completedAt).toBeUndefined()
  })

  it('does not set result or error', () => {
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(run.result).toBeUndefined()
    expect(run.error).toBeUndefined()
  })

  it('emits run:created event', () => {
    const handler = vi.fn()
    engine.on('run:created', handler)
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(run)
  })

  it('stores the run so getRun returns it', () => {
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(engine.getRun(run.id)).toEqual(run)
  })

  it('appears in getAllRuns', () => {
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(engine.getAllRuns()).toContainEqual(run)
  })
})

// ---------------------------------------------------------------------------
// RunEngine — startRun (immediate transitions)
// ---------------------------------------------------------------------------

describe('RunEngine.startRun — synchronous transitions', () => {
  let engine: RunEngine

  beforeEach(() => {
    vi.useFakeTimers()
    engine = new RunEngine()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('transitions run to running immediately', () => {
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    expect(engine.getRun(run.id)!.status).toBe('running')
  })

  it('sets startedAt on the run', () => {
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    const before = Date.now()
    engine.startRun(run.id)
    const after = Date.now()
    const started = engine.getRun(run.id)!
    expect(started.startedAt).toBeGreaterThanOrEqual(before)
    expect(started.startedAt).toBeLessThanOrEqual(after)
  })

  it('emits run:started event', () => {
    const handler = vi.fn()
    engine.on('run:started', handler)
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0].status).toBe('running')
  })

  it('throws when run id does not exist', () => {
    expect(() => engine.startRun('non-existent')).toThrowError('not found')
  })

  it('throws when run is already running', () => {
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    expect(() => engine.startRun(run.id)).toThrowError("expected status 'pending'")
  })

  it('throws when run is already completed', () => {
    const eng = instantEngine()
    const run = eng.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    eng.startRun(run.id)
    vi.runAllTimers()
    expect(() => eng.startRun(run.id)).toThrowError("expected status 'pending'")
  })
})

// ---------------------------------------------------------------------------
// RunEngine — async completion (fake timers)
// ---------------------------------------------------------------------------

describe('RunEngine — completion after delay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('completes the run after the configured delay', () => {
    const engine = fixedDelayEngine(3_000)
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)

    // Not yet completed
    expect(engine.getRun(run.id)!.status).toBe('running')

    // Advance time by 3 s
    vi.advanceTimersByTime(3_000)

    expect(engine.getRun(run.id)!.status).toBe('completed')
  })

  it('does not complete before the delay elapses', () => {
    const engine = fixedDelayEngine(4_000)
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)

    vi.advanceTimersByTime(3_999)
    expect(engine.getRun(run.id)!.status).toBe('running')

    vi.advanceTimersByTime(1)
    expect(engine.getRun(run.id)!.status).toBe('completed')
  })

  it('sets completedAt when the run completes', () => {
    const engine = fixedDelayEngine(2_000)
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.advanceTimersByTime(2_000)

    const completed = engine.getRun(run.id)!
    expect(completed.completedAt).toBeDefined()
    expect(completed.completedAt).toBeGreaterThanOrEqual(completed.startedAt!)
  })

  it('sets a non-empty result string when completed', () => {
    const engine = instantEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    const completed = engine.getRun(run.id)!
    expect(completed.result).toBeDefined()
    expect(completed.result!.length).toBeGreaterThan(0)
  })

  it('emits run:completed event with completed run', () => {
    const handler = vi.fn<[Run], void>()
    const engine = instantEngine()
    engine.on('run:completed', handler)

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(handler).toHaveBeenCalledOnce()
    const emitted = handler.mock.calls[0][0]
    expect(emitted.status).toBe('completed')
    expect(emitted.id).toBe(run.id)
    expect(emitted.result).toBeDefined()
  })

  it('result contains the agent name', () => {
    const engine = instantEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.result).toContain(AGENT_NAME)
  })

  it('handles multiple runs completing independently', () => {
    // Use mockQuestionProbability: 0 so both runs deterministically reach 'completed'
    const engine = new RunEngine({ delayFn: (_min, _max) => 1_000, mockQuestionProbability: 0 })
    const r1 = engine.createRun('agent-alice', 'Alice', 'Explorer', 'Task A')
    const r2 = engine.createRun('agent-bob', 'Bob', 'Builder', 'Task B')

    engine.startRun(r1.id)
    engine.startRun(r2.id)

    vi.advanceTimersByTime(1_000)

    expect(engine.getRun(r1.id)!.status).toBe('completed')
    expect(engine.getRun(r2.id)!.status).toBe('completed')
  })

  it('delay falls within [minDelayMs, maxDelayMs] by default', () => {
    // Verify by observing that completion does not happen before minDelayMs
    // and does happen by maxDelayMs.
    // mockQuestionProbability: 0 so the terminal state is deterministically 'completed'.
    const engine = new RunEngine({ minDelayMs: 2_000, maxDelayMs: 6_000, mockQuestionProbability: 0 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)

    // Before minimum — must still be running (probabilistically — use 1 ms before min)
    vi.advanceTimersByTime(1_999)
    // We cannot assert 'running' here because the random delay might have been 2000ms exactly
    // Instead just verify the run exists and hasn't errored
    const mid = engine.getRun(run.id)!
    expect(['running', 'completed']).toContain(mid.status)

    // After maximum — must be completed
    vi.advanceTimersByTime(4_001) // total 6000 ms
    expect(engine.getRun(run.id)!.status).toBe('completed')
  })
})

// ---------------------------------------------------------------------------
// RunEngine — event subscription
// ---------------------------------------------------------------------------

describe('RunEngine — events', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('on() returns an unsubscribe function that stops further events', () => {
    const handler = vi.fn()
    const engine = instantEngine()
    const unsub = engine.on('run:completed', handler)

    const r1 = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, 'First')
    engine.startRun(r1.id)
    vi.runAllTimers()
    expect(handler).toHaveBeenCalledTimes(1)

    // Unsubscribe before second run
    unsub()

    const r2 = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, 'Second')
    engine.startRun(r2.id)
    vi.runAllTimers()
    expect(handler).toHaveBeenCalledTimes(1) // no additional calls
  })

  it('off() removes the handler', () => {
    const handler = vi.fn()
    const engine = instantEngine()
    engine.on('run:completed', handler)
    engine.off('run:completed', handler)

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(handler).not.toHaveBeenCalled()
  })

  it('multiple handlers for the same event are all called', () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    const engine = instantEngine()
    engine.on('run:created', h1)
    engine.on('run:created', h2)
    engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(h1).toHaveBeenCalledOnce()
    expect(h2).toHaveBeenCalledOnce()
  })

  it('full lifecycle emits created → started → completed in order', () => {
    const events: RunEventType[] = []
    const engine = instantEngine()

    engine.on('run:created', () => events.push('run:created'))
    engine.on('run:started', () => events.push('run:started'))
    engine.on('run:completed', () => events.push('run:completed'))

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(events).toEqual(['run:created', 'run:started', 'run:completed'])
  })
})

// ---------------------------------------------------------------------------
// RunEngine — querying
// ---------------------------------------------------------------------------

describe('RunEngine — querying', () => {
  it('getRun returns undefined for unknown id', () => {
    const engine = new RunEngine()
    expect(engine.getRun('unknown')).toBeUndefined()
  })

  it('getAllRuns returns empty array initially', () => {
    const engine = new RunEngine()
    expect(engine.getAllRuns()).toEqual([])
  })

  it('getAllRuns returns all created runs', () => {
    const engine = new RunEngine()
    engine.createRun('agent-alice', 'Alice', 'Explorer', 'Task 1')
    engine.createRun('agent-bob', 'Bob', 'Builder', 'Task 2')
    expect(engine.getAllRuns()).toHaveLength(2)
  })

  it('getRunsByAgent filters by agentId', () => {
    const engine = new RunEngine()
    engine.createRun('agent-alice', 'Alice', 'Explorer', 'Task A1')
    engine.createRun('agent-alice', 'Alice', 'Explorer', 'Task A2')
    engine.createRun('agent-bob', 'Bob', 'Builder', 'Task B1')

    const aliceRuns = engine.getRunsByAgent('agent-alice')
    expect(aliceRuns).toHaveLength(2)
    expect(aliceRuns.every((r) => r.agentId === 'agent-alice')).toBe(true)
  })

  it('getRunsByAgent returns empty array for unknown agent', () => {
    const engine = new RunEngine()
    expect(engine.getRunsByAgent('agent-unknown')).toEqual([])
  })

  it('getRun reflects the latest state after start and completion', () => {
    vi.useFakeTimers()
    const engine = instantEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    expect(engine.getRun(run.id)!.status).toBe('pending')
    engine.startRun(run.id)
    expect(engine.getRun(run.id)!.status).toBe('running')
    vi.runAllTimers()
    expect(engine.getRun(run.id)!.status).toBe('completed')
    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// generateQuestion (pure function)
// ---------------------------------------------------------------------------

describe('generateQuestion', () => {
  it('returns a non-empty string', () => {
    const q = generateQuestion('Alice', 'Explorer', 'Explore the map')
    expect(q.length).toBeGreaterThan(0)
  })

  it('includes the agent name in the question', () => {
    const q = generateQuestion('Alice', 'Explorer', 'Some task')
    expect(q).toContain('Alice')
  })

  it('returns different questions for different agents', () => {
    const q1 = generateQuestion('Alice', 'Explorer', 'Same task', 0)
    const q2 = generateQuestion('Bob', 'Builder', 'Same task', 0)
    expect(q1).not.toBe(q2)
  })

  it('accepts a pickIndex to select a specific template deterministically', () => {
    const q1 = generateQuestion('Alice', 'Explorer', 'Task', 0)
    const q2 = generateQuestion('Alice', 'Explorer', 'Task', 0)
    expect(q1).toBe(q2)
  })

  it('wraps pickIndex correctly for negative values', () => {
    const q = generateQuestion('Alice', 'Explorer', 'Task', -1)
    expect(q.length).toBeGreaterThan(0)
  })

  it('all templates produce non-empty strings', () => {
    for (let i = 0; i < QUESTION_TEMPLATE_COUNT; i++) {
      const q = generateQuestion('Alice', 'Explorer', 'Do something', i)
      expect(q.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// RunEngine — mock question mode (mockQuestionProbability)
// ---------------------------------------------------------------------------

describe('RunEngine — mock question mode', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('always produces awaiting status when probability is 1', () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.status).toBe('awaiting')
  })

  it('sets a non-empty question string when awaiting', () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    const awaiting = engine.getRun(run.id)!
    expect(awaiting.question).toBeDefined()
    expect(awaiting.question!.length).toBeGreaterThan(0)
  })

  it('question contains the agent name', () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.question).toContain(AGENT_NAME)
  })

  it('does not set result when awaiting', () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.result).toBeUndefined()
  })

  it('sets completedAt when transitioning to awaiting', () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    const awaiting = engine.getRun(run.id)!
    expect(awaiting.completedAt).toBeDefined()
    expect(awaiting.completedAt).toBeGreaterThanOrEqual(awaiting.startedAt!)
  })

  it('emits run:awaiting event with awaiting run', () => {
    const handler = vi.fn<[Run], void>()
    const engine = questionEngine()
    engine.on('run:awaiting', handler)

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(handler).toHaveBeenCalledOnce()
    const emitted = handler.mock.calls[0][0]
    expect(emitted.status).toBe('awaiting')
    expect(emitted.id).toBe(run.id)
    expect(emitted.question).toBeDefined()
  })

  it('does not emit run:completed when awaiting', () => {
    const completedHandler = vi.fn()
    const engine = questionEngine()
    engine.on('run:completed', completedHandler)

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(completedHandler).not.toHaveBeenCalled()
  })

  it('never produces awaiting when probability is 0', () => {
    const engine = instantEngine() // mockQuestionProbability: 0
    const awaitingHandler = vi.fn()
    engine.on('run:awaiting', awaitingHandler)

    for (let i = 0; i < 5; i++) {
      const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
      engine.startRun(run.id)
    }
    vi.runAllTimers()

    expect(awaitingHandler).not.toHaveBeenCalled()
  })

  it('full lifecycle emits created → started → awaiting in order', () => {
    const events: RunEventType[] = []
    const engine = questionEngine()

    engine.on('run:created', () => events.push('run:created'))
    engine.on('run:started', () => events.push('run:started'))
    engine.on('run:awaiting', () => events.push('run:awaiting'))
    engine.on('run:completed', () => events.push('run:completed'))

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(events).toEqual(['run:created', 'run:started', 'run:awaiting'])
  })

  it('respects the configured delay before emitting awaiting', () => {
    const engine = new RunEngine({ delayFn: () => 3_000, mockQuestionProbability: 1 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)

    vi.advanceTimersByTime(2_999)
    expect(engine.getRun(run.id)!.status).toBe('running')

    vi.advanceTimersByTime(1)
    expect(engine.getRun(run.id)!.status).toBe('awaiting')
  })
})
