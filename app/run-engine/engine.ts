// ---------------------------------------------------------------------------
// RunEngine — manages the lifecycle of task runs
// ---------------------------------------------------------------------------

import type {
  Run,
  RunEventType,
  RunEventHandler,
  RunEngineOptions,
  MockLLMResponse,
  AgentConfigSnapshot,
} from './types'
import { composeDelegatedResults } from './results'
import type { ChildRunOutcome } from './results'
import { MockLLM } from './mock-llm'


/** Agent metadata the engine needs to generate results. */
export interface AgentMeta {
  name: string
  role: string
}

/**
 * Minimal agent descriptor passed to startRunWithChildren to define child agents.
 * Only the fields required for run creation and result generation are needed.
 */
export interface ChildAgentDef {
  /** Unique agent identifier. */
  agentId: string
  /** Display name used for result generation. */
  agentName: string
  /** Role label used for result generation. */
  agentRole: string
  /**
   * Optional configuration snapshot captured when the parent run was created.
   * When provided, it is stored in the child run so that config changes after
   * delegation starts do not affect child execution.
   */
  configSnapshot?: AgentConfigSnapshot
}

/**
 * Optional factory that receives the completed child runs and returns an executor
 * for the parent run. This allows the parent's LLM call to incorporate child results.
 *
 * When omitted, the engine composes child results automatically using composeDelegatedResults.
 */
