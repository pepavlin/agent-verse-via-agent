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

/** Engine where mock always produces a question (awaiting), delay = 0. */
function questionEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
}

/** Engine where mock always produces a result (completed), delay = 0. */
function resultEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
}

/**
 * Creates an engine, creates+starts a run via mock question path, and
 * advances timers so the run ends up in 'awaiting' state.
 * Returns { engine, run }.
 */
async function awaitingRun() {
  const engine = questionEngine()
  const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
  engine.startRun(run.id) // mock path → will emit run:awaiting after delay 0
  vi.runAllTimers()
  // Wait for async microtasks if any
  await vi.waitFor(() => {
    expect(engine.getRun(run.id)!.status).toBe('awaiting')
  })
  return { engine, run }
}

// ---------------------------------------------------------------------------
// resumeRun — validation
// ---------------------------------------------------------------------------

describe('RunEngine.resumeRun — validation', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('throws when run does not exist', () => {
    const engine = new RunEngine()
    expect(() => engine.resumeRun('non-existent', 'answer')).toThrowError('not found')
  })

  it('throws when run is in pending state', () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(() => engine.resumeRun(run.id, 'answer')).toThrowError("expected status 'awaiting'")
  })

  it('throws when run is in running state', () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id) // stays running (timer pending)
    expect(() => engine.resumeRun(run.id, 'answer')).toThrowError("expected status 'awaiting'")
  })

  it('throws when run is already completed', async () => {
    const engine = resultEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(() => engine.resumeRun(run.id, 'answer')).toThrowError("expected status 'awaiting'")
  })

  it('throws when run is failed', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, vi.fn().mockRejectedValue(new Error('fail')))
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('failed'))
    expect(() => engine.resumeRun(run.id, 'answer')).toThrowError("expected status 'awaiting'")
  })
})

// ---------------------------------------------------------------------------
// resumeRun — state transitions (mock path)
// ---------------------------------------------------------------------------

