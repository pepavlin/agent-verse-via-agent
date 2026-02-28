'use client'

import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { drawStickFigure } from './agent-drawing'
import type { AgentState } from './agent-logic'
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
  nextPhase,
  arcPoint,
  calcDelegationRuneState,
} from './delegation-logic'
import { RUNE_CHARS, RUNE_COUNT, calcRuneOrbit, calcRuneFlash } from './agent-runes'

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const W = 900
const H = 500
const GROUND_Y = 345          // y where feet rest
const FIGURE_CENTER_Y = GROUND_Y - 30  // y of figure container (origin at hip level)

const MGR_HOME_X = 160
const WKR_HOME_X = 490
const TASK_X = 730
const TASK_Y = FIGURE_CENTER_Y

const MGR_COLOR = 0xe74c3c    // red
const WKR_COLOR = 0x2980b9    // blue

// HEAD_Y from agent-drawing constants (figure is drawn with origin at centre-ish)
const HEAD_TOP = -30          // approx top of head above container origin

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface Bubble {
  container: PIXI.Container
  bg: PIXI.Graphics
  label: PIXI.Text
}

interface TaskCard {
  container: PIXI.Container
  gfx: PIXI.Graphics
}

interface SceneData {
  mgr: SceneAgent
  wkr: SceneAgent
  mgrContainer: PIXI.Container
  wkrContainer: PIXI.Container
  mgrGfx: PIXI.Graphics
  wkrGfx: PIXI.Graphics
  /** Rune glyph texts orbiting the worker during working/completing phases. */
  wkrRuneTexts: PIXI.Text[]
  mgrBubble: Bubble
  wkrBubble: Bubble
  taskGfx: PIXI.Graphics
  delegArrow: PIXI.Graphics
  taskCard: TaskCard
  phaseLabel: PIXI.Text
  phaseSubLabel: PIXI.Text
  phaseBar: PIXI.Graphics
  progressGfx: PIXI.Graphics
  taskComplete: boolean
}

// ---------------------------------------------------------------------------
// Bubble helpers
// ---------------------------------------------------------------------------

function makeBubble(parent: PIXI.Container): Bubble {
  const container = new PIXI.Container()
  const bg = new PIXI.Graphics()
  const label = new PIXI.Text({
    text: '',
    style: {
      fontSize: 13,
      fill: '#1a1a1a',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 170,
      fontFamily: 'Arial, sans-serif',
    },
  })
  container.addChild(bg)
  container.addChild(label)
  parent.addChild(container)
  container.visible = false
  return { container, bg, label }
}

/**
 * Render speech bubble with tail pointing down to (0, 0) in local space.
 * Position the container at the point just above the agent's head.
 */
function showBubble(
  bubble: Bubble,
  text: string,
  worldX: number,
  worldY: number,
  alpha = 1,
): void {
  bubble.container.visible = true
  bubble.container.alpha = Math.max(0, Math.min(1, alpha))
  bubble.label.text = text

  const tw = bubble.label.width
  const th = bubble.label.height
  const pad = 10
  const bw = Math.max(tw + pad * 2, 70)
  const bh = th + pad * 2
  const tailH = 12

  bubble.bg.clear()

  // Main rounded rect
  bubble.bg.roundRect(-bw / 2, -(bh + tailH), bw, bh, 8)
  bubble.bg.fill({ color: 0xffffff, alpha: 0.97 })
  bubble.bg.roundRect(-bw / 2, -(bh + tailH), bw, bh, 8)
  bubble.bg.stroke({ color: 0x555555, width: 1.5 })

  // Tail triangle
  bubble.bg.moveTo(-8, -tailH)
  bubble.bg.lineTo(8, -tailH)
  bubble.bg.lineTo(0, 0)
  bubble.bg.closePath()
  bubble.bg.fill({ color: 0xffffff, alpha: 0.97 })
  bubble.bg.moveTo(-8, -tailH)
  bubble.bg.lineTo(0, 0)
  bubble.bg.stroke({ color: 0x555555, width: 1.5 })

  // Centre text inside bubble
  bubble.label.position.set(-tw / 2, -(bh + tailH) + pad)
  bubble.container.position.set(worldX, worldY)
}

function hideBubble(bubble: Bubble): void {
  bubble.container.visible = false
}

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

