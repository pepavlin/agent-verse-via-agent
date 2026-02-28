// ---------------------------------------------------------------------------
// RunEngine — built-in MockLLM default executor integration tests
// ---------------------------------------------------------------------------
//
// These tests verify that when no executor is passed to startRun() / resumeRun()
// / runAsync(), the RunEngine automatically creates a MockLLM instance and that
// every run after simulated processing returns either a result ('completed') or
// a clarifying question ('awaiting').
//
// This covers the core contract: "every run after simulated processing returns
// a result or a question" regardless of whether the caller provides an explicit
// executor or relies on the built-in MockLLM default.
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RunEngine } from '../app/run-engine/engine'
import { MockLLM } from '../app/run-engine/mock-llm'
import type { Run } from '../app/run-engine/types'

const AGENT_ID = 'agent-alice'
const AGENT_NAME = 'Alice'
const AGENT_ROLE = 'Explorer'
const TASK = 'Map the northern sector'

const TERMINAL_STATUSES = ['completed', 'awaiting'] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Engine where the built-in MockLLM always produces a result (no question). */
function resultEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
}

/** Engine where the built-in MockLLM always produces a question. */
function questionEngine() {
  return new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
}

// ---------------------------------------------------------------------------
// startRun without executor — result path
// ---------------------------------------------------------------------------

describe('RunEngine built-in mock (no executor) — result path', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('run transitions to "completed" when mockQuestionProbability is 0', () => {
    const engine = resultEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.status).toBe('completed')
  })

  it('result text is set and non-empty', () => {
    const engine = resultEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    const completed = engine.getRun(run.id)!
    expect(completed.result).toBeDefined()
    expect(completed.result!.length).toBeGreaterThan(0)
  })

  it('result text contains the agent name', () => {
    const engine = resultEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.result).toContain(AGENT_NAME)
  })

  it('run settles in a terminal state (completed or awaiting)', () => {
    const engine = resultEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(TERMINAL_STATUSES).toContain(engine.getRun(run.id)!.status)
  })

  it('emits run:completed event', () => {
    const handler = vi.fn<[Run], void>()
    const engine = resultEngine()
    engine.on('run:completed', handler)

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0].status).toBe('completed')
  })
})

// ---------------------------------------------------------------------------
// startRun without executor — question path
// ---------------------------------------------------------------------------

describe('RunEngine built-in mock (no executor) — question path', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('run transitions to "awaiting" when mockQuestionProbability is 1', () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.status).toBe('awaiting')
  })

  it('question text is set and non-empty', () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    const awaiting = engine.getRun(run.id)!
    expect(awaiting.question).toBeDefined()
    expect(awaiting.question!.length).toBeGreaterThan(0)
  })

  it('question text contains the agent name', () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.question).toContain(AGENT_NAME)
  })

  it('run settles in a terminal state (completed or awaiting)', () => {
    const engine = questionEngine()
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(TERMINAL_STATUSES).toContain(engine.getRun(run.id)!.status)
  })

  it('emits run:awaiting event', () => {
    const handler = vi.fn<[Run], void>()
    const engine = questionEngine()
    engine.on('run:awaiting', handler)

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0].status).toBe('awaiting')
  })
})

// ---------------------------------------------------------------------------
// Every run returns result or question — the core contract
// ---------------------------------------------------------------------------

