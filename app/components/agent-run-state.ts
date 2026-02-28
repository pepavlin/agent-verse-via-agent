// ---------------------------------------------------------------------------
// Run animation state machine — pure functions, no pixi.js / React dependency
//
// Tracks the per-agent run animation state that drives two visual effects:
//   1. Pulse ring  — rendered while a run is in the 'running' state
//   2. Completion glow — rendered briefly after a run completes
//
// This module is intentionally free of side effects so every transition and
// tick calculation can be exercised in unit tests.
// ---------------------------------------------------------------------------

import { GLOW_DURATION_MS } from './agent-run-effects'

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

/**
 * Per-agent run animation state read each frame by the pixi ticker.
 *
 * - `runState === 'running'`       → pulse ring is rendered each frame
 * - `completionStart !== null`     → glow ring is rendered until it expires
 *
 * The two effects are mutually exclusive: starting a new run clears
 * `completionStart`, and completing a run clears `runState`.
 */
export interface AgentRunInfo {
  /** 'running' while a run is active; null when idle or completed. */
  runState: 'running' | null
  /** Timestamp (ms) when the latest run completed; null if no recent completion. */
  completionStart: number | null
  /** Accumulated seconds of running time — used as phase for the pulse effect. */
  runTime: number
}

// ---------------------------------------------------------------------------
// Factory functions — produce a fresh AgentRunInfo for each run lifecycle event
// ---------------------------------------------------------------------------

/**
 * Create initial run info when a run transitions to 'running'.
 * Clears any previous completion glow so the pulse starts cleanly.
 */
export function runStarted(): AgentRunInfo {
  return { runState: 'running', completionStart: null, runTime: 0 }
}

/**
 * Create run info when a run completes successfully.
 * Starts the completion glow timer and stops the pulse.
 *
 * @param now  Current timestamp in milliseconds (defaults to Date.now()).
 */
export function runCompleted(now: number = Date.now()): AgentRunInfo {
  return { runState: null, completionStart: now, runTime: 0 }
}

/**
 * Create run info when a run fails.
 * Clears all animation state — no glow is shown on failure.
 */
export function runFailed(): AgentRunInfo {
  return { runState: null, completionStart: null, runTime: 0 }
}

// ---------------------------------------------------------------------------
// Tick function — advances animation state by one frame
// ---------------------------------------------------------------------------

/** Output of a single animation tick. */
export interface TickResult {
  /**
   * Seconds elapsed since the run started.
   * Non-null only when `runState === 'running'`.
   * Pass this to `calcPulseRing()`.
   */
  runTime: number | null
  /**
   * Milliseconds elapsed since the run completed.
   * Non-null only while the glow animation is still active.
   * Pass this to `calcCompletionGlow()`.
   */
  completionAge: number | null
  /**
   * True when the glow has just expired this tick.
   * The caller should clear `completionStart` on the stored AgentRunInfo
   * (or ignore it — subsequent ticks will also see `glowExpired: true`).
   */
  glowExpired: boolean
}

/**
 * Advance the run animation by one ticker frame.
 *
 * This is a **pure** function — it does NOT mutate `runInfo`.  The caller is
 * responsible for updating `runInfo.runTime` if needed (see Grid2D ticker).
 *
 * @param runInfo      Current per-agent run animation state (may be undefined
 *                     if the agent has never had a run).
 * @param deltaSeconds Seconds elapsed since the last frame (ticker.deltaMS / 1000).
 * @param now          Current timestamp in milliseconds (Date.now()).
 * @param glowDurationMs  Optional override for glow duration (default: GLOW_DURATION_MS).
 * @returns            Derived animation parameters ready to pass to the draw functions.
 */
export function tickRunInfo(
  runInfo: AgentRunInfo | undefined,
  deltaSeconds: number,
  now: number,
  glowDurationMs: number = GLOW_DURATION_MS,
): TickResult {
  if (!runInfo) {
    return { runTime: null, completionAge: null, glowExpired: false }
  }

  let runTime: number | null = null
  let completionAge: number | null = null
  let glowExpired = false

  if (runInfo.runState === 'running') {
    // Accumulate run time for pulse phase
    runTime = runInfo.runTime + deltaSeconds
  }

  if (runInfo.completionStart !== null) {
    const age = now - runInfo.completionStart
    if (age < glowDurationMs) {
      completionAge = age
    } else {
      glowExpired = true
    }
  }

  return { runTime, completionAge, glowExpired }
}
