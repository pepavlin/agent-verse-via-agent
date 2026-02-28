import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MockLLM } from '../app/run-engine/mock-llm'
import { RunEngine } from '../app/run-engine/engine'
import type { MockLLMResponse } from '../app/run-engine/types'
import type { Run } from '../app/run-engine/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AGENT_NAME = 'Alice'
const AGENT_ROLE = 'Explorer'
const TASK = 'Map the northern sector'
const AGENT_ID = 'agent-alice'

/** MockLLM that always resolves instantly with a result (no question). */
function resultMock() {
  return new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
    questionProbability: 0,
    delayFn: () => 0,
  })
}

/** MockLLM that always resolves instantly with a question. */
function questionMock() {
  return new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
    questionProbability: 1,
    delayFn: () => 0,
  })
}

/** MockLLM with a fixed, non-zero delay and always resolves with a result. */
function delayedResultMock(delayMs: number) {
  return new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
    questionProbability: 0,
    delayFn: () => delayMs,
  })
}

// ---------------------------------------------------------------------------
// MockLLM.run() — standalone behaviour
// ---------------------------------------------------------------------------

describe('MockLLM.run() — result path (questionProbability = 0)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resolves with kind: "result"', async () => {
    const mock = resultMock()
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.kind).toBe('result')
  })

  it('result text is non-empty', async () => {
    const mock = resultMock()
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.text.length).toBeGreaterThan(0)
  })

  it('result text contains the agent name', async () => {
    const mock = resultMock()
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.text).toContain(AGENT_NAME)
  })

  it('never resolves as question when questionProbability is 0', async () => {
    const mock = resultMock()
    for (let i = 0; i < 5; i++) {
      const promise = mock.run()
      vi.runAllTimers()
      const response = await promise
      expect(response.kind).toBe('result')
    }
  })
})

describe('MockLLM.run() — question path (questionProbability = 1)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resolves with kind: "question"', async () => {
    const mock = questionMock()
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.kind).toBe('question')
  })

  it('question text is non-empty', async () => {
    const mock = questionMock()
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.text.length).toBeGreaterThan(0)
  })

  it('question text contains the agent name', async () => {
    const mock = questionMock()
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.text).toContain(AGENT_NAME)
  })

  it('never resolves as result when questionProbability is 1', async () => {
    const mock = questionMock()
    for (let i = 0; i < 5; i++) {
      const promise = mock.run()
      vi.runAllTimers()
      const response = await promise
      expect(response.kind).toBe('question')
    }
  })
})

describe('MockLLM.run() — delay behaviour', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not resolve before the configured delay', async () => {
    const mock = delayedResultMock(3_000)
    let resolved = false
    mock.run().then(() => { resolved = true })

    vi.advanceTimersByTime(2_999)
    // Give microtasks a chance to flush — the promise should still be pending
    await Promise.resolve()
    expect(resolved).toBe(false)
  })

  it('resolves after the configured delay', async () => {
    const mock = delayedResultMock(3_000)
    const promise = mock.run()
    vi.advanceTimersByTime(3_000)
    const response = await promise
    expect(response.kind).toBe('result')
  })

  it('respects a custom delayFn', async () => {
    const delayFn = vi.fn().mockReturnValue(500)
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, { delayFn, questionProbability: 0 })
    const promise = mock.run()
    expect(delayFn).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(500)
    const response = await promise
    expect(response.kind).toBe('result')
  })

  it('passes minDelayMs and maxDelayMs to the delayFn', () => {
    const delayFn = vi.fn().mockReturnValue(0)
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      delayFn,
      minDelayMs: 1_000,
      maxDelayMs: 5_000,
      questionProbability: 0,
    })
    mock.run()
    expect(delayFn).toHaveBeenCalledWith(1_000, 5_000)
  })
})

// ---------------------------------------------------------------------------
// MockLLM.asExecutor() — integration with RunEngine
// ---------------------------------------------------------------------------

describe('MockLLM.asExecutor() — RunEngine integration (result path)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('transitions run to "completed" via asExecutor()', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    const executor = resultMock().asExecutor()

    engine.startRun(run.id, executor)
    expect(engine.getRun(run.id)!.status).toBe('running')

    vi.runAllTimers()
    await vi.waitFor(() => {
      expect(engine.getRun(run.id)!.status).toBe('completed')
    })
  })

  it('stores the result text on the run', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, resultMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))

    const completed = engine.getRun(run.id)!
    expect(completed.result).toBeDefined()
    expect(completed.result!.length).toBeGreaterThan(0)
  })

  it('result text contains the agent name', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, resultMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(engine.getRun(run.id)!.result).toContain(AGENT_NAME)
  })

  it('emits run:completed event', async () => {
    const handler = vi.fn<[Run], void>()
    const engine = new RunEngine()
    engine.on('run:completed', handler)

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, resultMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce())
    const emitted = handler.mock.calls[0][0]
    expect(emitted.status).toBe('completed')
    expect(emitted.result).toBeDefined()
  })

  it('does not emit run:awaiting when result path is taken', async () => {
    const awaitingHandler = vi.fn()
    const engine = new RunEngine()
    engine.on('run:awaiting', awaitingHandler)

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, resultMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(awaitingHandler).not.toHaveBeenCalled()
  })

  it('does not set question field on completed run', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, resultMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(engine.getRun(run.id)!.question).toBeUndefined()
  })
})

