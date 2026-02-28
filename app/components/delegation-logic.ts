// ---------------------------------------------------------------------------
// Delegation scene logic — pure functions, no pixi.js dependency
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Phase definitions
// ---------------------------------------------------------------------------

export type Phase =
  | 'idle'
  | 'calling'
  | 'meeting'
  | 'briefing'
  | 'acknowledging'
  | 'executing'
  | 'working'
  | 'completing'
  | 'reporting'
  | 'celebrating'

export const PHASES: Phase[] = [
  'idle',
  'calling',
  'meeting',
  'briefing',
  'acknowledging',
  'executing',
  'working',
  'completing',
  'reporting',
  'celebrating',
]

export const PHASE_MS: Record<Phase, number> = {
  idle: 3000,
  calling: 2000,
  meeting: 2200,
  briefing: 3500,
  acknowledging: 2200,
  executing: 3200,
  working: 2800,
  completing: 2200,
  reporting: 2500,
  celebrating: 3000,
}

export const PHASE_TEXT: Record<Phase, string> = {
  idle: 'Manager identifies a task that needs attention...',
  calling: 'Manager signals the worker',
  meeting: 'Worker approaches the manager',
  briefing: 'Manager delegates: "Build the bridge at Sector 7!"',
  acknowledging: 'Worker: "Understood! I\'m on it!"',
  executing: 'Worker heads to the task location',
  working: 'Worker executes the delegated task...',
  completing: 'Task completed successfully!',
  reporting: 'Worker reports back to manager',
  celebrating: 'Manager: "Excellent work!"',
}

/** Czech subtitles shown below each phase label in the bar. */
export const PHASE_TEXT_CS: Record<Phase, string> = {
  idle: 'Manažer zjistí, co je třeba udělat...',
  calling: 'Manažer zavolá pracovníka',
  meeting: 'Pracovník přichází za manažerem',
  briefing: 'Manažer deleguje úkol: "Postav most v Sektoru 7!"',
  acknowledging: 'Pracovník: "Rozumím! Jdu na to!"',
  executing: 'Pracovník se vydává k místu úkolu',
  working: 'Pracovník plní delegovaný úkol...',
  completing: 'Úkol úspěšně splněn!',
  reporting: 'Pracovník se vrací s hlášením',
  celebrating: 'Manažer: "Výborná práce!"',
}

/** Czech speech-bubble texts for the Manager per phase (empty = no bubble). */
export const MGR_BUBBLE_CS: Partial<Record<Phase, string>> = {
  idle: '?',
  calling: 'Hej! Potřebuji\ntvou pomoc!',
  briefing: 'Postav most\nv Sektoru 7!',
  celebrating: 'Výborná práce!',
}

/** Czech speech-bubble texts for the Worker per phase (empty = no bubble). */
export const WKR_BUBBLE_CS: Partial<Record<Phase, string>> = {
  acknowledging: 'Rozumím!\nJdu na to!',
  working: 'Pracuji',
  completing: 'Hotovo! \u2713',
  celebrating: 'Připraven na\ndalší úkol!',
}

// ---------------------------------------------------------------------------
// Scene agent (position + animation state)
// ---------------------------------------------------------------------------

export interface SceneAgent {
  id: string
  name: string
  role: string
  /** Fill colour as 0xRRGGBB */
  color: number
  /** World X position */
  x: number
  /** World Y position */
  y: number
  /** Walk target X */
  targetX: number
  /** Walk target Y */
  targetY: number
  /** Movement speed in px/s */
  speed: number
  /** Walk cycle angle in radians */
  walkTime: number
  /** True when moving left */
  facingLeft: boolean
  /** Unused idle countdown (satisfies AgentState interface) */
  idleTimer: number
  /** Optional goal text */
  goal?: string
  /** Optional persona text */
  persona?: string
}

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------