describe('RunEngine.resumeRun — mock path (no executor)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('transitions awaiting run back to running immediately', async () => {
    const { engine, run } = await awaitingRun()
    engine.resumeRun(run.id, 'my answer')
    expect(engine.getRun(run.id)!.status).toBe('running')
  })

  it('stores the user answer on the run', async () => {
    const { engine, run } = await awaitingRun()
    engine.resumeRun(run.id, 'user answer text')
    expect(engine.getRun(run.id)!.answer).toBe('user answer text')
  })

  it('clears completedAt when transitioning back to running', async () => {
    const { engine, run } = await awaitingRun()
    expect(engine.getRun(run.id)!.completedAt).toBeDefined() // set by awaiting transition
    engine.resumeRun(run.id, 'answer')
    expect(engine.getRun(run.id)!.completedAt).toBeUndefined()
  })

  it('emits run:resumed event immediately', async () => {
    const { engine, run } = await awaitingRun()
    const handler = vi.fn<[Run], void>()
    engine.on('run:resumed', handler)
    engine.resumeRun(run.id, 'answer')
    expect(handler).toHaveBeenCalledOnce()
    const emitted = handler.mock.calls[0][0]
    expect(emitted.status).toBe('running')
    expect(emitted.answer).toBe('answer')
    expect(emitted.id).toBe(run.id)
  })

  it('run completes after the configured delay in mock path', async () => {
    const engine = new RunEngine({ delayFn: (min) => min, mockQuestionProbability: 1, minDelayMs: 100 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))

    engine.resumeRun(run.id, 'my answer')
    expect(engine.getRun(run.id)!.status).toBe('running')

    vi.advanceTimersByTime(100)
    expect(engine.getRun(run.id)!.status).toBe('completed')
  })

  it('mock resume always produces "completed" (never another question)', async () => {
    // Even though the engine has mockQuestionProbability: 1, resume mock always completes.
    // Subscribe to run:awaiting AFTER the run is already in awaiting state, so this
    // handler should fire 0 times (no new awaiting event during or after resume).
    const { engine, run } = await awaitingRun()
    const awaitingHandler = vi.fn()
    engine.on('run:awaiting', awaitingHandler)

    engine.resumeRun(run.id, 'answer')
    vi.runAllTimers()
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    // No new awaiting event should fire after we subscribed (post-resume path always completes)
    expect(awaitingHandler).not.toHaveBeenCalled()
  })

  it('sets a non-empty result after mock resume', async () => {
    const { engine, run } = await awaitingRun()
    engine.resumeRun(run.id, 'answer')
    vi.runAllTimers()
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    const completed = engine.getRun(run.id)!
    expect(completed.result).toBeDefined()
    expect(completed.result!.length).toBeGreaterThan(0)
  })

  it('emits run:completed after mock resume', async () => {
    const { engine, run } = await awaitingRun()
    const handler = vi.fn<[Run], void>()
    engine.on('run:completed', handler)

    engine.resumeRun(run.id, 'answer')
    vi.runAllTimers()

    await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce())
    const emitted = handler.mock.calls[0][0]
    expect(emitted.status).toBe('completed')
    expect(emitted.answer).toBe('answer')
  })

  it('sets completedAt after mock resume completes', async () => {
    const { engine, run } = await awaitingRun()
    engine.resumeRun(run.id, 'answer')
    vi.runAllTimers()
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(engine.getRun(run.id)!.completedAt).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// resumeRun — executor path
// ---------------------------------------------------------------------------

describe('RunEngine.resumeRun — executor path', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('calls the executor and completes with its result', async () => {
    const { engine, run } = await awaitingRun()
    const executor = vi.fn().mockResolvedValue('resume result')
    engine.resumeRun(run.id, 'user answer', executor)

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(engine.getRun(run.id)!.result).toBe('resume result')
    expect(executor).toHaveBeenCalledOnce()
  })

  it('stores answer before calling executor', async () => {
    const { engine, run } = await awaitingRun()
    engine.resumeRun(run.id, 'stored answer', vi.fn().mockResolvedValue('result'))
    // After calling resumeRun, status is 'running' and answer is stored
    expect(engine.getRun(run.id)!.answer).toBe('stored answer')
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
  })

  it('fails the run when executor throws', async () => {
    const { engine, run } = await awaitingRun()
    engine.resumeRun(run.id, 'answer', vi.fn().mockRejectedValue(new Error('API error')))

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('failed'))
    expect(engine.getRun(run.id)!.error).toBe('API error')
  })

  it('emits run:failed when executor throws', async () => {
    const { engine, run } = await awaitingRun()
    const failedHandler = vi.fn()
    engine.on('run:failed', failedHandler)

    engine.resumeRun(run.id, 'answer', vi.fn().mockRejectedValue(new Error('fail')))
    await vi.waitFor(() => expect(failedHandler).toHaveBeenCalledOnce())
  })

  it('treats MockLLMResponse question as result on resume (prevents infinite loops)', async () => {
    const { engine, run } = await awaitingRun()
    // Executor returns a "question" MockLLMResponse — should still complete the run
    const executor = vi.fn().mockResolvedValue({ kind: 'question', text: 'Another question?' })
    engine.resumeRun(run.id, 'answer', executor)

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(engine.getRun(run.id)!.result).toBe('Another question?')
  })

  it('emits run:resumed before run:completed (order)', async () => {
    const events: RunEventType[] = []
    const { engine, run } = await awaitingRun()

    engine.on('run:resumed', () => events.push('run:resumed'))
    engine.on('run:completed', () => events.push('run:completed'))

    engine.resumeRun(run.id, 'answer', vi.fn().mockResolvedValue('result'))
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))

    expect(events).toEqual(['run:resumed', 'run:completed'])
  })

  it('full lifecycle emits created → started → awaiting → resumed → completed', async () => {
    const events: RunEventType[] = []
    const engine = questionEngine()

    engine.on('run:created', () => events.push('run:created'))
    engine.on('run:started', () => events.push('run:started'))
    engine.on('run:awaiting', () => events.push('run:awaiting'))
    engine.on('run:resumed', () => events.push('run:resumed'))
    engine.on('run:completed', () => events.push('run:completed'))

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))

    engine.resumeRun(run.id, 'my answer', vi.fn().mockResolvedValue('done'))
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))

    expect(events).toEqual([
      'run:created',
      'run:started',
      'run:awaiting',
      'run:resumed',
      'run:completed',
    ])
  })
})

// ---------------------------------------------------------------------------
// resumeRun — preserves run fields
// ---------------------------------------------------------------------------

describe('RunEngine.resumeRun — preserves original run fields', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('preserves agentId', async () => {
    const { engine, run } = await awaitingRun()
    engine.resumeRun(run.id, 'answer', vi.fn().mockResolvedValue('done'))
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(engine.getRun(run.id)!.agentId).toBe(AGENT_ID)
  })

  it('preserves taskDescription', async () => {
    const { engine, run } = await awaitingRun()
    engine.resumeRun(run.id, 'answer', vi.fn().mockResolvedValue('done'))
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(engine.getRun(run.id)!.taskDescription).toBe(TASK)
  })

  it('preserves question from the awaiting state', async () => {
    const { engine, run } = await awaitingRun()
    const question = engine.getRun(run.id)!.question
    engine.resumeRun(run.id, 'answer', vi.fn().mockResolvedValue('done'))
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(engine.getRun(run.id)!.question).toBe(question)
  })

  it('preserves createdAt', async () => {
    const { engine, run } = await awaitingRun()
    const createdAt = engine.getRun(run.id)!.createdAt
    engine.resumeRun(run.id, 'answer', vi.fn().mockResolvedValue('done'))
    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(engine.getRun(run.id)!.createdAt).toBe(createdAt)
  })
})
