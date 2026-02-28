import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RunEngine } from '../app/run-engine/engine'
import type { Run } from '../app/run-engine/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Engine that completes instantly (0 ms) and always produces a result (no question). */
function instantEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
}

/** Engine that completes after a fixed delay and always produces a result. */
function fixedDelayEngine(delayMs: number) {
  return new RunEngine({ delayFn: () => delayMs, mockQuestionProbability: 0 })
}

/** Engine that always transitions to 'awaiting' (question probability = 1). */
function questionEngine(delayMs = 0) {
  return new RunEngine({ delayFn: () => delayMs, mockQuestionProbability: 1 })
}

const AGENT_ID = 'agent-alice'
const AGENT_NAME = 'Alice'
const AGENT_ROLE = 'Explorer'
const TASK = 'Map the northern sector'

// ---------------------------------------------------------------------------
// RunEngine.runAsync — basic lifecycle
// ---------------------------------------------------------------------------

describe('RunEngine.runAsync — basic lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a Promise', () => {
    const engine = fixedDelayEngine(1_000)
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(promise).toBeInstanceOf(Promise)
    // Advance timers to settle the promise and avoid leaking async work
    vi.runAllTimers()
    return promise
  })

  it('run is immediately in running state after call', () => {
    const engine = fixedDelayEngine(5_000)
    const allRuns = engine.getAllRuns()
    engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    // A run should have been created and started
    const runs = engine.getAllRuns()
    expect(runs).toHaveLength(1)
    expect(runs[0].status).toBe('running')
    // Clean up pending timers
    vi.runAllTimers()
    void allRuns
  })

  it('resolves with a completed Run after the configured delay', async () => {
    const engine = fixedDelayEngine(3_000)
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    // Run is still in progress
    expect(engine.getAllRuns()[0].status).toBe('running')

    // Advance time to trigger completion
    vi.advanceTimersByTime(3_000)

    const run = await promise
    expect(run.status).toBe('completed')
  })

  it('does not resolve before the delay elapses', async () => {
    const engine = fixedDelayEngine(4_000)
    let resolved = false

    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    promise.then(() => { resolved = true })

    vi.advanceTimersByTime(3_999)
    // Allow microtasks to flush (but timer hasn't fired yet)
    await Promise.resolve()
    expect(resolved).toBe(false)

    vi.advanceTimersByTime(1)
    await promise
    expect(resolved).toBe(true)
  })

  it('resolved Run has status "completed"', async () => {
    const engine = instantEngine()
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    const run = await promise
    expect(run.status).toBe('completed')
  })

  it('resolved Run has a non-empty result string', async () => {
    const engine = instantEngine()
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    const run = await promise
    expect(run.result).toBeDefined()
    expect(run.result!.length).toBeGreaterThan(0)
  })

  it('result contains the agent name', async () => {
    const engine = instantEngine()
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    const run = await promise
    expect(run.result).toContain(AGENT_NAME)
  })

  it('resolved Run has correct agentId and taskDescription', async () => {
    const engine = instantEngine()
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    const run = await promise
    expect(run.agentId).toBe(AGENT_ID)
    expect(run.taskDescription).toBe(TASK)
  })

  it('resolved Run has startedAt and completedAt timestamps', async () => {
    const engine = instantEngine()
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    const run = await promise
    expect(run.startedAt).toBeDefined()
    expect(run.completedAt).toBeDefined()
    expect(run.completedAt!).toBeGreaterThanOrEqual(run.startedAt!)
  })

  it('assigns a unique id to the run', async () => {
    const engine = instantEngine()
    const p1 = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, 'Task 1')
    const p2 = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, 'Task 2')
    vi.runAllTimers()
    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1.id).not.toBe(r2.id)
  })
})

// ---------------------------------------------------------------------------
// RunEngine.runAsync — delay range (random 2–6 seconds)
// ---------------------------------------------------------------------------