/**
 * Move `agent` toward (tx, ty) at agent.speed px/s.
 * Returns a new SceneAgent; does not mutate the original.
 */
export function moveToward(
  agent: SceneAgent,
  tx: number,
  ty: number,
  dt: number,
): SceneAgent {
  const dx = tx - agent.x
  const dy = ty - agent.y
  const dist = Math.hypot(dx, dy)
  if (dist < 3) {
    return { ...agent, x: tx, y: ty }
  }
  const step = agent.speed * (dt / 1000)
  const capped = Math.min(step, dist)
  return {
    ...agent,
    x: agent.x + (dx / dist) * capped,
    y: agent.y + (dy / dist) * capped,
    facingLeft: dx < 0,
    walkTime: agent.walkTime + dt / 220,
  }
}

/** Returns true when agent is within 5 px of (tx, ty). */
export function isNear(agent: SceneAgent, tx: number, ty: number): boolean {
  return Math.hypot(agent.x - tx, agent.y - ty) < 5
}

// ---------------------------------------------------------------------------
// Phase sequencing
// ---------------------------------------------------------------------------

/** Returns the next phase after `current`, wrapping around to `idle`. */
export function nextPhase(current: Phase): Phase {
  const idx = PHASES.indexOf(current)
  return PHASES[(idx + 1) % PHASES.length]
}

/** Returns elapsed fraction (0–1) for how far through a phase we are. */
export function phaseFraction(phase: Phase, elapsedMs: number): number {
  return Math.min(1, elapsedMs / PHASE_MS[phase])
}

// ---------------------------------------------------------------------------
// Delegation arc path
// ---------------------------------------------------------------------------

/** Interpolate linearly */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// ---------------------------------------------------------------------------
// Rune animation state for the delegation scene
// ---------------------------------------------------------------------------

/**
 * Animation parameters derived from the current delegation phase.
 *
 * Mirrors the `runTime` / `completionAge` convention used by the main Grid2D
 * world so that the same `calcRuneOrbit`, `calcRuneFlash`, `calcPulseRing`,
 * and `calcCompletionGlow` pure helpers can be reused without modification.
 */
export interface DelegationRuneState {
  /**
   * Seconds elapsed since the worker started executing the task.
   * Non-null only during the `working` phase.
   * Pass this to `calcRuneOrbit` and `calcPulseRing`.
   */
  runTime: number | null
  /**
   * Milliseconds elapsed since the worker completed the task.
   * Non-null only during the `completing` phase.
   * Pass this to `calcRuneFlash` and `calcCompletionGlow`.
   */
  completionAge: number | null
}

/**
 * Map the current delegation phase to rune / pulse / glow animation params.
 *
 * - `working`    → pulse ring + orbiting runes (runTime = phaseMs / 1000 s)
 * - `completing` → glow ring + expanding rune flash (completionAge = phaseMs ms)
 * - everything else → both null (no effects)
 *
 * @param phase    Current scene phase.
 * @param phaseMs  Milliseconds elapsed in this phase.
 */
export function calcDelegationRuneState(
  phase: Phase,
  phaseMs: number,
): DelegationRuneState {
  if (phase === 'working') {
    return { runTime: phaseMs / 1000, completionAge: null }
  }
  if (phase === 'completing') {
    return { runTime: null, completionAge: phaseMs }
  }
  return { runTime: null, completionAge: null }
}

// ---------------------------------------------------------------------------
// Delegation arc path
// ---------------------------------------------------------------------------

/**
 * Compute the position of the flying task card on its arc from (fromX, fromY)
 * to (toX, toY).
 *
 * @param t     Progress 0–1
 * @param arcH  Peak height of the arc in pixels (positive = upward)
 */
export function arcPoint(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  t: number,
  arcH = 80,
): { x: number; y: number } {
  return {
    x: lerp(fromX, toX, t),
    y: lerp(fromY, toY, t) - Math.sin(t * Math.PI) * arcH,
  }
}
