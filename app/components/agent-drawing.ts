// ---------------------------------------------------------------------------
// Stick-figure drawing helpers — requires pixi.js
// ---------------------------------------------------------------------------

import * as PIXI from 'pixi.js'
import type { AgentState } from './agent-logic'

// ---------------------------------------------------------------------------
// Layout constants (world pixels, centred at container origin)
// The container is placed at (agent.x, agent.y).
//   y = -30 → top of head
//   y =  +30 → bottom of feet / shadow
// Total figure height ≈ 60 px  (~1 cell at zoom 1)
// ---------------------------------------------------------------------------

const HEAD_Y = -21  // head centre
const HEAD_R = 9    // head radius
const SHOULDER_Y = -7
const HIP_Y = 10
const FOOT_Y = 30

// ---------------------------------------------------------------------------
// Main drawing function
// ---------------------------------------------------------------------------

/**
 * Clear `g` and redraw the stick figure for the current `state`.
 * Pass `selected = true` to draw a white glow ring around the head.
 */
export function drawStickFigure(g: PIXI.Graphics, state: AgentState, selected: boolean): void {
  g.clear()

  const c = state.color
  const isMoving = Math.hypot(state.x - state.targetX, state.y - state.targetY) > 3
  const swing = isMoving ? Math.sin(state.walkTime) * 9 : 0

  // ---- Shadow ----
  g.ellipse(0, FOOT_Y + 3, 14, 5)
  g.fill({ color: 0x000000, alpha: 0.25 })

  // ---- Legs (opposite swing phases) ----
  g.moveTo(0, HIP_Y)
  g.lineTo(-7 - swing, FOOT_Y)
  g.stroke({ color: c, width: 4, cap: 'round' })

  g.moveTo(0, HIP_Y)
  g.lineTo(7 + swing, FOOT_Y)
  g.stroke({ color: c, width: 4, cap: 'round' })

  // ---- Body ----
  g.moveTo(0, SHOULDER_Y)
  g.lineTo(0, HIP_Y)
  g.stroke({ color: c, width: 5, cap: 'round' })

  // ---- Arms (counter-swing to legs) ----
  const armY = SHOULDER_Y + 4
  g.moveTo(0, armY)
  g.lineTo(-12, armY - swing * 0.7 + 8)
  g.stroke({ color: c, width: 3, cap: 'round' })

  g.moveTo(0, armY)
  g.lineTo(12, armY + swing * 0.7 + 8)
  g.stroke({ color: c, width: 3, cap: 'round' })

  // ---- Head ----
  if (selected) {
    // Outer glow ring
    g.circle(0, HEAD_Y, HEAD_R + 5)
    g.stroke({ color: 0xffffff, width: 2.5, alpha: 0.9 })
  }

  g.circle(0, HEAD_Y, HEAD_R)
  g.fill({ color: c })
  g.circle(0, HEAD_Y, HEAD_R)
  g.stroke({ color: 0x000000, width: 1.5, alpha: 0.45 })

  // ---- Eye (indicates facing direction) ----
  const eyeX = state.facingLeft ? -3 : 3
  g.circle(eyeX, HEAD_Y - 1, 2.5)
  g.fill({ color: 0x000000, alpha: 0.85 })
}
