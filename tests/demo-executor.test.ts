import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createDemoExecutor,
  createDemoChildExecutorFactory,
  createDemoParentExecutorFactory,
  DEMO_MODE_DEFAULTS,
} from '../app/run-engine/demo-executor'
import type { DemoAgentContext } from '../app/run-engine/demo-executor'
import { RunEngine } from '../app/run-engine/engine'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ALICE: DemoAgentContext = {
  name: 'Alice',
  role: 'Explorer',
  goal: 'Map all unexplored areas of the grid',
  persona: 'Curious and bold. Always the first to venture into unknown territory.',
}

const BOB: DemoAgentContext = {
  name: 'Bob',
  role: 'Builder',
  goal: 'Construct and maintain structures across the grid',
  persona: 'Methodical and reliable. Prefers a solid plan before starting any project.',
}

const CAROL: DemoAgentContext = {
  name: 'Carol',
  role: 'Scout',
  goal: 'Gather intelligence and report back quickly',
  persona: 'Fast and observant. Never lingers — always on the move.',
}

const MINIMAL: DemoAgentContext = {
  name: 'Eve',
  role: 'Assistant',
}

const EXPLORATION_TASK = 'Map the northern sector'
const BUILD_TASK = 'Construct a watchtower at grid B-5'

// ---------------------------------------------------------------------------
// createDemoExecutor — basic contract
// ---------------------------------------------------------------------------

describe('createDemoExecutor — basic contract', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns a function', () => {
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0 })
    expect(typeof executor).toBe('function')
  })

  it('the returned function returns a Promise', () => {
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0 })
    const result = executor()
    expect(result).toBeInstanceOf(Promise)
    vi.runAllTimers()
  })

  it('resolves with a MockLLMResponse object', async () => {
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response).toHaveProperty('kind')
    expect(response).toHaveProperty('text')
    expect(['result', 'question']).toContain(response.kind)
  })

  it('result kind resolves when questionProbability is 0', async () => {
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response.kind).toBe('result')
  })

  it('question kind resolves when questionProbability is 1', async () => {
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 1 })
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response.kind).toBe('question')
  })

  it('result text contains the agent name', async () => {
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response.text).toContain('Alice')
  })

  it('result text is non-empty', async () => {
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response.text.length).toBeGreaterThan(0)
  })

  it('question text contains the agent name', async () => {
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 1 })
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response.text).toContain('Alice')
  })
})

// ---------------------------------------------------------------------------
// createDemoExecutor — goal and persona integration
// ---------------------------------------------------------------------------

describe('createDemoExecutor — goal and persona integration', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('result text includes the goal when goal is provided', async () => {
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response.text).toContain(ALICE.goal!)
  })

  it('works correctly without goal (minimal context)', async () => {
    const executor = createDemoExecutor(MINIMAL, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response.kind).toBe('result')
    expect(response.text).toContain('Eve')
    expect(response.text.length).toBeGreaterThan(0)
  })

  it('different agents produce different result texts for the same task', async () => {
    const execAlice = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })
    const execBob = createDemoExecutor(BOB, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })

    const pAlice = execAlice()
    const pBob = execBob()
    vi.runAllTimers()

    const [rAlice, rBob] = await Promise.all([pAlice, pBob])
    // Different names → different text at minimum
    expect(rAlice.text).toContain('Alice')
    expect(rBob.text).toContain('Bob')
    expect(rAlice.text).not.toBe(rBob.text)
  })

  it('different tasks produce topic-appropriate responses', async () => {
    const execExplore = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })
    const execBuild = createDemoExecutor(ALICE, BUILD_TASK, { delayFn: () => 0, questionProbability: 0 })

    const pExplore = execExplore()
    const pBuild = execBuild()
    vi.runAllTimers()

    const [rExplore, rBuild] = await Promise.all([pExplore, pBuild])
    // Both should contain Alice but have different topic-flavoured content
    expect(rExplore.text).toContain('Alice')
    expect(rBuild.text).toContain('Alice')
    expect(rExplore.text).not.toBe(rBuild.text)
  })
})

// ---------------------------------------------------------------------------
// createDemoExecutor — timing
// ---------------------------------------------------------------------------

describe('createDemoExecutor — timing', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('uses the custom delayFn when provided', async () => {
    const delayFn = vi.fn().mockReturnValue(500)
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn, questionProbability: 0 })
    const promise = executor()
    expect(delayFn).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(500)
    const response = await promise
    expect(response.kind).toBe('result')
  })

  it('does not resolve before the delay elapses', async () => {
    let resolved = false
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, {
      delayFn: () => 1_000,
      questionProbability: 0,
    })
    executor().then(() => { resolved = true })
    vi.advanceTimersByTime(999)
    await Promise.resolve()
    expect(resolved).toBe(false)
  })

  it('resolves after the delay elapses', async () => {
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, {
      delayFn: () => 1_000,
      questionProbability: 0,
    })
    const promise = executor()
    vi.advanceTimersByTime(1_000)
    const response = await promise
    expect(response.kind).toBe('result')
  })
})

