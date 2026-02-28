// ---------------------------------------------------------------------------
// Rune animation math — pure functions, no pixi.js dependency
//
// Runes are Elder Futhark glyphs that orbit around an agent's head while a
// task is running. They pulse (alpha + scale oscillation) during execution
// and flash outward briefly when the task completes.
//
// All functions are side-effect-free and fully testable.
// ---------------------------------------------------------------------------

// Elder Futhark Unicode characters used for the visual effect.
// Each agent shows RUNE_COUNT of these, cycling from the start of the array.
export const RUNE_CHARS = ['ᚠ', 'ᚱ', 'ᚾ', 'ᛏ', 'ᛊ', 'ᛒ', 'ᚷ', 'ᛗ']

/** Number of rune glyphs orbiting each agent simultaneously. */
export const RUNE_COUNT = 4

/** Head-centre Y offset in container space (must match agent-drawing.ts). */
export const HEAD_Y = -21

/** Orbital radius from the head centre (world pixels). */
export const RUNE_ORBIT_RADIUS = 26

/** Angular velocity of the orbit (radians per second). */
export const RUNE_ORBIT_SPEED = 0.7

/** Pulse oscillation frequency (radians per second). */
export const RUNE_PULSE_FREQ = 2.0

/** Base text scale factor. */
export const RUNE_BASE_SCALE = 1.0

/** Amplitude of the scale oscillation (±). */
export const RUNE_SCALE_AMPLITUDE = 0.2

/** Minimum alpha while pulsing (running state). */
export const RUNE_ALPHA_MIN = 0.25

/** Maximum alpha while pulsing (running state). */
export const RUNE_ALPHA_MAX = 0.85

/** Total duration of the completion flash in milliseconds. */
export const RUNE_FLASH_DURATION_MS = 1_000

/** Radius expansion during the flash (world pixels beyond orbit radius). */
export const RUNE_FLASH_EXPANSION = 22

// ---------------------------------------------------------------------------
// Shared output shape
// ---------------------------------------------------------------------------

export interface RuneState {
  /** X position relative to the agent container origin (world pixels). */
  x: number
  /** Y position relative to the agent container origin (world pixels). */
  y: number
  /** Opacity (0–1). */
  alpha: number
  /** Uniform scale factor. */
  scale: number
  /** Whether the rune should be rendered at all. */
  visible: boolean
  /** Tint colour (0xRRGGBB). */
  tint: number
}

// ---------------------------------------------------------------------------
// Running state: orbiting pulse
// ---------------------------------------------------------------------------

/**
 * Calculate the position and appearance of one orbiting rune while an agent
 * is actively running a task.
 *
 * @param runeIndex   Zero-based index of this rune within the set.
 * @param totalRunes  Total number of runes orbiting this agent.
 * @param runTime     Elapsed seconds since the run started.
 * @param agentColor  Agent colour (0xRRGGBB) — used as the rune tint.
 * @returns           Rendering state for this rune for the current frame.
 */
export function calcRuneOrbit(
  runeIndex: number,
  totalRunes: number,
  runTime: number,
  agentColor: number,
): RuneState {
  // Each rune starts at an evenly-distributed angle, then orbits over time.
  const baseAngle = (runeIndex / totalRunes) * Math.PI * 2
  const angle = baseAngle + runTime * RUNE_ORBIT_SPEED

  const x = Math.cos(angle) * RUNE_ORBIT_RADIUS
  const y = HEAD_Y + Math.sin(angle) * RUNE_ORBIT_RADIUS

  // Stagger pulse phase so runes don't all blink in unison.
  const phaseOffset = (runeIndex / totalRunes) * Math.PI * 2
  const pulseFactor = Math.sin(runTime * RUNE_PULSE_FREQ + phaseOffset)

  // Map pulseFactor (-1…+1) to alpha range [RUNE_ALPHA_MIN, RUNE_ALPHA_MAX]
  const alpha = RUNE_ALPHA_MIN + ((pulseFactor + 1) / 2) * (RUNE_ALPHA_MAX - RUNE_ALPHA_MIN)
  const scale = RUNE_BASE_SCALE + pulseFactor * RUNE_SCALE_AMPLITUDE

  return { x, y, alpha, scale, visible: true, tint: agentColor }
}

// ---------------------------------------------------------------------------
// Completion state: flash outward
// ---------------------------------------------------------------------------

/**
 * Calculate the position and appearance of one rune during the brief
 * completion flash that plays after a task finishes.
 *
 * Each rune expands outward from the orbit radius at a fixed angle (evenly
 * distributed), fading to zero alpha over {@link RUNE_FLASH_DURATION_MS} ms.
 *
 * @param completionAge  Milliseconds elapsed since the run completed.
 * @param runeIndex      Zero-based index of this rune.
 * @param totalRunes     Total number of runes.
 * @returns              Rendering state for this rune for the current frame.
 */
export function calcRuneFlash(
  completionAge: number,
  runeIndex: number,
  totalRunes: number,
): RuneState {
  const inactive: RuneState = {
    x: 0,
    y: HEAD_Y,
    alpha: 0,
    scale: 1,
    visible: false,
    tint: 0xffffff,
  }

  if (completionAge < 0 || completionAge >= RUNE_FLASH_DURATION_MS) {
    return inactive
  }

  const progress = completionAge / RUNE_FLASH_DURATION_MS

  // Fixed evenly-distributed angle — no more orbiting during the flash.
  const angle = (runeIndex / totalRunes) * Math.PI * 2

  // Expand radius linearly as the flash progresses.
  const radius = RUNE_ORBIT_RADIUS + progress * RUNE_FLASH_EXPANSION
  const x = Math.cos(angle) * radius
  const y = HEAD_Y + Math.sin(angle) * radius

  // Quick rise to full brightness (first 15 %), then fade to zero.
  const alpha =
    progress < 0.15
      ? progress / 0.15
      : 1 - (progress - 0.15) / 0.85

  // Scale up slightly for a more dramatic burst.
  const scale = 1 + progress * 0.5

  return {
    x,
    y,
    alpha: Math.max(0, alpha),
    scale,
    visible: true,
    tint: 0xffffff,
  }
}