describe('RunEngine — every run returns result or question (core contract)', () => {
  it('built-in mock settles in "completed" when mockQuestionProbability is 0', async () => {
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
    const run = await engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(TERMINAL_STATUSES).toContain(run.status)
    expect(run.status).toBe('completed')
  })

  it('built-in mock settles in "awaiting" when mockQuestionProbability is 1', async () => {
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
    const run = await engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(TERMINAL_STATUSES).toContain(run.status)
    expect(run.status).toBe('awaiting')
  })

  it('explicit MockLLM executor settles in "completed" when questionProbability is 0', async () => {
    const engine = new RunEngine()
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      questionProbability: 0,
      delayFn: () => 0,
    })
    const run = await engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, mock.asExecutor())
    expect(TERMINAL_STATUSES).toContain(run.status)
    expect(run.status).toBe('completed')
  })

  it('explicit MockLLM executor settles in "awaiting" when questionProbability is 1', async () => {
    const engine = new RunEngine()
    const mock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      questionProbability: 1,
      delayFn: () => 0,
    })
    const run = await engine.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, mock.asExecutor())
    expect(TERMINAL_STATUSES).toContain(run.status)
    expect(run.status).toBe('awaiting')
  })

  it('result path: both built-in mock and explicit executor produce result with agent name', async () => {
    const engineBuiltIn = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
    const runBuiltIn = await engineBuiltIn.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(runBuiltIn.status).toBe('completed')
    expect(runBuiltIn.result).toContain(AGENT_NAME)

    const engineExplicit = new RunEngine()
    const explicitMock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      questionProbability: 0,
      delayFn: () => 0,
    })
    const runExplicit = await engineExplicit.runAsync(
      AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, explicitMock.asExecutor(),
    )
    expect(runExplicit.status).toBe('completed')
    expect(runExplicit.result).toContain(AGENT_NAME)
  })

  it('question path: both built-in mock and explicit executor produce question with agent name', async () => {
    const engineBuiltIn = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
    const runBuiltIn = await engineBuiltIn.runAsync(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    expect(runBuiltIn.status).toBe('awaiting')
    expect(runBuiltIn.question).toContain(AGENT_NAME)

    const engineExplicit = new RunEngine()
    const explicitMock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      questionProbability: 1,
      delayFn: () => 0,
    })
    const runExplicit = await engineExplicit.runAsync(
      AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK, explicitMock.asExecutor(),
    )
    expect(runExplicit.status).toBe('awaiting')
    expect(runExplicit.question).toContain(AGENT_NAME)
  })

  it('multiple concurrent runs all settle to terminal states', async () => {
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
    const agents = [
      { id: 'agent-alice', name: 'Alice', role: 'Explorer' },
      { id: 'agent-bob', name: 'Bob', role: 'Builder' },
      { id: 'agent-carol', name: 'Carol', role: 'Scout' },
    ]

    const runs = await Promise.all(
      agents.map((a) => engine.runAsync(a.id, a.name, a.role, TASK)),
    )

    for (const run of runs) {
      expect(TERMINAL_STATUSES).toContain(run.status)
    }
  })
})

// ---------------------------------------------------------------------------
// resumeRun without executor — always produces a result
// ---------------------------------------------------------------------------

describe('RunEngine built-in mock resumeRun (no executor) — always result', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resumed run transitions to "completed" (never another question)', async () => {
    // Start with a question to get into awaiting state
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.status).toBe('awaiting')

    // Resume without executor — MockLLM with questionProbability=0 is used
    engine.resumeRun(run.id, 'My answer')
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.status).toBe('completed')
  })

  it('resumed run has result text with agent name', () => {
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    engine.resumeRun(run.id, 'My answer')
    vi.runAllTimers()

    const completed = engine.getRun(run.id)!
    expect(completed.result).toBeDefined()
    expect(completed.result!.length).toBeGreaterThan(0)
    expect(completed.result).toContain(AGENT_NAME)
  })

  it('resuming always completes (never another question) even with high question probability', () => {
    // Engine has very high question probability but resume must always produce result
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()
    expect(engine.getRun(run.id)!.status).toBe('awaiting')

    // Resume — this must ALWAYS produce completed, never awaiting again
    engine.resumeRun(run.id, 'Here is my answer')
    vi.runAllTimers()

    // Status must be completed — it never asked a second question (no second 'awaiting')
    expect(engine.getRun(run.id)!.status).toBe('completed')
    // The result must be set (result was produced, not another question)
    expect(engine.getRun(run.id)!.result).toBeDefined()
  })

  it('answer is stored on the resumed run', () => {
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 1 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    const answer = 'North-east corner, past the forest'
    engine.resumeRun(run.id, answer)
    vi.runAllTimers()

    expect(engine.getRun(run.id)!.answer).toBe(answer)
  })
})

// ---------------------------------------------------------------------------
// configSnapshot goal/persona propagate to the built-in MockLLM
// ---------------------------------------------------------------------------

