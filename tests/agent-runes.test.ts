import { describe, it, expect } from 'vitest'
import {
  calcRuneOrbit,
  calcRuneFlash,
  calcRuneDisplayScale,
  RUNE_CHARS,
  RUNE_COUNT,
  RUNE_ORBIT_RADIUS,
  RUNE_ORBIT_SPEED,
  RUNE_PULSE_FREQ,
  RUNE_ALPHA_MIN,
  RUNE_ALPHA_MAX,
  RUNE_BASE_SCALE,
  RUNE_SCALE_AMPLITUDE,
  RUNE_FLASH_DURATION_MS,
  RUNE_FLASH_EXPANSION,
  HEAD_Y,
} from '../app/components/agent-runes'

// ---------------------------------------------------------------------------
// Constants sanity checks
// ---------------------------------------------------------------------------

describe('RUNE_CHARS and RUNE_COUNT', () => {
  it('RUNE_CHARS has at least RUNE_COUNT entries', () => {
    expect(RUNE_CHARS.length).toBeGreaterThanOrEqual(RUNE_COUNT)
  })

  it('RUNE_COUNT is a positive integer', () => {
    expect(RUNE_COUNT).toBeGreaterThan(0)
    expect(Number.isInteger(RUNE_COUNT)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// calcRuneOrbit
// ---------------------------------------------------------------------------

describe('calcRuneOrbit', () => {
  const agentColor = 0xff6b6b

  it('returns visible = true while running', () => {
    const result = calcRuneOrbit(0, RUNE_COUNT, 1, agentColor)
    expect(result.visible).toBe(true)
  })

  it('tint matches agentColor', () => {
    const result = calcRuneOrbit(0, RUNE_COUNT, 1, agentColor)
    expect(result.tint).toBe(agentColor)
  })

  it('at runTime=0, runeIndex=0: x ≈ ORBIT_RADIUS and y ≈ HEAD_Y (angle=0)', () => {
    // baseAngle = 0, runTime = 0 → angle = 0
    // x = cos(0) * ORBIT_RADIUS = ORBIT_RADIUS
    // y = HEAD_Y + sin(0) * ORBIT_RADIUS = HEAD_Y
    const result = calcRuneOrbit(0, 4, 0, agentColor)
    expect(result.x).toBeCloseTo(RUNE_ORBIT_RADIUS)
    expect(result.y).toBeCloseTo(HEAD_Y)
  })

  it('position changes over time (rune is moving)', () => {
    const r0 = calcRuneOrbit(0, RUNE_COUNT, 0, agentColor)
    const r1 = calcRuneOrbit(0, RUNE_COUNT, 1, agentColor)
    // After 1 second at RUNE_ORBIT_SPEED the angle has changed
    expect(r0.x).not.toBeCloseTo(r1.x, 2)
  })

  it('different rune indices are at different positions at the same time', () => {
    const r0 = calcRuneOrbit(0, 4, 0, agentColor)
    const r1 = calcRuneOrbit(1, 4, 0, agentColor)
    const r2 = calcRuneOrbit(2, 4, 0, agentColor)
    const r3 = calcRuneOrbit(3, 4, 0, agentColor)

    // Positions should differ
    expect(r0.x).not.toBeCloseTo(r1.x, 2)
    expect(r1.x).not.toBeCloseTo(r2.x, 2)
    expect(r2.x).not.toBeCloseTo(r3.x, 2)
  })

  it('rune stays on the orbit circle (distance from head centre ≈ ORBIT_RADIUS)', () => {
    for (let t = 0; t <= 10; t += 0.25) {
      const { x, y } = calcRuneOrbit(0, RUNE_COUNT, t, agentColor)
      const dist = Math.hypot(x, y - HEAD_Y)
      expect(dist).toBeCloseTo(RUNE_ORBIT_RADIUS, 4)
    }
  })

  it('alpha stays within [RUNE_ALPHA_MIN, RUNE_ALPHA_MAX]', () => {
    for (let t = 0; t <= 10; t += 0.1) {
      const { alpha } = calcRuneOrbit(0, RUNE_COUNT, t, agentColor)
      expect(alpha).toBeGreaterThanOrEqual(RUNE_ALPHA_MIN - 0.001)
      expect(alpha).toBeLessThanOrEqual(RUNE_ALPHA_MAX + 0.001)
    }
  })

  it('scale stays within [BASE - AMPLITUDE, BASE + AMPLITUDE]', () => {
    for (let t = 0; t <= 10; t += 0.1) {
      const { scale } = calcRuneOrbit(0, RUNE_COUNT, t, agentColor)
      expect(scale).toBeGreaterThanOrEqual(RUNE_BASE_SCALE - RUNE_SCALE_AMPLITUDE - 0.001)
      expect(scale).toBeLessThanOrEqual(RUNE_BASE_SCALE + RUNE_SCALE_AMPLITUDE + 0.001)
    }
  })

  it('orbit speed matches RUNE_ORBIT_SPEED — angle after 1 s equals ORBIT_SPEED rad', () => {
    // runeIndex=0: baseAngle=0, angle at t=1 = RUNE_ORBIT_SPEED
    const r = calcRuneOrbit(0, RUNE_COUNT, 1, agentColor)
    const expectedX = Math.cos(RUNE_ORBIT_SPEED) * RUNE_ORBIT_RADIUS
    const expectedY = HEAD_Y + Math.sin(RUNE_ORBIT_SPEED) * RUNE_ORBIT_RADIUS
    expect(r.x).toBeCloseTo(expectedX, 4)
    expect(r.y).toBeCloseTo(expectedY, 4)
  })

  it('pulse frequency drives alpha — at the frequency peak alpha approaches RUNE_ALPHA_MAX', () => {
    // Peak of sin = 1 when runTime * PULSE_FREQ = π/2
    const tPeak = Math.PI / 2 / RUNE_PULSE_FREQ
    const { alpha } = calcRuneOrbit(0, RUNE_COUNT, tPeak, agentColor)
    expect(alpha).toBeCloseTo(RUNE_ALPHA_MAX, 3)
  })

  it('pulse frequency drives alpha — at trough alpha approaches RUNE_ALPHA_MIN', () => {
    // Trough of sin = -1 when runTime * PULSE_FREQ = 3π/2
    const tTrough = (3 * Math.PI) / 2 / RUNE_PULSE_FREQ
    const { alpha } = calcRuneOrbit(0, RUNE_COUNT, tTrough, agentColor)
    expect(alpha).toBeCloseTo(RUNE_ALPHA_MIN, 3)
  })
})

// ---------------------------------------------------------------------------
// calcRuneFlash
// ---------------------------------------------------------------------------

describe('calcRuneFlash', () => {
  it('is invisible before flash (negative age)', () => {
    const result = calcRuneFlash(-1, 0, RUNE_COUNT)
    expect(result.visible).toBe(false)
    expect(result.alpha).toBe(0)
  })

  it('is invisible at the flash duration boundary', () => {
    const result = calcRuneFlash(RUNE_FLASH_DURATION_MS, 0, RUNE_COUNT)
    expect(result.visible).toBe(false)
  })

  it('is invisible beyond the flash duration', () => {
    const result = calcRuneFlash(RUNE_FLASH_DURATION_MS + 100, 0, RUNE_COUNT)
    expect(result.visible).toBe(false)
  })

  it('is visible shortly after completion', () => {
    const result = calcRuneFlash(50, 0, RUNE_COUNT)
    expect(result.visible).toBe(true)
    expect(result.alpha).toBeGreaterThan(0)
  })

  it('is visible near the end of the flash', () => {
    const result = calcRuneFlash(RUNE_FLASH_DURATION_MS - 50, 0, RUNE_COUNT)
    expect(result.visible).toBe(true)
  })

  it('uses white tint (0xffffff) for a bright flash', () => {
    const result = calcRuneFlash(100, 0, RUNE_COUNT)
    expect(result.tint).toBe(0xffffff)
  })

  it('rune expands outward — later position is further from head', () => {
    const early = calcRuneFlash(10, 0, RUNE_COUNT)
    const late = calcRuneFlash(RUNE_FLASH_DURATION_MS - 10, 0, RUNE_COUNT)

    const earlyDist = Math.hypot(early.x, early.y - HEAD_Y)
    const lateDist = Math.hypot(late.x, late.y - HEAD_Y)
    expect(lateDist).toBeGreaterThan(earlyDist)
  })

  it('starts near RUNE_ORBIT_RADIUS and ends near ORBIT_RADIUS + FLASH_EXPANSION', () => {
    const start = calcRuneFlash(0, 0, RUNE_COUNT)
    const end = calcRuneFlash(RUNE_FLASH_DURATION_MS - 1, 0, RUNE_COUNT)

    const startDist = Math.hypot(start.x, start.y - HEAD_Y)
    const endDist = Math.hypot(end.x, end.y - HEAD_Y)
    expect(startDist).toBeCloseTo(RUNE_ORBIT_RADIUS, 0)
    expect(endDist).toBeCloseTo(RUNE_ORBIT_RADIUS + RUNE_FLASH_EXPANSION, 0)
  })

  it('different rune indices are at different angles during flash', () => {
    const r0 = calcRuneFlash(200, 0, 4)
    const r1 = calcRuneFlash(200, 1, 4)
    expect(r0.x).not.toBeCloseTo(r1.x, 2)
  })

  it('scale grows during the flash', () => {
    const early = calcRuneFlash(10, 0, RUNE_COUNT)
    const late = calcRuneFlash(RUNE_FLASH_DURATION_MS - 10, 0, RUNE_COUNT)
    expect(late.scale).toBeGreaterThan(early.scale)
  })

  it('alpha is non-negative throughout the flash', () => {
    for (let age = 0; age < RUNE_FLASH_DURATION_MS; age += 50) {
      const { alpha } = calcRuneFlash(age, 0, RUNE_COUNT)
      expect(alpha).toBeGreaterThanOrEqual(0)
    }
  })
})

// ---------------------------------------------------------------------------
// calcRuneDisplayScale
// ---------------------------------------------------------------------------

describe('calcRuneDisplayScale', () => {
  it('returns 1 at zoom = 1 (no scaling at 100%)', () => {
    expect(calcRuneDisplayScale(1)).toBe(1)
  })

  it('returns 1 at zoom = 0.5 (breakpoint — no scaling at 50%)', () => {
    expect(calcRuneDisplayScale(0.5)).toBe(1)
  })

  it('returns 1 for zoom values above the breakpoint', () => {
    expect(calcRuneDisplayScale(0.75)).toBe(1)
    expect(calcRuneDisplayScale(2)).toBe(1)
    expect(calcRuneDisplayScale(4)).toBe(1)
  })

  it('returns 2 at zoom = 0.25 (the default world zoom)', () => {
    expect(calcRuneDisplayScale(0.25)).toBe(2)
  })

  it('returns correct scale below the breakpoint — formula: 0.5 / zoom', () => {
    expect(calcRuneDisplayScale(0.1)).toBeCloseTo(5, 5)
    expect(calcRuneDisplayScale(0.15)).toBeCloseTo(0.5 / 0.15, 5)
    expect(calcRuneDisplayScale(0.4)).toBeCloseTo(0.5 / 0.4, 5)
  })

  it('result is always ≥ 1', () => {
    for (const zoom of [0.01, 0.1, 0.25, 0.5, 1, 2, 4]) {
      expect(calcRuneDisplayScale(zoom)).toBeGreaterThanOrEqual(1)
    }
  })

  it('screen orbit stays constant at the breakpoint: ORBIT_RADIUS × scale × zoom ≈ 13 px', () => {
    // At zoom = 0.25 with scale = 2: 26 × 2 × 0.25 = 13 screen pixels
    const zoom = 0.25
    const scale = calcRuneDisplayScale(zoom)
    const screenOrbit = RUNE_ORBIT_RADIUS * scale * zoom
    expect(screenOrbit).toBeCloseTo(RUNE_ORBIT_RADIUS * 0.5, 4)
  })

  it('screen orbit stays constant at zoom = 0.1: 26 × scale × 0.1 ≈ 13 px', () => {
    const zoom = 0.1
    const scale = calcRuneDisplayScale(zoom)
    const screenOrbit = RUNE_ORBIT_RADIUS * scale * zoom
    expect(screenOrbit).toBeCloseTo(RUNE_ORBIT_RADIUS * 0.5, 4)
  })
})
