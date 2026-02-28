import { describe, it, expect } from 'vitest'
import {
  runStarted,
  runCompleted,
  runFailed,
  tickRunInfo,
  type AgentRunInfo,
} from '../app/components/agent-run-state'
import { GLOW_DURATION_MS } from '../app/components/agent-run-effects'

// ---------------------------------------------------------------------------
// Factory: runStarted
// ---------------------------------------------------------------------------

describe('runStarted', () => {
  it('sets runState to running', () => {
    expect(runStarted().runState).toBe('running')
  })

  it('clears completionStart (no lingering glow from previous run)', () => {
    expect(runStarted().completionStart).toBeNull()
  })

  it('resets runTime to zero', () => {
    expect(runStarted().runTime).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Factory: runCompleted
// ---------------------------------------------------------------------------

describe('runCompleted', () => {
  it('sets runState to null (pulse stops)', () => {
    expect(runCompleted(1000).runState).toBeNull()
  })

  it('sets completionStart to the provided timestamp', () => {
    const ts = 123_456_789
    expect(runCompleted(ts).completionStart).toBe(ts)
  })

  it('uses Date.now() when no timestamp is provided', () => {
    const before = Date.now()
    const info = runCompleted()
    const after = Date.now()
    expect(info.completionStart).toBeGreaterThanOrEqual(before)
    expect(info.completionStart).toBeLessThanOrEqual(after)
  })

  it('resets runTime to zero', () => {
    expect(runCompleted(0).runTime).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Factory: runFailed
// ---------------------------------------------------------------------------

describe('runFailed', () => {
  it('sets runState to null', () => {
    expect(runFailed().runState).toBeNull()
  })

  it('clears completionStart (no glow on failure)', () => {
    expect(runFailed().completionStart).toBeNull()
  })

  it('resets runTime to zero', () => {
    expect(runFailed().runTime).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// tickRunInfo — undefined input (agent has no run yet)
// ---------------------------------------------------------------------------

describe('tickRunInfo — no run info', () => {
  it('returns null runTime when runInfo is undefined', () => {
    const { runTime } = tickRunInfo(undefined, 0.016, Date.now())
    expect(runTime).toBeNull()
  })

  it('returns null completionAge when runInfo is undefined', () => {
    const { completionAge } = tickRunInfo(undefined, 0.016, Date.now())
    expect(completionAge).toBeNull()
  })

  it('returns glowExpired false when runInfo is undefined', () => {
    const { glowExpired } = tickRunInfo(undefined, 0.016, Date.now())
    expect(glowExpired).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// tickRunInfo — running state (pulse)
// ---------------------------------------------------------------------------

describe('tickRunInfo — pulse during run', () => {
  function makeRunning(runTime = 0): AgentRunInfo {
    return { runState: 'running', completionStart: null, runTime }
  }

  it('returns non-null runTime while running', () => {
    const { runTime } = tickRunInfo(makeRunning(), 0.016, Date.now())
    expect(runTime).not.toBeNull()
  })

  it('runTime equals stored runTime + deltaSeconds', () => {
    const stored = 2.5
    const delta = 0.016
    const { runTime } = tickRunInfo(makeRunning(stored), delta, Date.now())
    expect(runTime).toBeCloseTo(stored + delta)
  })

  it('runTime starts at delta when runTime is 0', () => {
    const delta = 0.033
    const { runTime } = tickRunInfo(makeRunning(0), delta, Date.now())
    expect(runTime).toBeCloseTo(delta)
  })

  it('returns null completionAge while running (no glow)', () => {
    const { completionAge } = tickRunInfo(makeRunning(), 0.016, Date.now())
    expect(completionAge).toBeNull()
  })

  it('returns glowExpired false while running', () => {
    const { glowExpired } = tickRunInfo(makeRunning(), 0.016, Date.now())
    expect(glowExpired).toBe(false)
  })

  it('accumulates correctly over multiple ticks (simulated)', () => {
    // Simulate 60 frames at 16 ms each → ~0.96 s total
    let info = makeRunning()
    let lastRunTime = 0

    for (let frame = 0; frame < 60; frame++) {
      const result = tickRunInfo(info, 0.016, Date.now())
      // Update stored runTime to simulate Grid2D's mutation
      info = { ...info, runTime: result.runTime! }
      lastRunTime = result.runTime!
    }

    expect(lastRunTime).toBeCloseTo(60 * 0.016, 2)
  })
})

// ---------------------------------------------------------------------------
// tickRunInfo — post-completion state (glow)
// ---------------------------------------------------------------------------

describe('tickRunInfo — glow after completion', () => {
  function makeCompleted(completionStart: number): AgentRunInfo {
    return { runState: null, completionStart, runTime: 0 }
  }

  it('returns null runTime after completion (pulse stops)', () => {
    const now = 100_000
    const { runTime } = tickRunInfo(makeCompleted(now - 100), 0.016, now)
    expect(runTime).toBeNull()
  })

  it('returns non-null completionAge shortly after completion', () => {
    const now = 100_000
    const { completionAge } = tickRunInfo(makeCompleted(now - 100), 0.016, now)
    expect(completionAge).not.toBeNull()
  })

  it('completionAge equals now − completionStart', () => {
    const now = 200_000
    const completionStart = now - 500
    const { completionAge } = tickRunInfo(makeCompleted(completionStart), 0.016, now)
    expect(completionAge).toBe(500)
  })

  it('completionAge is 0 immediately after completion', () => {
    const now = 100_000
    const { completionAge } = tickRunInfo(makeCompleted(now), 0.016, now)
    expect(completionAge).toBe(0)
  })

  it('completionAge grows as time advances', () => {
    const completionStart = 100_000
    const age1 = tickRunInfo(makeCompleted(completionStart), 0.016, 100_500).completionAge
    const age2 = tickRunInfo(makeCompleted(completionStart), 0.016, 101_000).completionAge
    expect(age2!).toBeGreaterThan(age1!)
  })

  it('glowExpired is false before GLOW_DURATION_MS elapses', () => {
    const now = 100_000
    const completionStart = now - (GLOW_DURATION_MS - 1)
    const { glowExpired } = tickRunInfo(makeCompleted(completionStart), 0.016, now)
    expect(glowExpired).toBe(false)
  })

  it('glowExpired is true at exactly GLOW_DURATION_MS', () => {
    const now = 100_000
    const completionStart = now - GLOW_DURATION_MS
    const { glowExpired } = tickRunInfo(makeCompleted(completionStart), 0.016, now)
    expect(glowExpired).toBe(true)
  })

  it('glowExpired is true after GLOW_DURATION_MS', () => {
    const now = 100_000
    const completionStart = now - GLOW_DURATION_MS - 100
    const { glowExpired } = tickRunInfo(makeCompleted(completionStart), 0.016, now)
    expect(glowExpired).toBe(true)
  })

  it('completionAge is null when glow has expired', () => {
    const now = 100_000
    const completionStart = now - GLOW_DURATION_MS - 1
    const { completionAge } = tickRunInfo(makeCompleted(completionStart), 0.016, now)
    expect(completionAge).toBeNull()
  })

  it('respects custom glowDurationMs', () => {
    const customDuration = 500
    const now = 100_000

    // Still active at 499 ms
    const infoActive = makeCompleted(now - 499)
    expect(tickRunInfo(infoActive, 0.016, now, customDuration).completionAge).not.toBeNull()

    // Expired at exactly 500 ms
    const infoExpired = makeCompleted(now - customDuration)
    expect(tickRunInfo(infoExpired, 0.016, now, customDuration).glowExpired).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// tickRunInfo — state transitions (mutual exclusivity)
// ---------------------------------------------------------------------------

describe('tickRunInfo — mutual exclusivity of pulse and glow', () => {
  it('when running: runTime is set, completionAge is null', () => {
    const info: AgentRunInfo = { runState: 'running', completionStart: null, runTime: 1 }
    const result = tickRunInfo(info, 0.016, Date.now())
    expect(result.runTime).not.toBeNull()
    expect(result.completionAge).toBeNull()
  })

  it('when completed (glow active): runTime is null, completionAge is set', () => {
    const now = 100_000
    const info: AgentRunInfo = { runState: null, completionStart: now - 500, runTime: 0 }
    const result = tickRunInfo(info, 0.016, now)
    expect(result.runTime).toBeNull()
    expect(result.completionAge).not.toBeNull()
  })

  it('when failed (idle): both runTime and completionAge are null', () => {
    const info: AgentRunInfo = { runState: null, completionStart: null, runTime: 0 }
    const result = tickRunInfo(info, 0.016, Date.now())
    expect(result.runTime).toBeNull()
    expect(result.completionAge).toBeNull()
  })

  it('starting a new run clears previous completionStart', () => {
    // runStarted() factory always sets completionStart to null
    const info = runStarted()
    expect(info.completionStart).toBeNull()
  })

  it('completing a run clears runState', () => {
    // runCompleted() factory always sets runState to null
    const info = runCompleted(Date.now())
    expect(info.runState).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Full lifecycle simulation (RunEngine events → tick loop)
// ---------------------------------------------------------------------------

describe('full run lifecycle simulation', () => {
  it('produces pulse during run, then glow after completion', () => {
    const FRAME = 0.016 // 16 ms at 60 fps
    const completionTs = 150_000

    // --- Phase 1: run starts ---
    let info: AgentRunInfo = runStarted()
    let now = 100_000

    // Simulate 10 frames while running
    for (let i = 0; i < 10; i++) {
      now += 16
      const result = tickRunInfo(info, FRAME, now)
      expect(result.runTime).not.toBeNull()
      expect(result.completionAge).toBeNull()
      info = { ...info, runTime: result.runTime! }
    }

    // --- Phase 2: run completes ---
    info = runCompleted(completionTs)
    now = completionTs

    // Simulate frames during glow
    let glowSeenAtLeastOnce = false
    for (let ms = 0; ms < GLOW_DURATION_MS; ms += 16) {
      const result = tickRunInfo(info, FRAME, completionTs + ms)
      expect(result.runTime).toBeNull()
      if (result.completionAge !== null) {
        glowSeenAtLeastOnce = true
        expect(result.completionAge).toBe(ms)
      }
    }
    expect(glowSeenAtLeastOnce).toBe(true)

    // --- Phase 3: glow expires ---
    const afterGlow = tickRunInfo(info, FRAME, completionTs + GLOW_DURATION_MS + 1)
    expect(afterGlow.runTime).toBeNull()
    expect(afterGlow.completionAge).toBeNull()
    expect(afterGlow.glowExpired).toBe(true)
  })

  it('failed run produces no glow', () => {
    const info = runFailed()
    const result = tickRunInfo(info, 0.016, Date.now())
    expect(result.runTime).toBeNull()
    expect(result.completionAge).toBeNull()
    expect(result.glowExpired).toBe(false)
  })

  it('new run started while glow is still active replaces glow with pulse', () => {
    const oldGlowInfo = runCompleted(Date.now() - 100) // glow in progress
    // User starts a new run while glow is active
    const newRunInfo = runStarted()

    const result = tickRunInfo(newRunInfo, 0.016, Date.now())
    expect(result.runTime).not.toBeNull()
    expect(result.completionAge).toBeNull()
    // oldGlowInfo is discarded — only newRunInfo matters
    void oldGlowInfo
  })
})
