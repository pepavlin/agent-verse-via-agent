// ---------------------------------------------------------------------------
// RunEngine — manages the lifecycle of task runs
// ---------------------------------------------------------------------------

import type {
  Run,
  RunEventType,
  RunEventHandler,
  RunEngineOptions,
  MockLLMResponse,
} from './types'
import { generateResult, generateQuestion } from './results'

/** Agent metadata the engine needs to generate results. */
export interface AgentMeta {
  name: string
  role: string
}

/**
 * Optional async executor that produces the run outcome.
 * When provided, it replaces the built-in mock timeout behaviour.
 * When omitted, the engine falls back to the built-in mock (random delay + template).
 *
 * The executor may return:
 *   - A plain `string` → treated as a result; run transitions to 'completed'.
 *   - A `MockLLMResponse` with `kind: 'result'` → same as plain string.
 *   - A `MockLLMResponse` with `kind: 'question'` → run transitions to 'awaiting'.
 *
 * The `MockLLM` class produces `MockLLMResponse` values and exposes `asExecutor()`
 * to create a compatible executor function.
 */
export type RunExecutor = () => Promise<string | MockLLMResponse>

/** Default random delay: uniform distribution in [minMs, maxMs]. */
function defaultDelayFn(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs)
}

/** Generate a unique, time-ordered run ID. */
function generateId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ---------------------------------------------------------------------------
// RunEngine
// ---------------------------------------------------------------------------

/**
 * RunEngine manages task run lifecycles.
 *
 * Lifecycle:
 *   createRun()  → Run(status='pending')
 *   startRun()   → Run(status='running')
 *                  – With executor: awaits executor(), then completes / fails.
 *                  – Without executor: falls back to mock (random delay + template).
 *                    The mock randomly resolves to either:
 *                      • 'completed' with a result string, or
 *                      • 'awaiting' with a clarifying question string
 *                    (controlled by RunEngineOptions.mockQuestionProbability)
 *   [resolution] → Run(status='completed' | 'awaiting' | 'failed')
 *
 * Usage:
 * // Mock mode (no real LLM):
 * const run = engine.createRun('agent-alice', 'Alice', 'Explorer', 'Map the north sector')
 * engine.startRun(run.id)
 *
 * // Real LLM mode:
 * const run = engine.createRun('agent-alice', 'Alice', 'Explorer', 'Map the north sector')
 * engine.startRun(run.id, async () => {
 *   const res = await fetch('/api/run', { ... })
 *   const data = await res.json()
 *   return data.result
 * })
 */
export class RunEngine {
  private readonly _runs = new Map<string, Run>()
  private readonly _listeners = new Map<RunEventType, Set<RunEventHandler>>()
  private readonly _minDelayMs: number
  private readonly _maxDelayMs: number
  private readonly _delayFn: (minMs: number, maxMs: number) => number
  private readonly _mockQuestionProbability: number
  /** Tracks pending timeout handles so they can be cleared if needed. */
  private readonly _pendingTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(options: RunEngineOptions = {}) {
    this._minDelayMs = options.minDelayMs ?? 2_000
    this._maxDelayMs = options.maxDelayMs ?? 6_000
    this._delayFn = options.delayFn ?? defaultDelayFn
    this._mockQuestionProbability = options.mockQuestionProbability ?? 0.3
  }

  // -------------------------------------------------------------------------
  // Public API — create & start
  // -------------------------------------------------------------------------

  /**
   * Create a new run in 'pending' state.
   *
   * @param agentId         Identifier of the executing agent
   * @param agentName       Display name used for result generation
   * @param agentRole       Role label used for result generation
   * @param taskDescription Plain-language description of the task
   * @returns               The newly created Run
   */
  createRun(
    agentId: string,
    agentName: string,
    agentRole: string,
    taskDescription: string,
  ): Run {
    const run: Run = {
      id: generateId(),
      agentId,
      taskDescription,
      status: 'pending',
      createdAt: Date.now(),
    }
    // Store agent meta alongside the run for result generation later
    this._agentMeta.set(run.id, { name: agentName, role: agentRole })
    this._runs.set(run.id, run)
    this._emit('run:created', run)
    return run
  }

