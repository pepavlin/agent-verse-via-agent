import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RunEngine } from '../app/run-engine/engine'
import type { Run, RunEventType } from '../app/run-engine/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AGENT_ID = 'agent-alice'
const AGENT_NAME = 'Alice'
const AGENT_ROLE = 'Explorer'
const TASK = 'Map the northern sector'

/** Engine with instant delay (0 ms) and no question path — deterministic results. */
function instantEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
}

/** Engine with a fixed delay and no question path. */
function fixedDelayEngine(delayMs: number) {
  return new RunEngine({ delayFn: () => delayMs, mockQuestionProbability: 0 })
}

/** Engine that always emits a question (awaiting) instead of completing. */
function questionEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
}

// ---------------------------------------------------------------------------
// RunEngine.dispatch — return value & immediate state
// ---------------------------------------------------------------------------

describe('RunEngine.dispatch — return value and immediate state', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a Run with status running immediately', () => {
    const engine = new RunEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(run.status).toBe('running')
  })

  it('returned run has the correct agentId', () => {
    const engine = new RunEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(run.agentId).toBe(AGENT_ID)
  })

  it('returned run has the correct taskDescription', () => {
    const engine = new RunEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(run.taskDescription).toBe(TASK)
  })

  it('returned run has startedAt set', () => {
    const engine = new RunEngine()
    const before = Date.now()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    const after = Date.now()
    expect(run.startedAt).toBeGreaterThanOrEqual(before)
    expect(run.startedAt).toBeLessThanOrEqual(after)
  })

  it('returned run has a unique id', () => {
    const engine = new RunEngine()
    const r1 = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    const r2 = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(r1.id).not.toBe(r2.id)
  })

  it('run is retrievable via getRun immediately', () => {
    const engine = new RunEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(engine.getRun(run.id)).toEqual(run)
  })

  it('run appears in getAllRuns', () => {
    const engine = new RunEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(engine.getAllRuns()).toContainEqual(run)
  })

  it('run appears in getRunsByAgent', () => {
    const engine = new RunEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    const agentRuns = engine.getRunsByAgent(AGENT_ID)
    expect(agentRuns.some((r) => r.id === run.id)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// RunEngine.dispatch — event sequence
// ---------------------------------------------------------------------------

describe('RunEngine.dispatch — event sequence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits run:created and run:started synchronously before returning', () => {
    const events: RunEventType[] = []
    const engine = new RunEngine()
    engine.on('run:created', () => events.push('run:created'))
    engine.on('run:started', () => events.push('run:started'))

    engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    // Both events fire synchronously inside dispatch()
    expect(events).toEqual(['run:created', 'run:started'])
  })

  it('emits run:completed after the mock delay elapses', () => {
    const completedHandler = vi.fn()
    const engine = instantEngine()
    engine.on('run:completed', completedHandler)

    engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()

    expect(completedHandler).toHaveBeenCalledOnce()
  })

  it('full lifecycle emits created → started → completed in order', () => {
    const events: RunEventType[] = []
    const engine = instantEngine()

    engine.on('run:created', () => events.push('run:created'))
    engine.on('run:started', () => events.push('run:started'))
    engine.on('run:completed', () => events.push('run:completed'))

    engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()

    expect(events).toEqual(['run:created', 'run:started', 'run:completed'])
  })
})

// ---------------------------------------------------------------------------
// RunEngine.dispatch — mock completion (no executor)
// ---------------------------------------------------------------------------

describe('RunEngine.dispatch — mock mode (no executor)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('completes with a result after the default 2–6 s delay range', () => {
    const engine = new RunEngine({ mockQuestionProbability: 0 })
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    // Not completed yet — timer is still pending
    expect(engine.getRun(run.id)!.status).toBe('running')

    // Advance time past the maximum delay (6 000 ms)
    vi.advanceTimersByTime(6_000)

    expect(engine.getRun(run.id)!.status).toBe('completed')
  })

  it('does not complete before the minimum delay', () => {
    const engine = fixedDelayEngine(4_000)
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    vi.advanceTimersByTime(3_999)
    expect(engine.getRun(run.id)!.status).toBe('running')

    vi.advanceTimersByTime(1)
    expect(engine.getRun(run.id)!.status).toBe('completed')
  })

  it('sets a non-empty result string when completed', () => {
    const engine = instantEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()

    const completed = engine.getRun(run.id)!
    expect(completed.result).toBeDefined()
    expect(completed.result!.length).toBeGreaterThan(0)
  })

  it('result contains the agent name', () => {
    const engine = instantEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.result).toContain(AGENT_NAME)
  })

  it('sets completedAt on completion', () => {
    const engine = instantEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()

    const completed = engine.getRun(run.id)!
    expect(completed.completedAt).toBeDefined()
    expect(completed.completedAt).toBeGreaterThanOrEqual(completed.startedAt!)
  })

  it('transitions to awaiting when mockQuestionProbability is 1', () => {
    const engine = questionEngine()
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.status).toBe('awaiting')
  })

  it('handles multiple concurrent dispatches independently', () => {
    const engine = fixedDelayEngine(1_000)
    const r1 = engine.dispatch('agent-alice', 'Alice', 'Explorer', 'Task A')
    const r2 = engine.dispatch('agent-bob', 'Bob', 'Builder', 'Task B')

    expect(engine.getRun(r1.id)!.status).toBe('running')
    expect(engine.getRun(r2.id)!.status).toBe('running')

    vi.advanceTimersByTime(1_000)

    expect(engine.getRun(r1.id)!.status).toBe('completed')
    expect(engine.getRun(r2.id)!.status).toBe('completed')
  })
})