describe('MockLLM.asExecutor() — RunEngine integration (question path)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('transitions run to "awaiting" via asExecutor()', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, questionMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => {
      expect(engine.getRun(run.id)!.status).toBe('awaiting')
    })
  })

  it('stores the question text on the run', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, questionMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))

    const awaiting = engine.getRun(run.id)!
    expect(awaiting.question).toBeDefined()
    expect(awaiting.question!.length).toBeGreaterThan(0)
  })

  it('question text contains the agent name', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, questionMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))
    expect(engine.getRun(run.id)!.question).toContain(AGENT_NAME)
  })

  it('emits run:awaiting event', async () => {
    const handler = vi.fn<[Run], void>()
    const engine = new RunEngine()
    engine.on('run:awaiting', handler)

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, questionMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce())
    const emitted = handler.mock.calls[0][0]
    expect(emitted.status).toBe('awaiting')
    expect(emitted.question).toBeDefined()
  })

  it('does not emit run:completed when question path is taken', async () => {
    const completedHandler = vi.fn()
    const engine = new RunEngine()
    engine.on('run:completed', completedHandler)

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, questionMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))
    expect(completedHandler).not.toHaveBeenCalled()
  })

  it('does not set result field on awaiting run', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, questionMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))
    expect(engine.getRun(run.id)!.result).toBeUndefined()
  })

  it('sets completedAt on the awaiting run', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, questionMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))
    const awaiting = engine.getRun(run.id)!
    expect(awaiting.completedAt).toBeDefined()
    expect(awaiting.completedAt).toBeGreaterThanOrEqual(awaiting.startedAt!)
  })

  it('full lifecycle emits created → started → awaiting in order', async () => {
    const events: string[] = []
    const engine = new RunEngine()
    engine.on('run:created', () => events.push('run:created'))
    engine.on('run:started', () => events.push('run:started'))
    engine.on('run:awaiting', () => events.push('run:awaiting'))
    engine.on('run:completed', () => events.push('run:completed'))

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id, questionMock().asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))
    expect(events).toEqual(['run:created', 'run:started', 'run:awaiting'])
  })
})

// ---------------------------------------------------------------------------
// MockLLM — realistic generation with goal and persona
// ---------------------------------------------------------------------------

describe('MockLLM — goal and persona options', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('isRealistic is false by default (no goal or persona)', () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK)
    expect(mock.isRealistic).toBe(false)
  })

  it('isRealistic is true when goal is provided', () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      goal: 'Map all unexplored areas of the grid',
    })
    expect(mock.isRealistic).toBe(true)
  })

  it('isRealistic is true when persona is provided', () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      persona: 'Curious and bold.',
    })
    expect(mock.isRealistic).toBe(true)
  })

  it('isRealistic can be forced to true via useRealisticGeneration', () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      useRealisticGeneration: true,
    })
    expect(mock.isRealistic).toBe(true)
  })

  it('isRealistic can be forced to false even when goal is provided', () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      goal: 'Some goal',
      useRealisticGeneration: false,
    })
    expect(mock.isRealistic).toBe(false)
  })

  it('goal accessor returns the provided goal', () => {
    const goal = 'Map all unexplored areas'
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, { goal })
    expect(mock.goal).toBe(goal)
  })

  it('persona accessor returns the provided persona', () => {
    const persona = 'Curious and bold'
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, { persona })
    expect(mock.persona).toBe(persona)
  })

  it('goal accessor is undefined when not provided', () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK)
    expect(mock.goal).toBeUndefined()
  })

  it('persona accessor is undefined when not provided', () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK)
    expect(mock.persona).toBeUndefined()
  })
})

describe('MockLLM — realistic result generation (with goal)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resolves with kind: "result" when realistic mode is active', async () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      goal: 'Map all unexplored areas',
      questionProbability: 0,
      delayFn: () => 0,
    })
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.kind).toBe('result')
  })

  it('result text contains the agent name in realistic mode', async () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      goal: 'Map all unexplored areas',
      questionProbability: 0,
      delayFn: () => 0,
    })
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.text).toContain(AGENT_NAME)
  })

  it('result text contains the goal when goal is provided', async () => {
    const goal = 'Map all unexplored areas of the grid'
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      goal,
      questionProbability: 0,
      delayFn: () => 0,
    })
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.text).toContain(goal)
  })

  it('result text is non-empty in realistic mode', async () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      goal: 'Map all unexplored areas',
      persona: 'Curious and bold. Always the first to venture.',
      questionProbability: 0,
      delayFn: () => 0,
    })
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.text.length).toBeGreaterThan(0)
  })
})

