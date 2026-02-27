import { describe, it, expect } from 'vitest'
import { AGENTS } from '../app/components/agents-config'
import {
  createAgentState,
  updateAgent,
  hitTestAgent,
  agentInRect,
  AGENT_HIT_RADIUS,
  WorldRect,
} from '../app/components/agent-logic'
import { MAP_CONFIG } from '../app/components/grid-config'

const CELL = MAP_CONFIG.CELL_SIZE
const MAP_W = MAP_CONFIG.COLS * CELL
const MAP_H = MAP_CONFIG.ROWS * CELL

// ---------------------------------------------------------------------------
// agents-config
// ---------------------------------------------------------------------------

describe('AGENTS', () => {
  it('contains at least one agent', () => {
    expect(AGENTS.length).toBeGreaterThan(0)
  })

  it('every agent has a unique id', () => {
    const ids = AGENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every agent has a name and role', () => {
    for (const a of AGENTS) {
      expect(a.name.length).toBeGreaterThan(0)
      expect(a.role.length).toBeGreaterThan(0)
    }
  })

  it('every agent starts within the grid bounds', () => {
    for (const a of AGENTS) {
      expect(a.startCol).toBeGreaterThanOrEqual(0)
      expect(a.startCol).toBeLessThan(MAP_CONFIG.COLS)
      expect(a.startRow).toBeGreaterThanOrEqual(0)
      expect(a.startRow).toBeLessThan(MAP_CONFIG.ROWS)
    }
  })
})

// ---------------------------------------------------------------------------
// createAgentState
// ---------------------------------------------------------------------------