// ---------------------------------------------------------------------------
// RunEngine.dispatch — executor path
// ---------------------------------------------------------------------------

describe('RunEngine.dispatch — executor path', () => {
  it('calls the executor and completes the run with its result', async () => {
    const engine = new RunEngine()
    const executor = vi.fn().mockResolvedValue('executor result')

    const completedHandler = vi.fn()
    engine.on('run:completed', completedHandler)

    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, executor)

    // Immediately running
    expect(run.status).toBe('running')
    expect(executor).toHaveBeenCalledOnce()

    await vi.waitFor(() => {
      expect(engine.getRun(run.id)!.status).toBe('completed')
    })

    expect(engine.getRun(run.id)!.result).toBe('executor result')
    expect(completedHandler).toHaveBeenCalledOnce()
  })

  it('fails the run when executor rejects', async () => {
    const engine = new RunEngine()
    const executor = vi.fn().mockRejectedValue(new Error('API error'))

    const failedHandler = vi.fn()
    engine.on('run:failed', failedHandler)

    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, executor)

    await vi.waitFor(() => {
      expect(engine.getRun(run.id)!.status).toBe('failed')
    })

    expect(engine.getRun(run.id)!.error).toBe('API error')
    expect(failedHandler).toHaveBeenCalledOnce()
  })

  it('transitions to awaiting when executor returns a question response', async () => {
    const engine = new RunEngine()
    const executor = vi
      .fn()
      .mockResolvedValue({ kind: 'question', text: 'What format do you want?' })

    const awaitingHandler = vi.fn()
    engine.on('run:awaiting', awaitingHandler)

    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, executor)

    await vi.waitFor(() => {
      expect(engine.getRun(run.id)!.status).toBe('awaiting')
    })

    expect(engine.getRun(run.id)!.question).toBe('What format do you want?')
    expect(awaitingHandler).toHaveBeenCalledOnce()
  })

  it('the dispatched run can be resumed after awaiting', async () => {
    vi.useFakeTimers()

    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
    const run = engine.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    vi.runAllTimers()
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))

    engine.resumeRun(run.id, 'user answer', vi.fn().mockResolvedValue('final result'))
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))

    expect(engine.getRun(run.id)!.result).toBe('final result')
    expect(engine.getRun(run.id)!.answer).toBe('user answer')

    vi.useRealTimers()
  })

  it('full lifecycle emits created → started → completed with executor', async () => {
    const events: RunEventType[] = []
    const engine = new RunEngine()

    engine.on('run:created', () => events.push('run:created'))
    engine.on('run:started', () => events.push('run:started'))
    engine.on('run:completed', () => events.push('run:completed'))

    const run = engine.dispatch(
      AGENT_ID,
      AGENT_NAME,
      AGENT_ROLE,
      TASK,
      vi.fn().mockResolvedValue('done'),
    )

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))

    expect(events).toEqual(['run:created', 'run:started', 'run:completed'])
  })
})

// ---------------------------------------------------------------------------
// RunEngine.dispatch — compared to manual createRun + startRun
// ---------------------------------------------------------------------------

describe('RunEngine.dispatch — equivalence to createRun + startRun', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('dispatch produces the same observable state as createRun + startRun', () => {
    const engineA = instantEngine()
    const engineB = instantEngine()

    // Via dispatch
    const runA = engineA.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    // Via manual two-step
    const pending = engineB.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engineB.startRun(pending.id)
    const runB = engineB.getRun(pending.id)!

    expect(runA.status).toBe(runB.status)
    expect(runA.agentId).toBe(runB.agentId)
    expect(runA.taskDescription).toBe(runB.taskDescription)
    expect(runA.startedAt).toBeDefined()
    expect(runB.startedAt).toBeDefined()

    // Both complete after the timer fires
    vi.runAllTimers()
    expect(engineA.getRun(runA.id)!.status).toBe('completed')
    expect(engineB.getRun(runB.id)!.status).toBe('completed')
  })

  it('dispatch is a no-extra-events shorthand — total event count matches two-step', () => {
    const eventsDispatch: RunEventType[] = []
    const eventsManual: RunEventType[] = []

    const engineA = instantEngine()
    const engineB = instantEngine()

    for (const evt of ['run:created', 'run:started', 'run:completed'] as RunEventType[]) {
      engineA.on(evt, () => eventsDispatch.push(evt))
      engineB.on(evt, () => eventsManual.push(evt))
    }

    engineA.dispatch(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    const r = engineB.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engineB.startRun(r.id)

    vi.runAllTimers()

    expect(eventsDispatch).toEqual(eventsManual)
  })
})
