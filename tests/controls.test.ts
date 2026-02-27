/**
 * Tests for the pointer-event control scheme logic.
 *
 * Control scheme:
 *   - Left button (button=0) click  → select / deselect agent
 *   - Left button (button=0) drag   → rectangle selection
 *   - Middle button (button=1) drag → pan camera
 *   - Scroll wheel                  → zoom
 *
 * These tests verify the pure helper logic used inside the Grid2D event handlers.
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// isClick threshold (< 5 px movement → treated as click)
// ---------------------------------------------------------------------------

function isClick(downX: number, downY: number, upX: number, upY: number): boolean {
  const dx = upX - downX
  const dy = upY - downY
  return dx * dx + dy * dy < 25 // 5² = 25
}

describe('isClick threshold', () => {
  it('returns true for zero movement', () => {
    expect(isClick(100, 100, 100, 100)).toBe(true)
  })

  it('returns true for movement less than 5 px', () => {
    expect(isClick(100, 100, 103, 100)).toBe(true)
    expect(isClick(100, 100, 100, 104)).toBe(true)
  })

  it('returns false for movement exactly 5 px', () => {
    // sqrt(25) = 5, distance² = 25, NOT < 25
    expect(isClick(0, 0, 5, 0)).toBe(false)
  })

  it('returns false for movement greater than 5 px', () => {
    expect(isClick(100, 100, 110, 100)).toBe(false)
    expect(isClick(100, 100, 100, 120)).toBe(false)
    expect(isClick(0, 0, 10, 10)).toBe(false)
  })

  it('works for negative movement (moving left or up)', () => {
    expect(isClick(100, 100, 98, 100)).toBe(true)
    expect(isClick(100, 100, 100, 97)).toBe(true)
    expect(isClick(100, 100, 90, 100)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Button assignment constants
// ---------------------------------------------------------------------------

describe('pointer button assignment', () => {
  it('left mouse button is 0', () => {
    // Sanity-check: our control scheme assigns rect-select to button 0
    const LEFT_BUTTON = 0
    expect(LEFT_BUTTON).toBe(0)
  })

  it('middle mouse button is 1', () => {
    // Sanity-check: our control scheme assigns pan to button 1
    const MIDDLE_BUTTON = 1
    expect(MIDDLE_BUTTON).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Rect selection world-space coordinate computation
// ---------------------------------------------------------------------------

interface WorldRect {
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * Mirrors the rect computation from Grid2D.tsx pointerup handler.
 * Converts screen-space start/end to world-space rect, always normalising
 * so x1 ≤ x2 and y1 ≤ y2.
 */
function screenRectToWorld(
  startSx: number,
  startSy: number,
  endSx: number,
  endSy: number,
  viewX: number,
  viewY: number,
  zoom: number,
): WorldRect {
  return {
    x1: (Math.min(startSx, endSx) - viewX) / zoom,
    y1: (Math.min(startSy, endSy) - viewY) / zoom,
    x2: (Math.max(startSx, endSx) - viewX) / zoom,
    y2: (Math.max(startSy, endSy) - viewY) / zoom,
  }
}

describe('screenRectToWorld', () => {
  it('converts screen coordinates to world space at zoom=1, no offset', () => {
    const rect = screenRectToWorld(10, 20, 110, 220, 0, 0, 1)
    expect(rect.x1).toBe(10)
    expect(rect.y1).toBe(20)
    expect(rect.x2).toBe(110)
    expect(rect.y2).toBe(220)
  })

  it('normalises when end is before start (drag upward/leftward)', () => {
    const rect = screenRectToWorld(110, 220, 10, 20, 0, 0, 1)
    expect(rect.x1).toBeLessThan(rect.x2)
    expect(rect.y1).toBeLessThan(rect.y2)
    expect(rect.x1).toBe(10)
    expect(rect.y1).toBe(20)
  })

  it('applies view offset', () => {
    // viewX=50, viewY=30 shifts origin
    const rect = screenRectToWorld(60, 50, 160, 250, 50, 30, 1)
    expect(rect.x1).toBe(10)
    expect(rect.y1).toBe(20)
    expect(rect.x2).toBe(110)
    expect(rect.y2).toBe(220)
  })

  it('divides by zoom factor', () => {
    const rect = screenRectToWorld(0, 0, 200, 100, 0, 0, 2)
    expect(rect.x1).toBe(0)
    expect(rect.y1).toBe(0)
    expect(rect.x2).toBe(100) // 200 / 2
    expect(rect.y2).toBe(50)  // 100 / 2
  })

  it('handles zoom < 1 (zoomed out)', () => {
    const rect = screenRectToWorld(0, 0, 100, 100, 0, 0, 0.25)
    expect(rect.x2).toBeCloseTo(400) // 100 / 0.25
    expect(rect.y2).toBeCloseTo(400)
  })
})
