// ---------------------------------------------------------------------------
// Run-state visual effect calculations — pure functions, no pixi.js dependency
//
// These functions compute the rendering parameters for the two run-state
// effects applied to agents in the 2D world:
//   1. Pulse ring  — visible while a run is in the 'running' state
//   2. Completion glow — a brief bright flash when a run completes
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pulse ring (shown while agent is running)
// ---------------------------------------------------------------------------

/** Frequency of the pulse oscillation in radians per second. */
export const PULSE_FREQ = 2.5

/** Base radius offset beyond the head radius (world pixels). */
export const PULSE_BASE_OFFSET = 7

/** Amplitude of the radius oscillation (world pixels). */
export const PULSE_RADIUS_AMPLITUDE = 3

/** Mid-point alpha for the pulsing ring. */
export const PULSE_ALPHA_MID = 0.45

/** Amplitude of the alpha oscillation. */
export const PULSE_ALPHA_AMPLITUDE = 0.25

export interface PulseParams {
  /** Offset from head centre to ring edge (world pixels). Add to HEAD_R. */
  radiusOffset: number
  /** Stroke alpha for the ring (0–1). */
  alpha: number
}

/**
 * Calculate the current pulse ring parameters for an agent that is running.
 *
 * @param runTime  Elapsed time in **seconds** since the run started.
 * @param headR    Head radius in world pixels (used to scale the ring).
 * @returns        Rendering parameters for the pulse ring.
 */
export function calcPulseRing(runTime: number, headR: number): PulseParams {
  const phase = runTime * PULSE_FREQ
  const radiusOffset = headR + PULSE_BASE_OFFSET + Math.sin(phase) * PULSE_RADIUS_AMPLITUDE
  const alpha = PULSE_ALPHA_MID + Math.sin(phase) * PULSE_ALPHA_AMPLITUDE
  return { radiusOffset, alpha }
}

// ---------------------------------------------------------------------------
// Completion glow (shown briefly after a run completes)
// ---------------------------------------------------------------------------

/** Total duration of the completion glow in milliseconds. */
export const GLOW_DURATION_MS = 1_500

/** Initial radius offset for the expanding glow ring (world pixels). */
export const GLOW_INITIAL_OFFSET = 5

/** Total expansion of the glow ring over its lifetime (world pixels). */
export const GLOW_EXPANSION = 28

/** Maximum alpha at glow start. */
export const GLOW_MAX_ALPHA = 0.85

export interface GlowParams {
  /** Whether the glow should be rendered at all. */
  active: boolean
  /** Offset from head centre (world pixels). Add to HEAD_R. */
  radiusOffset: number
  /** Fill/stroke alpha (0–1). */
  alpha: number
  /** Stroke width in world pixels. */
  strokeWidth: number
}

/**
 * Calculate the current completion glow parameters.
 *
 * @param completionAge  Milliseconds elapsed since the run completed.
 * @param glowDurationMs Duration of the full glow animation (default: {@link GLOW_DURATION_MS}).
 * @returns              Rendering parameters for the completion glow.
 */
export function calcCompletionGlow(
  completionAge: number,
  glowDurationMs: number = GLOW_DURATION_MS,
): GlowParams {
  if (completionAge < 0 || completionAge >= glowDurationMs) {
    return { active: false, radiusOffset: 0, alpha: 0, strokeWidth: 0 }
  }

  const progress = completionAge / glowDurationMs
  const radiusOffset = GLOW_INITIAL_OFFSET + progress * GLOW_EXPANSION
  const alpha = GLOW_MAX_ALPHA * (1 - progress)
  const strokeWidth = Math.max(1, 3 - progress * 2)

  return { active: true, radiusOffset, alpha, strokeWidth }
}