describe('createAgentState', () => {
  it('places the agent at the centre of its starting cell', () => {
    for (const def of AGENTS) {
      const state = createAgentState(def)
      expect(state.x).toBeCloseTo((def.startCol + 0.5) * CELL)
      expect(state.y).toBeCloseTo((def.startRow + 0.5) * CELL)
    }
  })

  it('sets target equal to starting position', () => {
    const state = createAgentState(AGENTS[0])
    expect(state.targetX).toBe(state.x)
    expect(state.targetY).toBe(state.y)
  })

  it('copies id, name, role and color from definition', () => {
    const def = AGENTS[0]
    const state = createAgentState(def)
    expect(state.id).toBe(def.id)
    expect(state.name).toBe(def.name)
    expect(state.role).toBe(def.role)
    expect(state.color).toBe(def.color)
  })

  it('has a positive speed', () => {
    const state = createAgentState(AGENTS[0])
    expect(state.speed).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// updateAgent
// ---------------------------------------------------------------------------

describe('updateAgent', () => {
  it('moves the agent toward its target', () => {
    const base = createAgentState(AGENTS[0])
    const state = { ...base, targetX: base.x + 200, targetY: base.y }
    const updated = updateAgent(state, 100, MAP_W, MAP_H)
    expect(updated.x).toBeGreaterThan(state.x)
  })

  it('does not overshoot the target within one large step', () => {
    const base = createAgentState(AGENTS[0])
    const target = { x: base.x + 5, y: base.y }
    const state = { ...base, targetX: target.x, targetY: target.y }
    // 10 second step — agent should not fly far past the target
    const updated = updateAgent(state, 10_000, MAP_W, MAP_H)
    // x should be within a reasonable range of the target (may have passed slightly)
    expect(Math.abs(updated.x - target.x)).toBeLessThan(base.speed * 10)
  })

  it('sets facingLeft when moving leftward', () => {
    const base = createAgentState(AGENTS[0])
    const state = { ...base, targetX: base.x - 200, targetY: base.y }
    const updated = updateAgent(state, 100, MAP_W, MAP_H)
    expect(updated.facingLeft).toBe(true)
  })

  it('sets facingLeft to false when moving rightward', () => {
    const base = createAgentState(AGENTS[0])
    const state = { ...base, targetX: base.x + 200, targetY: base.y }
    const updated = updateAgent(state, 100, MAP_W, MAP_H)
    expect(updated.facingLeft).toBe(false)
  })

  it('increments walkTime while moving', () => {
    const base = createAgentState(AGENTS[0])
    const state = { ...base, walkTime: 0, targetX: base.x + 200, targetY: base.y }
    const updated = updateAgent(state, 100, MAP_W, MAP_H)
    expect(updated.walkTime).toBeGreaterThan(0)
  })

  it('picks a new target when idleTimer expires', () => {
    const base = createAgentState(AGENTS[0])
    // Place agent at its target (dist < 3) with expired timer
    const state = { ...base, targetX: base.x, targetY: base.y, idleTimer: 0 }
    const updated = updateAgent(state, 1000, MAP_W, MAP_H)
    // Either targetX or targetY (or both) must differ from starting position
    const targetChanged = updated.targetX !== state.x || updated.targetY !== state.y
    expect(targetChanged).toBe(true)
  })

  it('does not change position when already at target and timer has not expired', () => {
    const base = createAgentState(AGENTS[0])
    const state = { ...base, targetX: base.x, targetY: base.y, idleTimer: 999 }
    const updated = updateAgent(state, 16, MAP_W, MAP_H)
    expect(updated.x).toBeCloseTo(state.x)
    expect(updated.y).toBeCloseTo(state.y)
  })
})

// ---------------------------------------------------------------------------
// hitTestAgent
// ---------------------------------------------------------------------------

describe('hitTestAgent', () => {
  it('detects a hit at the exact agent position', () => {
    const state = createAgentState(AGENTS[0])
    expect(hitTestAgent(state, state.x, state.y)).toBe(true)
  })

  it('detects a hit within the radius', () => {
    const state = createAgentState(AGENTS[0])
    const offset = AGENT_HIT_RADIUS - 1
    expect(hitTestAgent(state, state.x + offset, state.y)).toBe(true)
  })

  it('misses when the click is outside the radius', () => {
    const state = createAgentState(AGENTS[0])
    const offset = AGENT_HIT_RADIUS + 1
    expect(hitTestAgent(state, state.x + offset, state.y)).toBe(false)
  })

  it('misses when far away', () => {
    const state = createAgentState(AGENTS[0])
    expect(hitTestAgent(state, state.x + 200, state.y + 200)).toBe(false)
  })

  it('is symmetric (same result for all four cardinal offsets at boundary)', () => {
    const state = createAgentState(AGENTS[0])
    const r = AGENT_HIT_RADIUS - 1
    expect(hitTestAgent(state, state.x + r, state.y)).toBe(true)
    expect(hitTestAgent(state, state.x - r, state.y)).toBe(true)
    expect(hitTestAgent(state, state.x, state.y + r)).toBe(true)
    expect(hitTestAgent(state, state.x, state.y - r)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// agentInRect
// ---------------------------------------------------------------------------

describe('agentInRect', () => {
  function makeRect(x1: number, y1: number, x2: number, y2: number): WorldRect {
    return { x1, y1, x2, y2 }
  }

  it('returns true when agent centre is inside the rect', () => {
    const state = createAgentState(AGENTS[0])
    const rect = makeRect(state.x - 50, state.y - 50, state.x + 50, state.y + 50)
    expect(agentInRect(state, rect)).toBe(true)
  })

  it('returns true when agent centre is exactly on the rect boundary', () => {
    const state = createAgentState(AGENTS[0])
    const rect = makeRect(state.x, state.y, state.x + 100, state.y + 100)
    expect(agentInRect(state, rect)).toBe(true)
  })

  it('returns false when agent is to the left of the rect', () => {
    const state = createAgentState(AGENTS[0])
    const rect = makeRect(state.x + 10, state.y - 50, state.x + 100, state.y + 50)
    expect(agentInRect(state, rect)).toBe(false)
  })

  it('returns false when agent is to the right of the rect', () => {
    const state = createAgentState(AGENTS[0])
    const rect = makeRect(state.x - 100, state.y - 50, state.x - 10, state.y + 50)
    expect(agentInRect(state, rect)).toBe(false)
  })

  it('returns false when agent is above the rect', () => {
    const state = createAgentState(AGENTS[0])
    const rect = makeRect(state.x - 50, state.y + 10, state.x + 50, state.y + 100)
    expect(agentInRect(state, rect)).toBe(false)
  })

  it('returns false when agent is below the rect', () => {
    const state = createAgentState(AGENTS[0])
    const rect = makeRect(state.x - 50, state.y - 100, state.x + 50, state.y - 10)
    expect(agentInRect(state, rect)).toBe(false)
  })

  it('returns false for a zero-size rect that does not overlap the agent', () => {
    const state = createAgentState(AGENTS[0])
    const rect = makeRect(state.x + 100, state.y + 100, state.x + 100, state.y + 100)
    expect(agentInRect(state, rect)).toBe(false)
  })

  it('correctly selects only agents whose centres fall within the rect', () => {
    // Two agents at known positions
    const def0 = AGENTS[0]
    const def1 = AGENTS[1]
    const s0 = createAgentState(def0)
    const s1 = createAgentState(def1)

    // Rect that tightly wraps agent 0 but excludes agent 1
    const rect = makeRect(s0.x - 10, s0.y - 10, s0.x + 10, s0.y + 10)
    expect(agentInRect(s0, rect)).toBe(true)
    // Only expect false if agents are not coincident
    if (Math.abs(s0.x - s1.x) > 10 || Math.abs(s0.y - s1.y) > 10) {
      expect(agentInRect(s1, rect)).toBe(false)
    }
  })
})
