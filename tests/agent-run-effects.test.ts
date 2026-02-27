import { describe, it, expect } from 'vitest'
import {
  calcPulseRing,
  calcCompletionGlow,
  PULSE_FREQ,
  PULSE_BASE_OFFSET,
  PULSE_RADIUS_AMPLITUDE,
  PULSE_ALPHA_MID,
  PULSE_ALPHA_AMPLITUDE,
  GLOW_DURATION_MS,
  GLOW_INITIAL_OFFSET,
  GLOW_EXPANSION,
  GLOW_MAX_ALPHA,
} from '../app/components/agent-run-effects'

// ---------------------------------------------------------------------------
// calcPulseRing
// ---------------------------------------------------------------------------

describe('calcPulseRing', () => {
  const HEAD_R = 9

  it('returns a radiusOffset greater than headR', () => {
    const result = calcPulseRing(0, HEAD_R)
    expect(result.radiusOffset).toBeGreaterThan(HEAD_R)
  })

  it('radiusOffset at t=0 equals headR + PULSE_BASE_OFFSET (sin(0) = 0)', () => {
    const result = calcPulseRing(0, HEAD_R)
    expect(result.radiusOffset).toBeCloseTo(HEAD_R + PULSE_BASE_OFFSET)
  })

  it('alpha at t=0 equals PULSE_ALPHA_MID (sin(0) = 0)', () => {
    const result = calcPulseRing(0, HEAD_R)
    expect(result.alpha).toBeCloseTo(PULSE_ALPHA_MID)
  })

  it('radiusOffset oscillates — peak at t where sin(t * PULSE_FREQ) = 1', () => {
    const tPeak = Math.PI / 2 / PULSE_FREQ
    const peak = calcPulseRing(tPeak, HEAD_R)
    expect(peak.radiusOffset).toBeCloseTo(HEAD_R + PULSE_BASE_OFFSET + PULSE_RADIUS_AMPLITUDE)
  })

  it('radiusOffset oscillates — trough at t where sin(t * PULSE_FREQ) = -1', () => {
    const tTrough = (3 * Math.PI) / 2 / PULSE_FREQ
    const trough = calcPulseRing(tTrough, HEAD_R)
    expect(trough.radiusOffset).toBeCloseTo(HEAD_R + PULSE_BASE_OFFSET - PULSE_RADIUS_AMPLITUDE)
  })

  it('alpha stays within (0, 1)', () => {
    for (let t = 0; t <= 10; t += 0.1) {
      const { alpha } = calcPulseRing(t, HEAD_R)
      expect(alpha).toBeGreaterThan(0)
      expect(alpha).toBeLessThanOrEqual(1)
    }
  })

  it('radiusOffset stays positive for all t', () => {
    for (let t = 0; t <= 10; t += 0.1) {
      const { radiusOffset } = calcPulseRing(t, HEAD_R)
      expect(radiusOffset).toBeGreaterThan(0)
    }
  })

  it('alpha range is [PULSE_ALPHA_MID - AMPLITUDE, PULSE_ALPHA_MID + AMPLITUDE]', () => {
    const minExpected = PULSE_ALPHA_MID - PULSE_ALPHA_AMPLITUDE
    const maxExpected = PULSE_ALPHA_MID + PULSE_ALPHA_AMPLITUDE
    for (let t = 0; t <= 10; t += 0.05) {
      const { alpha } = calcPulseRing(t, HEAD_R)
      expect(alpha).toBeGreaterThanOrEqual(minExpected - 0.001)
      expect(alpha).toBeLessThanOrEqual(maxExpected + 0.001)
    }
  })

  it('scales with headR — larger head produces larger ring', () => {
    const small = calcPulseRing(0, 5)
    const large = calcPulseRing(0, 15)
    expect(large.radiusOffset).toBeGreaterThan(small.radiusOffset)
  })
})

// ---------------------------------------------------------------------------
// calcCompletionGlow
// ---------------------------------------------------------------------------

describe('calcCompletionGlow', () => {
  it('is active at completionAge = 0', () => {
    const result = calcCompletionGlow(0)
    expect(result.active).toBe(true)
  })

  it('is inactive at completionAge = GLOW_DURATION_MS', () => {
    const result = calcCompletionGlow(GLOW_DURATION_MS)
    expect(result.active).toBe(false)
  })

  it('is inactive when completionAge exceeds GLOW_DURATION_MS', () => {
    const result = calcCompletionGlow(GLOW_DURATION_MS + 1)
    expect(result.active).toBe(false)
  })

  it('is inactive for negative completionAge', () => {
    const result = calcCompletionGlow(-1)
    expect(result.active).toBe(false)
  })

  it('returns zeros when inactive', () => {
    const result = calcCompletionGlow(GLOW_DURATION_MS)
    expect(result.alpha).toBe(0)
    expect(result.radiusOffset).toBe(0)
    expect(result.strokeWidth).toBe(0)
  })

  it('alpha is GLOW_MAX_ALPHA at t=0', () => {
    const result = calcCompletionGlow(0)
    expect(result.alpha).toBeCloseTo(GLOW_MAX_ALPHA)
  })

  it('alpha decreases monotonically over the glow lifetime', () => {
    let prevAlpha = calcCompletionGlow(0).alpha
    for (let age = 100; age < GLOW_DURATION_MS; age += 100) {
      const { alpha } = calcCompletionGlow(age)
      expect(alpha).toBeLessThan(prevAlpha)
      prevAlpha = alpha
    }
  })

  it('radiusOffset is GLOW_INITIAL_OFFSET at t=0', () => {
    const result = calcCompletionGlow(0)
    expect(result.radiusOffset).toBeCloseTo(GLOW_INITIAL_OFFSET)
  })

  it('radiusOffset grows toward GLOW_INITIAL_OFFSET + GLOW_EXPANSION at end', () => {
    // Just before the end the offset should be nearly at the maximum
    const result = calcCompletionGlow(GLOW_DURATION_MS - 1)
    expect(result.radiusOffset).toBeGreaterThan(GLOW_INITIAL_OFFSET + GLOW_EXPANSION * 0.9)
  })

  it('radiusOffset increases monotonically', () => {
    let prevOffset = calcCompletionGlow(0).radiusOffset
    for (let age = 100; age < GLOW_DURATION_MS; age += 100) {
      const { radiusOffset } = calcCompletionGlow(age)
      expect(radiusOffset).toBeGreaterThan(prevOffset)
      prevOffset = radiusOffset
    }
  })

  it('strokeWidth starts at 3 and decreases', () => {
    const atStart = calcCompletionGlow(0)
    const atMid = calcCompletionGlow(GLOW_DURATION_MS / 2)
    expect(atStart.strokeWidth).toBeCloseTo(3)
    expect(atMid.strokeWidth).toBeLessThan(atStart.strokeWidth)
  })

  it('strokeWidth is at least 1 throughout the animation', () => {
    for (let age = 0; age < GLOW_DURATION_MS; age += 50) {
      const { strokeWidth, active } = calcCompletionGlow(age)
      if (active) {
        expect(strokeWidth).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('respects a custom glowDurationMs', () => {
    const custom = 500
    expect(calcCompletionGlow(0, custom).active).toBe(true)
    expect(calcCompletionGlow(499, custom).active).toBe(true)
    expect(calcCompletionGlow(500, custom).active).toBe(false)
  })

  it('alpha at half duration is roughly half of GLOW_MAX_ALPHA', () => {
    const { alpha } = calcCompletionGlow(GLOW_DURATION_MS / 2)
    expect(alpha).toBeCloseTo(GLOW_MAX_ALPHA / 2, 1)
  })
})