// ---------------------------------------------------------------------------
// createDemoExecutor — DEMO_MODE_DEFAULTS
// ---------------------------------------------------------------------------

describe('DEMO_MODE_DEFAULTS', () => {
  it('has questionProbability between 0 and 1', () => {
    expect(DEMO_MODE_DEFAULTS.questionProbability).toBeGreaterThanOrEqual(0)
    expect(DEMO_MODE_DEFAULTS.questionProbability).toBeLessThanOrEqual(1)
  })

  it('has minDelayMs < maxDelayMs', () => {
    expect(DEMO_MODE_DEFAULTS.minDelayMs).toBeLessThan(DEMO_MODE_DEFAULTS.maxDelayMs)
  })

  it('minDelayMs is positive', () => {
    expect(DEMO_MODE_DEFAULTS.minDelayMs).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// createDemoExecutor — RunEngine integration
// ---------------------------------------------------------------------------

describe('createDemoExecutor — RunEngine integration (result path)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('transitions run to "completed" via demo executor', async () => {
    const engine = new RunEngine()
    const run = engine.createRun('agent-alice', 'Alice', 'Explorer', EXPLORATION_TASK)
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })

    engine.startRun(run.id, executor)
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('completed'))

    const completed = engine.getRun(run.id)!
    expect(completed.result).toBeDefined()
    expect(completed.result).toContain('Alice')
    expect(completed.result).toContain(ALICE.goal!)
  })

  it('transitions run to "awaiting" when question is generated', async () => {
    const engine = new RunEngine()
    const run = engine.createRun('agent-alice', 'Alice', 'Explorer', EXPLORATION_TASK)
    const executor = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 1 })

    engine.startRun(run.id, executor)
    vi.runAllTimers()

    await vi.waitFor(() => expect(engine.getRun(run.id)!.status).toBe('awaiting'))

    const awaiting = engine.getRun(run.id)!
    expect(awaiting.question).toBeDefined()
    expect(awaiting.question).toContain('Alice')
  })

  it('emits run:completed event with goal-aware result', async () => {
    const handler = vi.fn()
    const engine = new RunEngine()
    engine.on('run:completed', handler)

    const run = engine.createRun('agent-alice', 'Alice', 'Explorer', EXPLORATION_TASK)
    engine.startRun(run.id, createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 }))
    vi.runAllTimers()

    await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce())
    const emitted = handler.mock.calls[0][0]
    expect(emitted.result).toContain(ALICE.goal!)
  })

  it('multiple concurrent demo runs complete independently', async () => {
    const engine = new RunEngine()
    const r1 = engine.createRun('agent-alice', 'Alice', 'Explorer', EXPLORATION_TASK)
    const r2 = engine.createRun('agent-bob', 'Bob', 'Builder', BUILD_TASK)

    engine.startRun(r1.id, createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 }))
    engine.startRun(r2.id, createDemoExecutor(BOB, BUILD_TASK, { delayFn: () => 0, questionProbability: 0 }))
    vi.runAllTimers()

    await vi.waitFor(() => {
      expect(engine.getRun(r1.id)!.status).toBe('completed')
      expect(engine.getRun(r2.id)!.status).toBe('completed')
    })

    expect(engine.getRun(r1.id)!.result).toContain('Alice')
    expect(engine.getRun(r2.id)!.result).toContain('Bob')
  })
})

// ---------------------------------------------------------------------------
// createDemoChildExecutorFactory
// ---------------------------------------------------------------------------