describe('RunEngine built-in mock — configSnapshot goal/persona used in MockLLM', () => {
  it('result text is goal-aware when configSnapshot has goal', async () => {
    const goal = 'Map all unexplored areas of the grid'
    const engine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
    const snapshot = {
      id: AGENT_ID,
      name: AGENT_NAME,
      role: AGENT_ROLE,
      goal,
      configVersion: 1,
    }

    const run = await engine.runAsync(
      AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK,
      undefined, // no explicit executor — MockLLM created automatically
      snapshot,
    )

    expect(run.status).toBe('completed')
    expect(run.result).toContain(AGENT_NAME)
    // Realistic generation activated by configSnapshot.goal
    expect(run.result).toContain(goal)
  })

  it('built-in mock and explicit MockLLM both produce goal-aware text', async () => {
    const goal = 'Secure the perimeter'
    const snapshot = {
      id: AGENT_ID,
      name: AGENT_NAME,
      role: AGENT_ROLE,
      goal,
      configVersion: 1,
    }

    // Built-in mock path (configSnapshot passed to engine)
    const builtInEngine = new RunEngine({ delayFn: () => 0, mockQuestionProbability: 0 })
    const builtInRun = await builtInEngine.runAsync(
      AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK,
      undefined,
      snapshot,
    )

    // Explicit MockLLM path (goal passed directly to MockLLM)
    const explicitEngine = new RunEngine()
    const explicitMock = new MockLLM(AGENT_NAME, AGENT_ROLE, TASK, {
      goal,
      questionProbability: 0,
      delayFn: () => 0,
    })
    const explicitRun = await explicitEngine.runAsync(
      AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK,
      explicitMock.asExecutor(),
    )

    // Both should produce goal-aware results
    expect(builtInRun.result).toContain(goal)
    expect(explicitRun.result).toContain(goal)
  })
})

// ---------------------------------------------------------------------------
// Event order — built-in mock follows same lifecycle as executor path
// ---------------------------------------------------------------------------

describe('RunEngine built-in mock — event lifecycle matches executor path', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('built-in mock emits created → started → completed in order', () => {
    const events: string[] = []
    const engine = resultEngine()
    engine.on('run:created', () => events.push('run:created'))
    engine.on('run:started', () => events.push('run:started'))
    engine.on('run:completed', () => events.push('run:completed'))
    engine.on('run:awaiting', () => events.push('run:awaiting'))

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(events).toEqual(['run:created', 'run:started', 'run:completed'])
  })

  it('built-in mock emits created → started → awaiting in order (question path)', () => {
    const events: string[] = []
    const engine = questionEngine()
    engine.on('run:created', () => events.push('run:created'))
    engine.on('run:started', () => events.push('run:started'))
    engine.on('run:completed', () => events.push('run:completed'))
    engine.on('run:awaiting', () => events.push('run:awaiting'))

    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)
    vi.runAllTimers()

    expect(events).toEqual(['run:created', 'run:started', 'run:awaiting'])
  })
})

// ---------------------------------------------------------------------------
// Delay configuration — built-in mock respects engine delay settings
// ---------------------------------------------------------------------------

describe('RunEngine built-in mock — delay configuration', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('built-in mock does not complete before the configured delay', () => {
    const engine = new RunEngine({ delayFn: () => 3_000, mockQuestionProbability: 0 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)

    vi.advanceTimersByTime(2_999)
    expect(engine.getRun(run.id)!.status).toBe('running')
  })

  it('built-in mock completes after the configured delay', () => {
    const engine = new RunEngine({ delayFn: () => 3_000, mockQuestionProbability: 0 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)

    vi.advanceTimersByTime(3_000)
    expect(engine.getRun(run.id)!.status).toBe('completed')
  })

  it('built-in mock respects the engine delayFn', () => {
    const DELAY = 2_500
    const engine = new RunEngine({ delayFn: () => DELAY, mockQuestionProbability: 0 })
    const run = engine.createRun(AGENT_ID, AGENT_NAME, AGENT_ROLE, TASK)
    engine.startRun(run.id)

    vi.advanceTimersByTime(DELAY - 1)
    expect(engine.getRun(run.id)!.status).toBe('running')

    vi.advanceTimersByTime(1)
    expect(engine.getRun(run.id)!.status).toBe('completed')
  })
})