function drawBackground(stage: PIXI.Container): void {
  const bg = new PIXI.Graphics()

  // Sky
  bg.rect(0, 0, W, GROUND_Y + 22)
  bg.fill({ color: 0xd6eaf8 })

  // Ground
  bg.rect(0, GROUND_Y + 22, W, H - GROUND_Y - 22)
  bg.fill({ color: 0x58a84a })

  // Ground line
  bg.moveTo(0, GROUND_Y + 22)
  bg.lineTo(W, GROUND_Y + 22)
  bg.stroke({ color: 0x3d7a34, width: 2.5 })

  // Sandy path between manager and task
  bg.roundRect(MGR_HOME_X - 15, GROUND_Y + 5, TASK_X - MGR_HOME_X + 60, 16, 3)
  bg.fill({ color: 0xd4b97a, alpha: 0.55 })

  // Clouds
  const clouds: Array<{ x: number; y: number; r: number }> = [
    { x: 190, y: 75, r: 32 },
    { x: 580, y: 55, r: 27 },
    { x: 810, y: 95, r: 22 },
  ]
  for (const c of clouds) {
    bg.ellipse(c.x, c.y, c.r * 2, c.r)
    bg.fill({ color: 0xffffff, alpha: 0.9 })
    bg.ellipse(c.x - c.r * 0.8, c.y + 6, c.r * 1.3, c.r * 0.85)
    bg.fill({ color: 0xffffff, alpha: 0.9 })
    bg.ellipse(c.x + c.r * 0.7, c.y + 8, c.r * 1.1, c.r * 0.8)
    bg.fill({ color: 0xffffff, alpha: 0.9 })
  }

  // Trees
  const trees = [75, 370, 840]
  for (const tx of trees) {
    const ty = GROUND_Y + 22
    bg.rect(tx - 5, ty - 35, 10, 35)
    bg.fill({ color: 0x8b5e3c })
    bg.circle(tx, ty - 55, 24)
    bg.fill({ color: 0x2e8b37 })
    bg.circle(tx - 12, ty - 66, 16)
    bg.fill({ color: 0x2e8b37 })
    bg.circle(tx + 12, ty - 66, 16)
    bg.fill({ color: 0x2e8b37 })
  }

  stage.addChild(bg)
}

// ---------------------------------------------------------------------------
// Task marker
// ---------------------------------------------------------------------------

function drawTaskMarker(g: PIXI.Graphics, complete: boolean, time: number): void {
  g.clear()
  const pulse = 5 + Math.sin(time * 2) * 4
  const color = complete ? 0x27ae60 : 0xe67e22
  const r = 24

  // Glow
  g.circle(0, 0, r + pulse)
  g.stroke({ color, width: 2, alpha: 0.3 })

  // Body
  g.circle(0, 0, r)
  g.fill({ color })
  g.circle(0, 0, r)
  g.stroke({ color: 0x000000, width: 1.5, alpha: 0.25 })

  if (complete) {
    // Checkmark
    g.moveTo(-10, 1)
    g.lineTo(-3, 9)
    g.lineTo(11, -9)
    g.stroke({ color: 0xffffff, width: 3.5, cap: 'round', join: 'round' })
  } else {
    // Star
    const pts = 5
    const step = Math.PI / pts
    let first = true
    for (let i = 0; i < pts * 2; i++) {
      const rr = i % 2 === 0 ? 14 : 6
      const angle = i * step - Math.PI / 2
      const sx = Math.cos(angle) * rr
      const sy = Math.sin(angle) * rr
      if (first) { g.moveTo(sx, sy); first = false } else { g.lineTo(sx, sy) }
    }
    g.closePath()
    g.fill({ color: 0xffffff, alpha: 0.95 })
  }
}

// ---------------------------------------------------------------------------
// Delegation arrow (animated dashed line)
// ---------------------------------------------------------------------------