describe('MockLLM — realistic question generation (with goal)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resolves with kind: "question" in realistic mode', async () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      goal: 'Map all unexplored areas',
      questionProbability: 1,
      delayFn: () => 0,
    })
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.kind).toBe('question')
  })

  it('question text contains the agent name in realistic mode', async () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      goal: 'Map all unexplored areas',
      questionProbability: 1,
      delayFn: () => 0,
    })
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.text).toContain(AGENT_NAME)
  })

  it('question text is non-empty in realistic mode', async () => {
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      persona: 'Curious and bold.',
      questionProbability: 1,
      delayFn: () => 0,
    })
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response.text.length).toBeGreaterThan(0)
  })
})

describe('MockLLM — realistic mode integrates with RunEngine', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('transitions run to "completed" with goal-aware result text', async () => {
    const goal = 'Map all unexplored areas of the grid'
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      goal,
      questionProbability: 0,
      delayFn: () => 0,
    })

    engine.startRun(run.id, mock.asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))

    const completed = engine.getRun(run.id)!
    expect(completed.result).toBeDefined()
    expect(completed.result).toContain(AGENT_NAME)
    expect(completed.result).toContain(goal)
  })
})

// ---------------------------------------------------------------------------
// RunEngine — backward compatibility: plain string executor still works
// ---------------------------------------------------------------------------

describe('RunEngine — backward compatible plain-string executor', () => {
  it('plain string from executor still transitions run to "completed"', async () => {
    const engine = new RunEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)

    const executor = vi.fn().mockResolvedValue('plain string result')
    engine.startRun(run.id, executor)

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))
    expect(engine.getRun(run.id)!.result).toBe('plain string result')
  })
})

// ---------------------------------------------------------------------------
// MockLLM — type contract verification (compile-time checks via runtime)
// ---------------------------------------------------------------------------

describe('MockLLM — response type contract', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('response always has kind and text fields', async () => {
    const mock = resultMock()
    const promise = mock.run()
    vi.runAllTimers()
    const response = await promise
    expect(response).toHaveProperty('kind')
    expect(response).toHaveProperty('text')
    expect(typeof response.kind).toBe('string')
    expect(typeof response.text).toBe('string')
  })

  it('kind is always "result" or "question"', async () => {
    const validKinds = ['result', 'question']
    // Test both paths
    const mocks = [resultMock(), questionMock()]
    for (const mock of mocks) {
      const promise = mock.run()
      vi.runAllTimers()
      const response = await promise
      expect(validKinds).toContain(response.kind)
    }
  })

  it('asExecutor() returns a function', () => {
    const mock = resultMock()
    const executor = mock.asExecutor()
    expect(typeof executor).toBe('function')
  })

  it('asExecutor() returns a function that returns a Promise', () => {
    const mock = resultMock()
    const executor = mock.asExecutor()
    const result = executor()
    expect(result).toBeInstanceOf(Promise)
    // Clean up the pending timer
    vi.runAllTimers()
  })
})

// ---------------------------------------------------------------------------
// MockLLM — multiple concurrent runs (regression: each call is independent)
// ---------------------------------------------------------------------------

describe('MockLLM — multiple concurrent runs', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('two result runs complete independently', async () => {
    const engine = new RunEngine()
    const r1 = engine.createRun('agent-alice', 'Alice', 'Explorer', 'Task A')
    const r2 = engine.createRun('agent-bob', 'Bob', 'Builder', 'Task B')

    const mock1 = new MockLLM('Alice', 'Explorer', 'Task A', { questionProbability: 0, delayFn: () => 0 })
    const mock2 = new MockLLM('Bob', 'Builder', 'Task B', { questionProbability: 0, delayFn: () => 0 })

    engine.startRun(r1.id, mock1.asExecutor())
    engine.startRun(r2.id, mock2.asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => {
      expect(engine.getRun(r1.id)!.status).toBe('completed')
      expect(engine.getRun(r2.id)!.status).toBe('completed')
    })

    expect(engine.getRun(r1.id)!.result).toContain('Alice')
    expect(engine.getRun(r2.id)!.result).toContain('Bob')
  })

  it('one result and one question run settle independently', async () => {
    const engine = new RunEngine()
    const r1 = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    const r2 = engine.createRun('agent-bob', 'Bob', 'Builder', 'Construct the wall')

    engine.startRun(r1.id, resultMock().asExecutor())
    engine.startRun(r2.id, new MockLLM('Bob', 'Builder', 'Construct the wall', {
      questionProbability: 1,
      delayFn: () => 0,
    }).asExecutor())
    vi.runAllTimers()

    await vi.waitFor(() => {
      expect(engine.getRun(r1.id)!.status).toBe('completed')
      expect(engine.getRun(r2.id)!.status).toBe('awaiting')
    })
  })
})
