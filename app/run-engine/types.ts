// ---------------------------------------------------------------------------
// Run engine types — no pixi.js or React dependencies, safe to import anywhere
// ---------------------------------------------------------------------------

/**
 * Life-cycle states a Run passes through.
 *
 * - 'pending'   — created, not yet started
 * - 'running'   — currently executing
 * - 'completed' — finished with a result
 * - 'awaiting'  — paused, agent asked a clarifying question; can be resumed via resumeRun()
 * - 'failed'    — terminated with an error
 */
export type RunStatus = 'pending' | 'running' | 'completed' | 'awaiting' | 'failed'

/** A single task execution record. */
export interface Run {
  /** Unique run identifier. */
  id: string
  /** ID of the agent executing this run. */
  agentId: string
  /** Human-readable description of the task. */
  taskDescription: string
  /** Current lifecycle state. */
  status: RunStatus
  /** Unix timestamp (ms) when the run was created. */
  createdAt: number
  /** Unix timestamp (ms) when the run transitioned to 'running'. Undefined until started. */
  startedAt?: number
  /** Unix timestamp (ms) when the run reached a terminal state. Undefined until finished. */
  completedAt?: number
  /** Plain-prose result text. Set only when status === 'completed'. */
  result?: string
  /**
   * Clarifying question raised by the agent. Set only when status === 'awaiting'.
   * The agent needs a human answer before it can continue via resumeRun().
   */
  question?: string
  /**
   * User's answer to the agent's clarifying question. Set when the run is resumed
   * after being in 'awaiting' state.
   */
  answer?: string
  /** Error description. Set only when status === 'failed'. */
  error?: string
}

/** Events emitted by the RunEngine. */
export type RunEventType =
  | 'run:created'
  | 'run:started'
  | 'run:completed'
  | 'run:awaiting'
  | 'run:resumed'
  | 'run:failed'

/** Callback invoked when a run event fires. */
export type RunEventHandler = (run: Run) => void

/**
 * Structured response returned by a MockLLM executor.
 *
 * - `{ kind: 'result'; text: string }` — the simulated agent completed the task.
 *   The RunEngine will transition the run to 'completed' and store `text` as the result.
 * - `{ kind: 'question'; text: string }` — the simulated agent needs clarification.
 *   The RunEngine will transition the run to 'awaiting' and store `text` as the question.
 *
 * When a RunExecutor returns a plain `string` (legacy / real-LLM path), the engine
 * treats it as a result and transitions to 'completed' — this ensures full backward
 * compatibility with existing executor implementations.
 */
export type MockLLMResponse =
  | { kind: 'result'; text: string }
  | { kind: 'question'; text: string }

/** Optional constructor configuration for RunEngine. */
export interface RunEngineOptions {
  /** Minimum execution delay in milliseconds (default: 2000). */
  minDelayMs?: number
  /** Maximum execution delay in milliseconds (default: 6000). */
  maxDelayMs?: number
  /**
   * Custom delay calculator. Receives min and max and returns the actual delay in ms.
   * Defaults to a uniform random value in [minDelayMs, maxDelayMs].
   * Override in tests to control timing deterministically.
   */
  delayFn?: (minMs: number, maxMs: number) => number
  /**
   * Probability that a mock run (no executor) will produce a clarifying question
   * instead of a result. Must be in the range [0, 1].
   * Default: 0.3 (30% chance of asking a question).
   */
  mockQuestionProbability?: number
}