function drawDelegArrow(
  g: PIXI.Graphics,
  fromX: number,
  toX: number,
  y: number,
  time: number,
): void {
  g.clear()
  const dash = 14
  const gap = 8
  const period = dash + gap
  const offset = (time * 90) % period

  let x = fromX - period + (offset % period)
  while (x < toX - 14) {
    const x1 = Math.max(x, fromX)
    const x2 = Math.min(x + dash, toX - 14)
    if (x2 > x1) {
      g.moveTo(x1, y)
      g.lineTo(x2, y)
      g.stroke({ color: 0xe74c3c, width: 2.5, alpha: 0.7 })
    }
    x += period
  }

  // Arrowhead
  g.moveTo(toX - 14, y - 7)
  g.lineTo(toX, y)
  g.lineTo(toX - 14, y + 7)
  g.stroke({ color: 0xe74c3c, width: 2.5, cap: 'round' })
}

// ---------------------------------------------------------------------------
// Task card (flies on arc during calling phase)
// ---------------------------------------------------------------------------

function makeTaskCard(stage: PIXI.Container): TaskCard {
  const container = new PIXI.Container()
  const gfx = new PIXI.Graphics()

  // Static look: little orange card with "TASK" text
  gfx.roundRect(-22, -14, 44, 28, 5)
  gfx.fill({ color: 0xf39c12 })
  gfx.roundRect(-22, -14, 44, 28, 5)
  gfx.stroke({ color: 0xd68910, width: 1.5 })

  const label = new PIXI.Text({
    text: 'ÚKOL',
    style: { fontSize: 11, fill: '#ffffff', fontFamily: 'Arial', fontWeight: 'bold' },
  })
  label.anchor.set(0.5, 0.5)
  container.addChild(gfx)
  container.addChild(label)
  container.visible = false
  stage.addChild(container)
  return { container, gfx }
}

// ---------------------------------------------------------------------------
// Build the whole scene
// ---------------------------------------------------------------------------