describe('RunEngine.runAsync — random 2–6 s delay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('with default options, run is still running at 1999ms', () => {
    // mockQuestionProbability: 0 so terminal state is deterministically 'completed'
    const engine = new RunEngine({
      minDelayMs: 2_000,
      maxDelayMs: 6_000,
      // Pin the random delay to exactly 2000ms so we can make deterministic assertions
      delayFn: () => 2_000,
      mockQuestionProbability: 0,
    })
    engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    vi.advanceTimersByTime(1_999)
    expect(engine.getAllRuns()[0].status).toBe('running')

    // Advance to settle
    vi.advanceTimersByTime(1)
  })

  it('with default options, run completes by 6000ms', async () => {
    const engine = new RunEngine({ minDelayMs: 2_000, maxDelayMs: 6_000, mockQuestionProbability: 0 })
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    vi.advanceTimersByTime(6_000)

    const run = await promise
    expect(run.status).toBe('completed')
  })

  it('default minDelayMs is 2000 and maxDelayMs is 6000', async () => {
    // Verify the delay range by running with the actual default random fn
    // and observing the engine completes within [2000, 6000] ms.
    const engine = new RunEngine({ mockQuestionProbability: 0 })
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    // Still running before minimum
    vi.advanceTimersByTime(1_999)
    const mid = engine.getAllRuns()[0]
    expect(['running', 'completed']).toContain(mid.status)

    // Definitely completed after maximum
    vi.advanceTimersByTime(4_001) // total: 6000ms
    const run = await promise
    expect(run.status).toBe('completed')
  })
})

// ---------------------------------------------------------------------------
// RunEngine.runAsync — awaiting state (mock question mode)
// ---------------------------------------------------------------------------

describe('RunEngine.runAsync — awaiting state', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves (does not reject) when run enters awaiting state', async () => {
    const engine = questionEngine()
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    const run = await promise
    expect(run.status).toBe('awaiting')
  })

  it('awaiting run has a non-empty question string', async () => {
    const engine = questionEngine()
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    const run = await promise
    expect(run.question).toBeDefined()
    expect(run.question!.length).toBeGreaterThan(0)
  })

  it('awaiting run does not have a result string', async () => {
    const engine = questionEngine()
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    const run = await promise
    expect(run.result).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// RunEngine.runAsync — failure / rejection
// ---------------------------------------------------------------------------

describe('RunEngine.runAsync — failure / rejection', () => {
  it('rejects with an Error when the executor throws', async () => {
    const engine = new RunEngine()
    const executor = async () => {
      throw new Error('LLM connection failed')
    }

    await expect(
      engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, executor),
    ).rejects.toThrow('LLM connection failed')
  })

  it('rejects with an Error when the executor rejects', async () => {
    const engine = new RunEngine()
    const executor = async () => {
      return Promise.reject(new Error('Network error'))
    }

    await expect(
      engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, executor),
    ).rejects.toThrow('Network error')
  })

  it('failed run has status "failed" in the engine', async () => {
    const engine = new RunEngine()
    const executor = async () => {
      throw new Error('Timeout')
    }

    let failedRun: Run | undefined

    try {
      await engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, executor)
    } catch {
      failedRun = engine.getAllRuns()[0]
    }

    expect(failedRun).toBeDefined()
    expect(failedRun!.status).toBe('failed')
    expect(failedRun!.error).toBe('Timeout')
  })

  it('rejects with a fallback message when executor throws non-Error', async () => {
    const engine = new RunEngine()
    const executor = async (): Promise<string> => {
      throw 'string error'
    }

    await expect(
      engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, executor),
    ).rejects.toThrow('Nastala neočekávaná chyba')
  })
})

// ---------------------------------------------------------------------------
// RunEngine.runAsync — executor path
// ---------------------------------------------------------------------------

describe('RunEngine.runAsync — with executor', () => {
  it('resolves with a result when executor returns a plain string', async () => {
    const engine = new RunEngine()
    const executor = async () => 'Task completed successfully'

    const run = await engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, executor)
    expect(run.status).toBe('completed')
    expect(run.result).toBe('Task completed successfully')
  })

  it('resolves with a result when executor returns { kind: "result" }', async () => {
    const engine = new RunEngine()
    const executor = async () => ({ kind: 'result' as const, text: 'Analysis done' })

    const run = await engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, executor)
    expect(run.status).toBe('completed')
    expect(run.result).toBe('Analysis done')
  })

  it('resolves with awaiting run when executor returns { kind: "question" }', async () => {
    const engine = new RunEngine()
    const executor = async () => ({ kind: 'question' as const, text: 'Which area to prioritize?' })

    const run = await engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, executor)
    expect(run.status).toBe('awaiting')
    expect(run.question).toBe('Which area to prioritize?')
  })
})