  /**
   * Transition a pending run to 'running' and schedule its completion.
   *
   * @param runId    The ID of the run to start.
   * @param executor Optional async function that produces the result string.
   *                 When omitted, the built-in mock (random delay + template) is used.
   * @throws Error if the run does not exist or is not in 'pending' state.
   */
  startRun(runId: string, executor?: RunExecutor): void {
    const run = this._getOrThrow(runId)

    if (run.status !== 'pending') {
      throw new Error(
        `Cannot start run "${runId}": expected status 'pending' but got '${run.status}'.`,
      )
    }

    const started: Run = { ...run, status: 'running', startedAt: Date.now() }
    this._runs.set(runId, started)
    this._emit('run:started', started)

    if (executor) {
      // Executor path: call it and route the outcome to the correct terminal state.
      // Accepts both a plain string (legacy / real-LLM) and a MockLLMResponse:
      //   plain string or { kind: 'result' }  → _resolveRun  (status: 'completed')
      //   { kind: 'question' }                → _awaitRun    (status: 'awaiting')
      executor()
        .then((outcome) => {
          if (typeof outcome === 'string') {
            this._resolveRun(runId, outcome)
          } else if (outcome.kind === 'result') {
            this._resolveRun(runId, outcome.text)
          } else {
            this._awaitRun(runId, outcome.text)
          }
        })
        .catch((err) => {
          const message =
            err instanceof Error ? err.message : 'Nastala neočekávaná chyba. Zkus to znovu.'
          this._failRun(runId, message)
        })
    } else {
      // Mock mode: schedule completion after a random delay
      const delayMs = this._delayFn(this._minDelayMs, this._maxDelayMs)
      const handle = setTimeout(() => {
        this._completeRunWithMock(runId)
        this._pendingTimeouts.delete(runId)
      }, delayMs)
      this._pendingTimeouts.set(runId, handle)
    }
  }

  // -------------------------------------------------------------------------
  // Public API — querying
  // -------------------------------------------------------------------------

  /** Return the current snapshot of a run, or undefined if not found. */
  getRun(runId: string): Run | undefined {
    return this._runs.get(runId)
  }

  /** Return snapshots of all runs in creation order. */
  getAllRuns(): Run[] {
    return Array.from(this._runs.values())
  }

  /** Return all runs for a given agent. */
  getRunsByAgent(agentId: string): Run[] {
    return this.getAllRuns().filter((r) => r.agentId === agentId)
  }

  // -------------------------------------------------------------------------
  // Public API — events
  // -------------------------------------------------------------------------

  /**
   * Subscribe to a run lifecycle event.
   *
   * @returns An unsubscribe function — call it to remove the handler.
   */
  on(event: RunEventType, handler: RunEventHandler): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }
    this._listeners.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  /** Remove a previously registered event handler. */
  off(event: RunEventType, handler: RunEventHandler): void {
    this._listeners.get(event)?.delete(handler)
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /** Secondary map that keeps agent meta (name/role) keyed by run ID. */
  private readonly _agentMeta = new Map<string, AgentMeta>()

  /** Complete a run with a result produced by the real executor. */
  private _resolveRun(runId: string, result: string): void {
    const run = this._runs.get(runId)
    if (!run || run.status !== 'running') return

    const completed: Run = {
      ...run,
      status: 'completed',
      completedAt: Date.now(),
      result,
    }
    this._runs.set(runId, completed)
    this._emit('run:completed', completed)
  }

  /**
   * Transition a running run to 'awaiting' with a clarifying question.
   * Called when an executor (e.g. MockLLM) signals it needs more information.
   */
  private _awaitRun(runId: string, question: string): void {
    const run = this._runs.get(runId)
    if (!run || run.status !== 'running') return

    const awaiting: Run = {
      ...run,
      status: 'awaiting',
      completedAt: Date.now(),
      question,
    }
    this._runs.set(runId, awaiting)
    this._emit('run:awaiting', awaiting)
  }

  /** Fail a run with a user-facing error message. */
  private _failRun(runId: string, errorMessage: string): void {
    const run = this._runs.get(runId)
    if (!run || run.status !== 'running') return

    const failed: Run = {
      ...run,
      status: 'failed',
      completedAt: Date.now(),
      error: errorMessage,
    }
    this._runs.set(runId, failed)
    this._emit('run:failed', failed)
  }

  /**
   * Complete a mock run by randomly producing either:
   *   • a result string → status 'completed' + 'run:completed' event
   *   • a question string → status 'awaiting' + 'run:awaiting' event
   *
   * The probability of the question path is controlled by _mockQuestionProbability.
   */
  private _completeRunWithMock(runId: string): void {
    const run = this._runs.get(runId)
    if (!run || run.status !== 'running') return

    const meta = this._agentMeta.get(runId) ?? { name: 'Agent', role: 'Agent' }

    if (Math.random() < this._mockQuestionProbability) {
      // Question path — agent needs clarification before continuing
      const question = generateQuestion(meta.name, meta.role, run.taskDescription)
      const awaiting: Run = {
        ...run,
        status: 'awaiting',
        completedAt: Date.now(),
        question,
      }
      this._runs.set(runId, awaiting)
      this._emit('run:awaiting', awaiting)
    } else {
      // Result path — agent completed the task
      const result = generateResult(meta.name, meta.role, run.taskDescription)
      const completed: Run = {
        ...run,
        status: 'completed',
        completedAt: Date.now(),
        result,
      }
      this._runs.set(runId, completed)
      this._emit('run:completed', completed)
    }
  }

  private _getOrThrow(runId: string): Run {
    const run = this._runs.get(runId)
    if (!run) throw new Error(`Run "${runId}" not found.`)
    return run
  }

  private _emit(event: RunEventType, run: Run): void {
    const handlers = this._listeners.get(event)
    if (!handlers) return
    for (const handler of handlers) {
      handler(run)
    }
  }
}
