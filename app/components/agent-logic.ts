// ---------------------------------------------------------------------------
// Agent state & pure update logic — no pixi.js dependency, safe to test
// ---------------------------------------------------------------------------

import type { AgentDef } from './agents-config'
import { MAP_CONFIG } from './grid-config'

const CELL = MAP_CONFIG.CELL_SIZE

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentState {
  id: string
  name: string
  role: string
  /** Fill colour as 0xRRGGBB */
  color: number
  /** World pixel X (container centre) */
  x: number
  /** World pixel Y (container centre) */
  y: number
  /** Current walk target — world pixel X */
  targetX: number
  /** Current walk target — world pixel Y */
  targetY: number
  /** Movement speed in px / second */
  speed: number
  /** Walk cycle timer in radians; incremented while moving */
  walkTime: number
  /** True when the agent is moving leftward */
  facingLeft: boolean
  /** Seconds remaining before the agent picks a new target */
  idleTimer: number
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Create an initial AgentState from a definition. Randomises speed & phase. */
export function createAgentState(def: AgentDef): AgentState {
  const x = (def.startCol + 0.5) * CELL
  const y = (def.startRow + 0.5) * CELL
  return {
    id: def.id,
    name: def.name,
    role: def.role,
    color: def.color,
    x,
    y,
    targetX: x,
    targetY: y,
    speed: 40 + Math.random() * 40,
    walkTime: Math.random() * Math.PI * 2,
    facingLeft: false,
    idleTimer: Math.random() * 3,
  }
}

// ---------------------------------------------------------------------------
// Update (pure function — no mutations)
// ---------------------------------------------------------------------------

/**
 * Advance the agent by `deltaMs` milliseconds.
 * Agents wander randomly within the world bounds (mapW × mapH px).
 */
export function updateAgent(
  state: AgentState,
  deltaMs: number,
  mapW: number,
  mapH: number,
): AgentState {
  const dt = deltaMs / 1000
  const dx = state.targetX - state.x
  const dy = state.targetY - state.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  let { x, y, targetX, targetY, facingLeft, walkTime, idleTimer } = state

  if (dist < 3) {
    // Reached destination — idle countdown then pick a new target
    idleTimer -= dt
    if (idleTimer <= 0) {
      const MARGIN = CELL * 2
      targetX = MARGIN + Math.random() * (mapW - MARGIN * 2)
      targetY = MARGIN + Math.random() * (mapH - MARGIN * 2)
      idleTimer = 1 + Math.random() * 4
    }
  } else {
    // Move toward target
    const nx = dx / dist
    const ny = dy / dist
    x += nx * state.speed * dt
    y += ny * state.speed * dt
    facingLeft = dx < 0
    walkTime += dt * 4 // walk-cycle angular speed
  }

  return { ...state, x, y, targetX, targetY, facingLeft, walkTime, idleTimer }
}

// ---------------------------------------------------------------------------
// Hit testing
// ---------------------------------------------------------------------------

/** Hit radius in world pixels (used for click detection). */
export const AGENT_HIT_RADIUS = 28

/**
 * Returns true if the world-space point (worldX, worldY) is within the
 * click-target radius of the agent.
 */
export function hitTestAgent(state: AgentState, worldX: number, worldY: number): boolean {
  const dx = worldX - state.x
  const dy = worldY - state.y
  return dx * dx + dy * dy < AGENT_HIT_RADIUS * AGENT_HIT_RADIUS
}