function buildScene(app: PIXI.Application): SceneData {
  drawBackground(app.stage)

  // Manager
  const mgrContainer = new PIXI.Container()
  const mgrGfx = new PIXI.Graphics()
  const mgrNameLabel = new PIXI.Text({
    text: 'Manažer',
    style: { fontSize: 12, fill: '#c0392b', fontFamily: 'Arial', fontWeight: 'bold' },
  })
  mgrNameLabel.anchor.set(0.5, 1)
  mgrNameLabel.position.set(0, HEAD_TOP - 8)
  mgrContainer.addChild(mgrGfx)
  mgrContainer.addChild(mgrNameLabel)
  app.stage.addChild(mgrContainer)

  const mgr: SceneAgent = {
    id: 'manager', name: 'Manager', role: 'Manager', color: MGR_COLOR,
    x: MGR_HOME_X, y: FIGURE_CENTER_Y,
    targetX: MGR_HOME_X, targetY: FIGURE_CENTER_Y,
    speed: 65, walkTime: 0, facingLeft: false, idleTimer: 0,
  }

  // Worker
  const wkrContainer = new PIXI.Container()
  const wkrGfx = new PIXI.Graphics()
  const wkrNameLabel = new PIXI.Text({
    text: 'Pracovník',
    style: { fontSize: 12, fill: '#2471a3', fontFamily: 'Arial', fontWeight: 'bold' },
  })
  wkrNameLabel.anchor.set(0.5, 1)
  wkrNameLabel.position.set(0, HEAD_TOP - 8)
  // Rune glyph texts for the worker (orbit during working, flash on completing)
  const wkrRuneTexts = RUNE_CHARS.slice(0, RUNE_COUNT).map((char) => {
    const text = new PIXI.Text({
      text: char,
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontFamily: 'serif',
        fontWeight: 'bold',
        dropShadow: { color: 0x000000, blur: 4, distance: 0, alpha: 0.6 },
      },
    })
    text.anchor.set(0.5, 0.5)
    text.visible = false
    return text
  })

  wkrContainer.addChild(wkrGfx)
  for (const r of wkrRuneTexts) wkrContainer.addChild(r)
  wkrContainer.addChild(wkrNameLabel)
  app.stage.addChild(wkrContainer)

  const wkr: SceneAgent = {
    id: 'worker', name: 'Worker', role: 'Worker', color: WKR_COLOR,
    x: WKR_HOME_X, y: FIGURE_CENTER_Y,
    targetX: WKR_HOME_X, targetY: FIGURE_CENTER_Y,
    speed: 75, walkTime: 0, facingLeft: false, idleTimer: 0,
  }

  // Task marker
  const taskGfx = new PIXI.Graphics()
  taskGfx.position.set(TASK_X, TASK_Y)
  app.stage.addChild(taskGfx)

  const taskLabel = new PIXI.Text({
    text: 'Sektor 7',
    style: { fontSize: 11, fill: '#555555', fontFamily: 'Arial' },
  })
  taskLabel.anchor.set(0.5, 0)
  taskLabel.position.set(TASK_X, TASK_Y + 30)
  app.stage.addChild(taskLabel)

  // Delegation arrow
  const delegArrow = new PIXI.Graphics()
  delegArrow.visible = false
  app.stage.addChild(delegArrow)

  // Task card (arc animation)
  const taskCard = makeTaskCard(app.stage)

  // Bubbles (on top)
  const mgrBubble = makeBubble(app.stage)
  const wkrBubble = makeBubble(app.stage)

  // Phase bar at bottom
  const phaseBar = new PIXI.Graphics()
  app.stage.addChild(phaseBar)

  // English phase label (upper line in bar)
  const phaseLabel = new PIXI.Text({
    text: '',
    style: {
      fontSize: 13,
      fill: '#94a3b8',
      fontFamily: 'Arial',
      align: 'center',
    },
  })
  phaseLabel.anchor.set(0.5, 0.5)
  phaseLabel.position.set(W / 2, H - 42)
  app.stage.addChild(phaseLabel)

  // Czech phase sub-label (lower, prominent line in bar)
  const phaseSubLabel = new PIXI.Text({
    text: '',
    style: {
      fontSize: 15,
      fill: '#ecf0f1',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      align: 'center',
    },
  })
  phaseSubLabel.anchor.set(0.5, 0.5)
  phaseSubLabel.position.set(W / 2, H - 22)
  app.stage.addChild(phaseSubLabel)

  // Progress bar (thin line under phase text)
  const progressGfx = new PIXI.Graphics()
  app.stage.addChild(progressGfx)

  // Title (Czech)
  const title = new PIXI.Text({
    text: 'Delegace v 2D světě',
    style: {
      fontSize: 20,
      fill: '#2c3e50',
      fontFamily: 'Arial',
      fontWeight: 'bold',
    },
  })
  title.anchor.set(0.5, 0)
  title.position.set(W / 2, 9)
  app.stage.addChild(title)

  // Subtitle (English)
  const titleSub = new PIXI.Text({
    text: 'Delegation in a 2D World',
    style: {
      fontSize: 12,
      fill: '#607d8b',
      fontFamily: 'Arial',
    },
  })
  titleSub.anchor.set(0.5, 0)
  titleSub.position.set(W / 2, 34)
  app.stage.addChild(titleSub)

  return {
    mgr, wkr,
    mgrContainer, wkrContainer,
    mgrGfx, wkrGfx,
    wkrRuneTexts,
    mgrBubble, wkrBubble,
    taskGfx, delegArrow, taskCard,
    phaseLabel, phaseSubLabel, phaseBar, progressGfx,
    taskComplete: false,
  }
}

// ---------------------------------------------------------------------------
// Phase enter — reset volatile state
// ---------------------------------------------------------------------------

function onPhaseEnter(scene: SceneData, phase: Phase): void {
  hideBubble(scene.mgrBubble)
  hideBubble(scene.wkrBubble)
  scene.delegArrow.visible = false
  scene.taskCard.container.visible = false

  if (phase === 'idle') {
    // New cycle: reset worker position and task state
    scene.taskComplete = false
    scene.wkr = {
      ...scene.wkr,
      x: WKR_HOME_X, y: FIGURE_CENTER_Y,
      targetX: WKR_HOME_X, targetY: FIGURE_CENTER_Y,
      walkTime: 0, facingLeft: false,
    }
  }
}

// ---------------------------------------------------------------------------
// Per-frame update
// ---------------------------------------------------------------------------

