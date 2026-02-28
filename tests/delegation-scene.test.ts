import { describe, it, expect } from 'vitest'
import {
  PHASES,
  PHASE_MS,
  PHASE_TEXT,
  PHASE_TEXT_CS,
  MGR_BUBBLE_CS,
  WKR_BUBBLE_CS,
  type Phase,
  type SceneAgent,
  moveToward,
  isNear,
  nextPhase,
  phaseFraction,
  lerp,
  arcPoint,
} from '../app/components/delegation-logic'

// ---------------------------------------------------------------------------
// Phase definitions
// ---------------------------------------------------------------------------

describe('PHASES', () => {
  it('starts with idle', () => {
    expect(PHASES[0]).toBe('idle')
  })

  it('ends with celebrating', () => {
    expect(PHASES[PHASES.length - 1]).toBe('celebrating')
  })

  it('contains exactly 10 distinct phases', () => {
    expect(PHASES.length).toBe(10)
    expect(new Set(PHASES).size).toBe(10)
  })
})

describe('PHASE_MS', () => {
  it('has a positive duration for every phase', () => {
    for (const phase of PHASES) {
      expect(PHASE_MS[phase]).toBeGreaterThan(0)
    }
  })

  it('has an entry for every phase in PHASES', () => {
    for (const phase of PHASES) {
      expect(PHASE_MS[phase]).toBeDefined()
    }
  })
})