export type ParentExecutorFactory = (childRuns: Run[]) => RunExecutor

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
 *                  – With executor: awaits executor(), then completes / fails / awaits.
 *                  – Without executor: falls back to mock (random delay + template).
 *                    The mock randomly resolves to either:
 *                      • 'completed' with a result string, or
 *                      • 'awaiting' with a clarifying question string
 *                    (controlled by RunEngineOptions.mockQuestionProbability)
 *   [resolution] → Run(status='completed' | 'awaiting' | 'failed')
 *
 *   resumeRun()  → Run(status='running')   [only when status === 'awaiting']
 *                  – With executor: awaits executor(), then completes / fails.
 *                  – Without executor: falls back to mock result (no question, answer provided).
 *   [resolution] → Run(status='completed' | 'failed')
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
 *
 * // Resume after awaiting (needs_user):
 * engine.resumeRun(run.id, 'User answer here', async () => {
 *   const res = await fetch('/api/run', { body: JSON.stringify({ ..., userAnswer: 'User answer here' }) })
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
   * @param parentRunId     Optional: ID of the parent run (for child/sub-runs)
   * @param configSnapshot  Optional: immutable snapshot of the agent configuration
   *                        at run creation time. When provided, it is stored on the
   *                        run so that subsequent config edits do not affect this run.
   * @returns               The newly created Run
   */
  createRun(
    agentId: string,
    agentName: string,
    agentRole: string,
    taskDescription: string,
    parentRunId?: string,
    configSnapshot?: AgentConfigSnapshot,
  ): Run {
    const run: Run = {
      id: generateId(),
      agentId,
      taskDescription,
      status: 'pending',
      createdAt: Date.now(),
      ...(parentRunId !== undefined && { parentRunId }),
      // Defensive shallow copy: all fields are primitives, so spread is sufficient.
      // This ensures the stored snapshot is immutable with respect to the caller's object.
      ...(configSnapshot !== undefined && { configSnapshot: { ...configSnapshot } }),
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

  /**
   * Convenience method: create a run and immediately start it in a single call.
   *
   * Equivalent to calling `createRun()` followed by `startRun()`, but expressed
   * as one atomic operation.  The returned run already has `status === 'running'`.
   *
   * After the configured delay (default 2–6 s) the run transitions to `'completed'`
   * (or `'awaiting'` / `'failed'` depending on the executor or mock settings).
   *
   * @param agentId         Identifier of the executing agent
   * @param agentName       Display name used for result generation
   * @param agentRole       Role label used for result generation
   * @param taskDescription Plain-language description of the task
   * @param executor        Optional async function that produces the result string.
   *                        When omitted, the built-in mock (random delay 2–6 s + template) is used.
   * @returns               The newly created Run; its status is already `'running'`.
   *
   * @example
   * // Mock mode — completes on its own after 2–6 seconds:
   * const run = engine.dispatch('agent-alice', 'Alice', 'Explorer', 'Map the north sector')
   * // run.status === 'running'
   *
   * // Real LLM mode:
   * const run = engine.dispatch('agent-alice', 'Alice', 'Explorer', 'Map the north sector', async () => {
   *   const res = await fetch('/api/run', { ... })
   *   const data = await res.json()
   *   return data.result
   * })
   */
  dispatch(
    agentId: string,
    agentName: string,
    agentRole: string,
    taskDescription: string,
    executor?: RunExecutor,
    configSnapshot?: AgentConfigSnapshot,
  ): Run {
    const run = this.createRun(agentId, agentName, agentRole, taskDescription, undefined, configSnapshot)
    this.startRun(run.id, executor)
    // Return the freshly updated 'running' snapshot from the internal map.
    return this.getRun(run.id)!
  }

  /**
   * Create a run, start it immediately, and return a Promise that resolves when
   * the run reaches a terminal state.
   *
   * This is the async counterpart to `dispatch()`. Where `dispatch()` returns
   * the run in 'running' state and requires subscribing to events for the
   * outcome, `runAsync()` wraps the full lifecycle into a single awaitable
   * operation — making it easy to use in async/await code.
   *
   * Lifecycle:
   *   pending → running  (synchronously, before the Promise returns)
   *   running → completed | awaiting | failed  (after the configured delay or executor)
   *
   * Resolution:
   *   - 'completed' → resolves with the completed Run (result is set)
   *   - 'awaiting'  → resolves with the awaiting Run (question is set)
   *   - 'failed'    → rejects with an Error containing the run's error message
   *
   * After the configured delay (default 2–6 s, mock mode) or after the executor
   * resolves (real LLM mode), the returned Promise settles.
   *
   * @param agentId         Identifier of the executing agent
   * @param agentName       Display name used for result generation
   * @param agentRole       Role label used for result generation
   * @param taskDescription Plain-language description of the task
   * @param executor        Optional async function that produces the result string.
   *                        When omitted, the built-in mock (random delay 2–6 s + template) is used.
   * @param configSnapshot  Optional: immutable snapshot of the agent configuration.
   * @returns               Promise that resolves with the settled Run or rejects on failure.
   *
   * @example
   * // Mock mode — resolves after 2–6 seconds with a result:
   * const run = await engine.runAsync('agent-alice', 'Alice', 'Explorer', 'Map the north sector')
   * console.log(run.status)  // 'completed'
   * console.log(run.result)  // 'Alice has completed...'
   *
   * // Real LLM mode:
   * const run = await engine.runAsync('agent-alice', 'Alice', 'Explorer', 'Map the north sector', async () => {
   *   const res = await fetch('/api/run', { ... })
   *   const data = await res.json()
   *   return data.result
   * })
   */
  runAsync(
    agentId: string,
    agentName: string,
    agentRole: string,
    taskDescription: string,
    executor?: RunExecutor,
    configSnapshot?: AgentConfigSnapshot,
  ): Promise<Run> {
    return new Promise<Run>((resolve, reject) => {
      const run = this.createRun(agentId, agentName, agentRole, taskDescription, undefined, configSnapshot)
      const runId = run.id

      // Subscribe to all terminal events for this specific run.
      // Unsubscribe immediately after the first matching event to avoid leaks.
      const unsubCompleted = this.on('run:completed', (r) => {
        if (r.id !== runId) return
        unsubCompleted()
        unsubAwaiting()
        unsubFailed()
        resolve(r)
      })

      const unsubAwaiting = this.on('run:awaiting', (r) => {
        if (r.id !== runId) return
        unsubCompleted()
        unsubAwaiting()
        unsubFailed()
        resolve(r)
      })

      const unsubFailed = this.on('run:failed', (r) => {
        if (r.id !== runId) return
        unsubCompleted()
        unsubAwaiting()
        unsubFailed()
        reject(new Error(r.error ?? 'Nastala neočekávaná chyba. Zkus to znovu.'))
      })

      // Start the run — this transitions it to 'running' and schedules completion.
      // Must be called AFTER subscribing to events to avoid a race condition where
      // a synchronous executor resolves before the listeners are registered.
      this.startRun(runId, executor)
    })
  }

  /**
   * Resume a run that is currently in 'awaiting' state (agent had asked a question).
   *
   * Transitions the run back to 'running', stores the user's answer, and emits
   * 'run:resumed'. The run then completes via the executor or mock path.
   *
   * @param runId    The ID of the awaiting run.
   * @param answer   The user's answer to the agent's question.
   * @param executor Optional async function that produces the result.
   *                 When omitted, the built-in mock (random delay + template result) is used.
   *                 The mock never produces another question during resume — it always completes.
   * @throws Error if the run does not exist or is not in 'awaiting' state.
   */
  resumeRun(runId: string, answer: string, executor?: RunExecutor): void {
    const run = this._getOrThrow(runId)

    if (run.status !== 'awaiting') {
      throw new Error(
        `Cannot resume run "${runId}": expected status 'awaiting' but got '${run.status}'.`,
      )
    }

    const resumed: Run = {
      ...run,
      status: 'running',
      answer,
      // Reset completedAt so it gets a fresh timestamp when this run finishes
      completedAt: undefined,
    }
    this._runs.set(runId, resumed)
    this._emit('run:resumed', resumed)

    if (executor) {
      executor()
        .then((outcome) => {
          if (typeof outcome === 'string') {
            this._resolveRun(runId, outcome)
          } else if (outcome.kind === 'result') {
            this._resolveRun(runId, outcome.text)
          } else {
            // On resume, a question response is treated as a result to avoid infinite loops
            this._resolveRun(runId, outcome.text)
          }
        })
        .catch((err) => {
          const message =
            err instanceof Error ? err.message : 'Nastala neočekávaná chyba. Zkus to znovu.'
          this._failRun(runId, message)
        })
    } else {
      // Mock mode: always produce a result (never another question) after resume.
      // Uses MockLLM.generateSync() with questionProbability: 0 to guarantee a result,
      // preserving the invariant that resumed runs never ask a second question.
      const delayMs = this._delayFn(this._minDelayMs, this._maxDelayMs)
      const handle = setTimeout(() => {
        const currentRun = this._runs.get(runId)
        if (!currentRun || currentRun.status !== 'running') return
        const meta = this._agentMeta.get(runId) ?? { name: 'Agent', role: 'Agent' }
        const snapshot = currentRun.configSnapshot
        const mock = new MockLLM(meta.name, meta.role, currentRun.taskDescription, {
          questionProbability: 0, // Resume always produces a result, never another question
          goal: snapshot?.goal,
          persona: snapshot?.persona,
        })
        const outcome = mock.generateSync()
        this._resolveRun(runId, outcome.text)
        this._pendingTimeouts.delete(runId)
      }, delayMs)
      this._pendingTimeouts.set(runId, handle)
    }
  }

  /**
   * Start a run and orchestrate child sub-runs in parallel before completing.
   *
   * Flow:
   *   1. Parent transitions pending → running → delegating.
   *   2. For each child in childDefs, a child run is created (with parentRunId set).
   *   3. All child runs are started concurrently.
   *   4. When all children reach a terminal state (completed/awaiting/failed), the
   *      parent transitions delegating → running.
   *   5. If parentExecutorFactory is provided it is called with the completed child
   *      runs and the returned executor drives the parent to its terminal state.
   *      Otherwise the engine automatically composes child results and marks the
   *      parent as 'completed'.
   *
   * Child runs that end in 'awaiting' are treated as a terminal state for the
   * purposes of delegation flow (the parent does not block indefinitely on them).
   *
   * @param runId                  The pending parent run to orchestrate.
   * @param childDefs              Agent descriptors for each child run to spawn.
   * @param parentExecutorFactory  Optional factory that receives completed child runs
   *                               and returns an executor for the parent run.
   * @param childExecutorFactory   Optional per-child executor factory (agentId → executor).
   *                               When omitted, child runs use built-in mock mode.
   * @throws Error if the run does not exist or is not in 'pending' state.
   */
  startRunWithChildren(
    runId: string,
    childDefs: ChildAgentDef[],
    parentExecutorFactory?: ParentExecutorFactory,
    childExecutorFactory?: (agentId: string) => RunExecutor,
  ): void {
    const run = this._getOrThrow(runId)

    if (run.status !== 'pending') {
      throw new Error(
        `Cannot start run "${runId}": expected status 'pending' but got '${run.status}'.`,
      )
    }

    // Transition parent: pending → running
    const started: Run = { ...run, status: 'running', startedAt: Date.now() }
    this._runs.set(runId, started)
    this._emit('run:started', started)

    // If no children, fall back to regular single-executor behaviour
    if (childDefs.length === 0) {
      if (parentExecutorFactory) {
        const executor = parentExecutorFactory([])
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
        const delayMs = this._delayFn(this._minDelayMs, this._maxDelayMs)
        const handle = setTimeout(() => {
          this._completeRunWithMock(runId)
          this._pendingTimeouts.delete(runId)
        }, delayMs)
        this._pendingTimeouts.set(runId, handle)
      }
      return
    }

    // Transition parent: running → delegating
    const delegating: Run = { ...started, status: 'delegating' }
    this._runs.set(runId, delegating)
    this._emit('run:delegating', delegating)

    // Create child runs, all linked to the parent
    // Each child run receives its own config snapshot (if provided) so that
    // edits to agent config after delegation starts do not affect child execution.
    const childRuns: Run[] = childDefs.map((def) =>
      this.createRun(def.agentId, def.agentName, def.agentRole, delegating.taskDescription, runId, def.configSnapshot),
    )

    // Update parent with childRunIds
    const withChildren: Run = { ...delegating, childRunIds: childRuns.map((r) => r.id) }
    this._runs.set(runId, withChildren)

    // Orchestrate asynchronously — fire-and-forget
    ;(async () => {
      // Wait for all children to reach a terminal state (completed / awaiting / failed)
      await Promise.all(
        childRuns.map((childRun) => {
          return new Promise<void>((resolve) => {
            const settle = () => resolve()

            const unsubCompleted = this.on('run:completed', (r) => {
              if (r.id !== childRun.id) return
              unsubCompleted()
              unsubFailed()
              unsubAwaiting()
              settle()
            })
            const unsubFailed = this.on('run:failed', (r) => {
              if (r.id !== childRun.id) return
              unsubCompleted()
              unsubFailed()
              unsubAwaiting()
              settle()
            })
            const unsubAwaiting = this.on('run:awaiting', (r) => {
              if (r.id !== childRun.id) return
              unsubCompleted()
              unsubFailed()
              unsubAwaiting()
              settle()
            })

            // Start the child run
            const childExecutor = childExecutorFactory
              ? childExecutorFactory(childRun.agentId)
              : undefined
            this.startRun(childRun.id, childExecutor)
          })
        }),
      )

      // Collect child run snapshots after settlement
      const settledChildren = childRuns.map((cr) => this.getRun(cr.id)!)

      // Transition parent: delegating → running (in preparation for its own execution)
      const currentParent = this._runs.get(runId)
      if (!currentParent || currentParent.status !== 'delegating') return
      const runningAgain: Run = { ...currentParent, status: 'running' }
      this._runs.set(runId, runningAgain)

      if (parentExecutorFactory) {
        // Real executor: factory receives child results so it can incorporate them
        const executor = parentExecutorFactory(settledChildren)
        try {
          const outcome = await executor()
          if (typeof outcome === 'string') {
            this._resolveRun(runId, outcome)
          } else if (outcome.kind === 'result') {
            this._resolveRun(runId, outcome.text)
          } else {
            this._awaitRun(runId, outcome.text)
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Nastala neočekávaná chyba. Zkus to znovu.'
          this._failRun(runId, message)
        }
      } else {
        // Mock mode: compose child results into a delegation report
        const parentMeta = this._agentMeta.get(runId) ?? { name: 'Agent', role: 'Agent' }
        const childOutcomes: ChildRunOutcome[] = settledChildren.map((cr) => {
          const meta = this._agentMeta.get(cr.id) ?? { name: 'Agent', role: 'Agent' }
          return {
            agentName: meta.name,
            agentRole: meta.role,
            result: cr.result,
            error: cr.error,
          }
        })
        const composed = composeDelegatedResults(parentMeta.name, childOutcomes)
        this._resolveRun(runId, composed)
      }
    })()
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

  /**
   * Return all direct child runs of the given parent run.
   * Returns an empty array if the run has no children or does not exist.
   */
  getChildRuns(parentRunId: string): Run[] {
    return this.getAllRuns().filter((r) => r.parentRunId === parentRunId)
  }

  /**
   * Return the parent run of a child run, or undefined if the run has no parent
   * or the run does not exist.
   */
  getParentRun(childRunId: string): Run | undefined {
    const run = this._runs.get(childRunId)
    if (!run?.parentRunId) return undefined
    return this._runs.get(run.parentRunId)
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
   *
   * Delegates to `MockLLM.generateSync()` — the single source of truth for
   * mock response generation. When the run's `configSnapshot` includes a
   * `goal` or `persona`, MockLLM automatically switches to realistic generation
   * mode, producing contextual, goal-grounded, and persona-styled responses
   * even from the engine's built-in no-executor mock path.
   */
  private _completeRunWithMock(runId: string): void {
    const run = this._runs.get(runId)
    if (!run || run.status !== 'running') return

    const meta = this._agentMeta.get(runId) ?? { name: 'Agent', role: 'Agent' }

    // Use configSnapshot's goal and persona when available so that the built-in
    // mock path benefits from the same realistic generation as the MockLLM executor path.
    const snapshot = run.configSnapshot
    const mock = new MockLLM(meta.name, meta.role, run.taskDescription, {
      questionProbability: this._mockQuestionProbability,
      goal: snapshot?.goal,
      persona: snapshot?.persona,
    })

    const outcome = mock.generateSync()
    if (outcome.kind === 'question') {
      this._awaitRun(runId, outcome.text)
    } else {
      this._resolveRun(runId, outcome.text)
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