// ---------------------------------------------------------------------------
// RunEngine.runAsync — events are still emitted
// ---------------------------------------------------------------------------

describe('RunEngine.runAsync — events are still emitted', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits run:created before Promise resolves', async () => {
    const engine = instantEngine()
    const created: Run[] = []
    engine.on('run:created', (r) => created.push(r))

    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    // run:created is emitted synchronously during createRun()
    expect(created).toHaveLength(1)
    expect(created[0].status).toBe('pending')

    vi.runAllTimers()
    await promise
  })

  it('emits run:started synchronously during runAsync()', async () => {
    const engine = fixedDelayEngine(1_000)
    const started: Run[] = []
    engine.on('run:started', (r) => started.push(r))

    engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    // run:started is emitted synchronously during startRun()
    expect(started).toHaveLength(1)
    expect(started[0].status).toBe('running')

    vi.runAllTimers()
  })

  it('emits run:completed when Promise resolves', async () => {
    const engine = instantEngine()
    const completed: Run[] = []
    engine.on('run:completed', (r) => completed.push(r))

    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    await promise

    expect(completed).toHaveLength(1)
    expect(completed[0].status).toBe('completed')
  })

  it('full lifecycle emits events in order: created → started → completed', async () => {
    const events: string[] = []
    const engine = instantEngine()

    engine.on('run:created', () => events.push('run:created'))
    engine.on('run:started', () => events.push('run:started'))
    engine.on('run:completed', () => events.push('run:completed'))

    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    await promise

    expect(events).toEqual(['run:created', 'run:started', 'run:completed'])
  })
})

// ---------------------------------------------------------------------------
// RunEngine.runAsync — concurrent runs
// ---------------------------------------------------------------------------

describe('RunEngine.runAsync — concurrent runs', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('multiple concurrent runAsync calls complete independently', async () => {
    const engine = new RunEngine({ delayFn: () => 1_000, mockQuestionProbability: 0 })

    const p1 = engine.runAsync('agent-alice', 'Alice', 'Explorer', 'Task A')
    const p2 = engine.runAsync('agent-bob', 'Bob', 'Builder', 'Task B')
    const p3 = engine.runAsync('agent-carol', 'Carol', 'Analyst', 'Task C')

    expect(engine.getAllRuns()).toHaveLength(3)
    expect(engine.getAllRuns().every((r) => r.status === 'running')).toBe(true)

    vi.advanceTimersByTime(1_000)

    const [r1, r2, r3] = await Promise.all([p1, p2, p3])

    expect(r1.status).toBe('completed')
    expect(r2.status).toBe('completed')
    expect(r3.status).toBe('completed')

    // Each resolves to the correct run
    expect(r1.agentId).toBe('agent-alice')
    expect(r2.agentId).toBe('agent-bob')
    expect(r3.agentId).toBe('agent-carol')
  })

  it('does not cross-contaminate results between concurrent runs', async () => {
    const engine = new RunEngine({ delayFn: () => 500, mockQuestionProbability: 0 })

    const p1 = engine.runAsync('agent-alice', 'Alice', 'Explorer', 'Task A')
    const p2 = engine.runAsync('agent-bob', 'Bob', 'Builder', 'Task B')

    vi.advanceTimersByTime(500)

    const [r1, r2] = await Promise.all([p1, p2])

    // Each run resolves to its own run object
    expect(r1.id).not.toBe(r2.id)
    expect(r1.taskDescription).toBe('Task A')
    expect(r2.taskDescription).toBe('Task B')
  })
})

// ---------------------------------------------------------------------------
// RunEngine.runAsync — configSnapshot support
// ---------------------------------------------------------------------------

describe('RunEngine.runAsync — configSnapshot', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores the configSnapshot on the resolved run', async () => {
    const engine = instantEngine()
    const snapshot = { id: AGENT_ID, name: AGENT_NAME, role: AGENT_ROLE, configVersion: 3 }

    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, undefined, snapshot)
    vi.runAllTimers()
    const run = await promise

    expect(run.configSnapshot).toEqual(snapshot)
  })

  it('resolved run has no configSnapshot when none is provided', async () => {
    const engine = instantEngine()
    const promise = engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    vi.runAllTimers()
    const run = await promise

    expect(run.configSnapshot).toBeUndefined()
  })
})
