// ---------------------------------------------------------------------------
// Run engine types — no pixi.js or React dependencies, safe to import anywhere
// ---------------------------------------------------------------------------

/** Life-cycle states a Run passes through. */
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed'

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
  /** Error description. Set only when status === 'failed'. */
  error?: string
}

/** Events emitted by the RunEngine. */
export type RunEventType = 'run:created' | 'run:started' | 'run:completed' | 'run:failed'

/** Callback invoked when a run event fires. */
export type RunEventHandler = (run: Run) => void

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
}