describe('createDemoChildExecutorFactory', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns a factory function', () => {
    const map = new Map<string, DemoAgentContext>([['alice', ALICE]])
    const factory = createDemoChildExecutorFactory(map, EXPLORATION_TASK)
    expect(typeof factory).toBe('function')
  })

  it('factory returns an executor function for a known agent', () => {
    const map = new Map([['alice', ALICE]])
    const factory = createDemoChildExecutorFactory(map, EXPLORATION_TASK)
    const executor = factory('alice')
    expect(typeof executor).toBe('function')
  })

  it('factory returns a fallback executor for an unknown agent', async () => {
    const map = new Map<string, DemoAgentContext>()
    const factory = createDemoChildExecutorFactory(map, EXPLORATION_TASK)
    const executor = factory('unknown-agent')
    const response = await executor()
    expect(response.kind).toBe('result')
    expect(typeof response.text).toBe('string')
    expect(response.text.length).toBeGreaterThan(0)
  })

  it('known agent executor resolves with agent-specific result', async () => {
    const map = new Map([['alice', ALICE], ['bob', BOB]])
    const factory = createDemoChildExecutorFactory(map, BUILD_TASK)
    const execBob = factory('bob')

    const promise = execBob()
    vi.runAllTimers()
    const response = await promise
    expect(response.kind).toBe('result')
    expect(response.text).toContain('Bob')
  })

  it('different children produce different responses for the same task', async () => {
    const map = new Map([['alice', ALICE], ['bob', BOB]])
    const factory = createDemoChildExecutorFactory(map, EXPLORATION_TASK)

    const pAlice = factory('alice')()
    const pBob = factory('bob')()
    vi.runAllTimers()

    const [rAlice, rBob] = await Promise.all([pAlice, pBob])
    expect(rAlice.text).toContain('Alice')
    expect(rBob.text).toContain('Bob')
  })

  it('integrates with RunEngine.startRunWithChildren', async () => {
    const engine = new RunEngine()
    const childMap = new Map([['bob', BOB], ['carol', CAROL]])
    const childFactory = createDemoChildExecutorFactory(childMap, BUILD_TASK)
    const parentFactory = createDemoParentExecutorFactory(ALICE, BUILD_TASK)

    const parentRun = engine.createRun('alice', 'Alice', 'Explorer', BUILD_TASK)
    const childDefs = [
      { agentId: 'bob', agentName: 'Bob', agentRole: 'Builder' },
      { agentId: 'carol', agentName: 'Carol', agentRole: 'Scout' },
    ]

    engine.startRunWithChildren(parentRun.id, childDefs, parentFactory, childFactory)
    vi.runAllTimers()

    await vi.waitFor(() => {
      expect(engine.getRun(parentRun.id)!.status).toBe('completed')
    }, { timeout: 5000 })

    const completed = engine.getRun(parentRun.id)!
    expect(completed.result).toBeDefined()
    expect(completed.result!.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// createDemoParentExecutorFactory
// ---------------------------------------------------------------------------

describe('createDemoParentExecutorFactory', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns a factory function', () => {
    const factory = createDemoParentExecutorFactory(ALICE, BUILD_TASK)
    expect(typeof factory).toBe('function')
  })

  it('factory returns an executor function', () => {
    const factory = createDemoParentExecutorFactory(ALICE, BUILD_TASK)
    const executor = factory([{ result: 'Child result from Bob', error: undefined }])
    expect(typeof executor).toBe('function')
  })

  it('parent executor always produces a result (no question)', async () => {
    const factory = createDemoParentExecutorFactory(ALICE, EXPLORATION_TASK)
    const executor = factory([{ result: 'Child run completed.', error: undefined }])

    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    // Parent synthesis should never ask a question
    expect(response.kind).toBe('result')
  })

  it('parent result contains the parent agent name', async () => {
    const factory = createDemoParentExecutorFactory(ALICE, EXPLORATION_TASK)
    const executor = factory([])
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response.text).toContain('Alice')
  })

  it('works with an empty list of completed child runs', async () => {
    const factory = createDemoParentExecutorFactory(ALICE, EXPLORATION_TASK)
    const executor = factory([])
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response.kind).toBe('result')
    expect(response.text.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// DemoAgentContext type contract
// ---------------------------------------------------------------------------

describe('DemoAgentContext — type contract', () => {
  it('minimal context (name + role only) produces a valid executor', async () => {
    vi.useFakeTimers()
    const executor = createDemoExecutor(MINIMAL, 'Handle the assignment', { delayFn: () => 0, questionProbability: 0 })
    const promise = executor()
    vi.runAllTimers()
    const response = await promise
    expect(response.kind).toBe('result')
    expect(response.text).toContain('Eve')
    vi.useRealTimers()
  })

  it('full context (name, role, goal, persona) produces richer responses', async () => {
    vi.useFakeTimers()
    const executorMinimal = createDemoExecutor(MINIMAL, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })
    const executorFull = createDemoExecutor(ALICE, EXPLORATION_TASK, { delayFn: () => 0, questionProbability: 0 })

    const pMinimal = executorMinimal()
    const pFull = executorFull()
    vi.runAllTimers()

    const [rMinimal, rFull] = await Promise.all([pMinimal, pFull])
    // Full context response includes the goal — must be longer
    expect(rFull.text.length).toBeGreaterThan(rMinimal.text.length)
    expect(rFull.text).toContain(ALICE.goal!)
    vi.useRealTimers()
  })
})