describe('PHASE_TEXT', () => {
  it('has a non-empty label for every phase', () => {
    for (const phase of PHASES) {
      expect(PHASE_TEXT[phase].trim().length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// nextPhase
// ---------------------------------------------------------------------------

describe('nextPhase', () => {
  it('advances from idle to calling', () => {
    expect(nextPhase('idle')).toBe('calling')
  })

  it('wraps from celebrating back to idle', () => {
    expect(nextPhase('celebrating')).toBe('idle')
  })

  it('cycles through all phases in order', () => {
    let phase: Phase = 'idle'
    const visited: Phase[] = [phase]
    for (let i = 0; i < PHASES.length - 1; i++) {
      phase = nextPhase(phase)
      visited.push(phase)
    }
    expect(visited).toEqual(PHASES)
  })
})

// ---------------------------------------------------------------------------
// phaseFraction
// ---------------------------------------------------------------------------

describe('phaseFraction', () => {
  it('returns 0 at the start', () => {
    expect(phaseFraction('idle', 0)).toBe(0)
  })

  it('returns 0.5 at the midpoint', () => {
    expect(phaseFraction('idle', PHASE_MS['idle'] / 2)).toBeCloseTo(0.5)
  })

  it('returns 1 at the end', () => {
    expect(phaseFraction('idle', PHASE_MS['idle'])).toBe(1)
  })

  it('clamps to 1 when elapsed exceeds duration', () => {
    expect(phaseFraction('idle', PHASE_MS['idle'] * 2)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// moveToward
// ---------------------------------------------------------------------------

const makeAgent = (x: number, y: number): SceneAgent => ({
  id: 'test',
  name: 'Test',
  role: 'Tester',
  color: 0xffffff,
  x, y,
  targetX: x, targetY: y,
  speed: 100,
  walkTime: 0,
  facingLeft: false,
  idleTimer: 0,
})

describe('moveToward', () => {
  it('moves agent toward target', () => {
    const agent = makeAgent(0, 0)
    const moved = moveToward(agent, 100, 0, 1000) // 1 second at speed 100
    expect(moved.x).toBeCloseTo(100)
    expect(moved.y).toBeCloseTo(0)
  })

  it('does not overshoot the target', () => {
    const agent = makeAgent(0, 0)
    const moved = moveToward(agent, 50, 0, 1000) // target is 50 px, but speed*dt = 100
    expect(moved.x).toBeCloseTo(50)
  })

  it('sets facingLeft when moving left', () => {
    const agent = makeAgent(100, 0)
    const moved = moveToward(agent, 0, 0, 100)
    expect(moved.facingLeft).toBe(true)
  })

  it('sets facingLeft=false when moving right', () => {
    const agent = makeAgent(0, 0)
    const moved = moveToward(agent, 100, 0, 100)
    expect(moved.facingLeft).toBe(false)
  })

  it('increments walkTime while moving', () => {
    const agent = makeAgent(0, 0)
    const moved = moveToward(agent, 500, 0, 220)
    expect(moved.walkTime).toBeGreaterThan(agent.walkTime)
  })

  it('returns agent at target when already there', () => {
    const agent = makeAgent(5, 5)
    const moved = moveToward(agent, 5, 5, 100)
    expect(moved.x).toBeCloseTo(5)
    expect(moved.y).toBeCloseTo(5)
  })

  it('does not mutate the original agent', () => {
    const agent = makeAgent(0, 0)
    moveToward(agent, 100, 0, 500)
    expect(agent.x).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// isNear
// ---------------------------------------------------------------------------

describe('isNear', () => {
  it('returns true when agent is at target', () => {
    const agent = makeAgent(50, 50)
    expect(isNear(agent, 50, 50)).toBe(true)
  })

  it('returns true when within 5 px', () => {
    const agent = makeAgent(50, 50)
    expect(isNear(agent, 54, 50)).toBe(true)
  })

  it('returns false when more than 5 px away', () => {
    const agent = makeAgent(0, 0)
    expect(isNear(agent, 10, 0)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// lerp
// ---------------------------------------------------------------------------

describe('lerp', () => {
  it('returns a at t=0', () => expect(lerp(10, 20, 0)).toBe(10))
  it('returns b at t=1', () => expect(lerp(10, 20, 1)).toBe(20))
  it('returns midpoint at t=0.5', () => expect(lerp(10, 20, 0.5)).toBe(15))
})

// ---------------------------------------------------------------------------
// arcPoint
// ---------------------------------------------------------------------------

describe('arcPoint', () => {
  it('returns from-position at t=0', () => {
    const pt = arcPoint(0, 0, 100, 0, 0)
    expect(pt.x).toBeCloseTo(0)
    expect(pt.y).toBeCloseTo(0)
  })

  it('returns to-position at t=1', () => {
    const pt = arcPoint(0, 0, 100, 0, 1)
    expect(pt.x).toBeCloseTo(100)
    expect(pt.y).toBeCloseTo(0)
  })

  it('rises above the straight line at t=0.5', () => {
    // Arc height is 80 by default, sin(0.5*PI)=1
    const pt = arcPoint(0, 0, 100, 0, 0.5, 80)
    expect(pt.x).toBeCloseTo(50)
    expect(pt.y).toBeCloseTo(-80) // upward (negative y)
  })
})

// ---------------------------------------------------------------------------
// Czech localisation (PHASE_TEXT_CS, MGR_BUBBLE_CS, WKR_BUBBLE_CS)
// ---------------------------------------------------------------------------

describe('PHASE_TEXT_CS', () => {
  it('has a non-empty Czech label for every phase', () => {
    for (const phase of PHASES) {
      expect(PHASE_TEXT_CS[phase].trim().length).toBeGreaterThan(0)
    }
  })

  it('is distinct from the English version for every phase', () => {
    for (const phase of PHASES) {
      expect(PHASE_TEXT_CS[phase]).not.toBe(PHASE_TEXT[phase])
    }
  })

  it('contains Czech characters', () => {
    const allText = Object.values(PHASE_TEXT_CS).join(' ')
    // Basic check for diacritics common in Czech
    expect(allText).toMatch(/[áéíóúůěščřžýďťňÁÉÍÓÚŮĚŠČŘŽÝĎŤŇ]/)
  })
})

describe('MGR_BUBBLE_CS', () => {
  it('has an entry for idle (question mark or similar)', () => {
    expect(MGR_BUBBLE_CS.idle).toBeDefined()
    expect((MGR_BUBBLE_CS.idle ?? '').length).toBeGreaterThan(0)
  })

  it('has an entry for calling phase', () => {
    expect(MGR_BUBBLE_CS.calling).toBeDefined()
  })

  it('has an entry for briefing phase', () => {
    expect(MGR_BUBBLE_CS.briefing).toBeDefined()
    // Should mention the task location
    expect(MGR_BUBBLE_CS.briefing).toMatch(/Sektor/i)
  })

  it('has an entry for celebrating phase', () => {
    expect(MGR_BUBBLE_CS.celebrating).toBeDefined()
  })
})

describe('WKR_BUBBLE_CS', () => {
  it('has an entry for acknowledging phase', () => {
    expect(WKR_BUBBLE_CS.acknowledging).toBeDefined()
    expect((WKR_BUBBLE_CS.acknowledging ?? '').length).toBeGreaterThan(0)
  })

  it('has an entry for working phase', () => {
    expect(WKR_BUBBLE_CS.working).toBeDefined()
  })

  it('has an entry for completing phase', () => {
    expect(WKR_BUBBLE_CS.completing).toBeDefined()
    // Should contain a checkmark
    expect(WKR_BUBBLE_CS.completing).toMatch(/\u2713|✓/)
  })

  it('has an entry for celebrating phase', () => {
    expect(WKR_BUBBLE_CS.celebrating).toBeDefined()
  })
})