function updateScene(
  scene: SceneData,
  phase: Phase,
  phaseMs: number,
  totalMs: number,
  dt: number,
): void {
  const t = phaseMs / 1000
  const tt = totalMs / 1000
  const fraction = Math.min(1, phaseMs / PHASE_MS[phase])
  let { mgr, wkr } = scene

  // ---- Phase logic ----
  switch (phase) {
    case 'idle': {
      // Manager bobs gently
      mgr = { ...mgr, y: FIGURE_CENTER_Y + Math.sin(tt * 1.8) * 1.5 }
      // Worker wanders in a small area (re-pick target near start of phase)
      if (phaseMs < 60) {
        wkr = {
          ...wkr,
          targetX: WKR_HOME_X + (Math.random() - 0.5) * 70,
          targetY: FIGURE_CENTER_Y + (Math.random() - 0.5) * 18,
        }
      }
      wkr = moveToward(wkr, wkr.targetX, wkr.targetY, dt)
      // "?" bubble fades in after 1.5s
      if (t > 1.5) {
        const a = Math.min(1, (t - 1.5) * 3)
        showBubble(scene.mgrBubble, MGR_BUBBLE_CS.idle ?? '?', mgr.x, mgr.y + HEAD_TOP - 4, a)
      }
      break
    }

    case 'calling': {
      mgr = { ...mgr, facingLeft: false }
      showBubble(scene.mgrBubble, MGR_BUBBLE_CS.calling ?? 'Hey!', mgr.x, mgr.y + HEAD_TOP - 4)
      // Worker turns toward manager and starts walking
      wkr = { ...wkr, facingLeft: true }
      wkr = moveToward(wkr, MGR_HOME_X + 95, FIGURE_CENTER_Y, dt)
      break
    }

    case 'meeting': {
      hideBubble(scene.mgrBubble)
      wkr = moveToward(wkr, MGR_HOME_X + 90, FIGURE_CENTER_Y, dt)
      mgr = { ...mgr, facingLeft: false }
      wkr = { ...wkr, facingLeft: true }
      break
    }

    case 'briefing': {
      mgr = { ...mgr, facingLeft: false }
      wkr = { ...wkr, facingLeft: true }
      showBubble(
        scene.mgrBubble,
        MGR_BUBBLE_CS.briefing ?? 'Build the bridge\nat Sector 7!',
        mgr.x,
        mgr.y + HEAD_TOP - 4,
      )
      break
    }

    case 'acknowledging': {
      wkr = { ...wkr, facingLeft: true }
      showBubble(
        scene.wkrBubble,
        WKR_BUBBLE_CS.acknowledging ?? "Understood!\nI'm on it!",
        wkr.x,
        wkr.y + HEAD_TOP - 4,
      )
      break
    }

    case 'executing': {
      // Animated delegation arrow Manager → task
      drawDelegArrow(scene.delegArrow, mgr.x + 18, TASK_X - 32, FIGURE_CENTER_Y - 55, t)
      scene.delegArrow.visible = true
      // Animated task card flying on arc in first half of phase
      const cardT = Math.min(1, fraction * 2.5)
      if (cardT < 1) {
        const pt = arcPoint(mgr.x + 10, mgr.y - 10, wkr.x - 10, wkr.y - 10, cardT, 70)
        scene.taskCard.container.position.set(pt.x, pt.y)
        scene.taskCard.container.visible = true
        scene.taskCard.container.rotation = cardT * 0.4
      } else {
        scene.taskCard.container.visible = false
      }
      // Worker walks to task
      wkr = moveToward(wkr, TASK_X - 50, FIGURE_CENTER_Y, dt)
      mgr = { ...mgr, facingLeft: false }
      break
    }

    case 'working': {
      // Worker at task position
      const dots = '.'.repeat(1 + (Math.floor(t * 2) % 3))
      const workingBase = WKR_BUBBLE_CS.working ?? 'Pracuji'
      showBubble(scene.wkrBubble, `${workingBase}${dots}`, wkr.x, wkr.y + HEAD_TOP - 4)
      // Slight bob while working
      wkr = { ...wkr, walkTime: wkr.walkTime + dt / 600 }
      break
    }

    case 'completing': {
      scene.taskComplete = true
      const a = t < 0.4 ? t / 0.4 : 1
      showBubble(scene.wkrBubble, WKR_BUBBLE_CS.completing ?? 'Hotovo! \u2713', wkr.x, wkr.y + HEAD_TOP - 4, a)
      break
    }

    case 'reporting': {
      wkr = moveToward(wkr, MGR_HOME_X + 90, FIGURE_CENTER_Y, dt)
      wkr = { ...wkr, facingLeft: true }
      break
    }

    case 'celebrating': {
      mgr = { ...mgr, facingLeft: false }
      wkr = { ...wkr, facingLeft: true }
      showBubble(scene.mgrBubble, MGR_BUBBLE_CS.celebrating ?? 'Excellent work!', mgr.x, mgr.y + HEAD_TOP - 4)
      if (t > 0.6) {
        showBubble(
          scene.wkrBubble,
          WKR_BUBBLE_CS.celebrating ?? 'Ready for the\nnext task!',
          wkr.x,
          wkr.y + HEAD_TOP - 4,
        )
      }
      // Celebratory bob
      const bounce = Math.abs(Math.sin(tt * 6)) * 4
      mgr = { ...mgr, y: FIGURE_CENTER_Y - bounce }
      wkr = { ...wkr, y: FIGURE_CENTER_Y - bounce * 0.8 }
      break
    }
  }

  // ---- Persist mutations back ----
  scene.mgr = mgr
  scene.wkr = wkr

  // ---- Task marker ----
  drawTaskMarker(scene.taskGfx, scene.taskComplete, tt)

  // ---- Rune / pulse / glow effects on the worker ----
  const { runTime: wkrRunTime, completionAge: wkrCompletionAge } =
    calcDelegationRuneState(phase, phaseMs)

  scene.wkrRuneTexts.forEach((runeText, i) => {
    if (wkrRunTime !== null) {
      // Orbiting pulse while working
      const rs = calcRuneOrbit(i, RUNE_COUNT, wkrRunTime, WKR_COLOR)
      runeText.visible = rs.visible
      runeText.x = rs.x
      runeText.y = rs.y
      runeText.alpha = rs.alpha
      runeText.scale.set(rs.scale)
      runeText.tint = rs.tint
    } else if (wkrCompletionAge !== null) {
      // Expanding flash on task completion
      const rs = calcRuneFlash(wkrCompletionAge, i, RUNE_COUNT)
      runeText.visible = rs.visible
      runeText.x = rs.x
      runeText.y = rs.y
      runeText.alpha = rs.alpha
      runeText.scale.set(rs.scale)
      runeText.tint = rs.tint
    } else {
      runeText.visible = false
    }
  })

  // ---- Draw stick figures ----
  scene.mgrContainer.position.set(mgr.x, mgr.y)
  scene.wkrContainer.position.set(wkr.x, wkr.y)
  drawStickFigure(scene.mgrGfx, mgr as AgentState, false)
  drawStickFigure(scene.wkrGfx, wkr as AgentState, false, wkrRunTime, wkrCompletionAge)

  // ---- Phase info bar ----
  const barH = 60
  scene.phaseBar.clear()
  scene.phaseBar.rect(0, H - barH, W, barH)
  scene.phaseBar.fill({ color: 0x1a252f, alpha: 0.88 })

  scene.phaseLabel.text = PHASE_TEXT[phase]
  scene.phaseSubLabel.text = PHASE_TEXT_CS[phase]

  // Progress fill
  scene.progressGfx.clear()
  scene.progressGfx.rect(0, H - 3, W * fraction, 3)
  scene.progressGfx.fill({ color: 0x3498db, alpha: 0.85 })
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

export default function DelegationScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    let app: PIXI.Application | null = null
    let destroyed = false

    async function init() {
      app = new PIXI.Application()
      await app.init({
        width: W,
        height: H,
        backgroundColor: 0xd6eaf8,
        antialias: true,
        resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        autoDensity: true,
      })

      if (destroyed || !mountRef.current) {
        app.destroy(true)
        return
      }

      mountRef.current.appendChild(app.canvas)
      const scene = buildScene(app)

      let phase: Phase = 'idle'
      let phaseMs = 0
      let totalMs = 0
      onPhaseEnter(scene, phase)

      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS
        totalMs += dt
        phaseMs += dt
        updateScene(scene, phase, phaseMs, totalMs, dt)
        if (phaseMs >= PHASE_MS[phase]) {
          phaseMs = 0
          phase = nextPhase(phase)
          onPhaseEnter(scene, phase)
        }
      })
    }

    init()

    return () => {
      destroyed = true
      app?.destroy(true)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="flex items-center justify-center w-full"
      style={{ background: '#0f172a', minHeight: '100vh' }}
    />
  )
}
