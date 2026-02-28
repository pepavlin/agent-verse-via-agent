'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Link from 'next/link'
import * as PIXI from 'pixi.js'
import { useSession } from 'next-auth/react'
import { MAP_CONFIG, GRID_OBJECTS, worldSize } from './grid-config'
import { AGENTS, type AgentDef } from './agents-config'
import { AgentState, createAgentState, updateAgent, hitTestAgent, agentInRect, WorldRect } from './agent-logic'
import { drawStickFigure } from './agent-drawing'
import AgentPanel, { type RunTaskPayload, type EditSavePayload, type WaitRunPhase } from './AgentPanel'
import { RunEngine } from '../run-engine'
import type { ChildAgentDef } from '../run-engine'
import type { AgentConfigSnapshot } from '../run-engine/types'
import { AgentRunInfo, runStarted, runCompleted, runFailed, tickRunInfo } from './agent-run-state'
import { RUNE_CHARS, RUNE_COUNT, calcRuneOrbit, calcRuneFlash } from './agent-runes'
import { useInbox } from './use-inbox'
import { InboxToggleButton, InboxPanel } from './Inbox'
import QuestionModal, { type PendingQuestion } from './QuestionModal'
import AccountSettings from './AccountSettings'
import type { AgentRunParams } from '../../lib/llm'

// Re-export so external code can import from either location
export { MAP_CONFIG, GRID_OBJECTS, worldSize } from './grid-config'
export type { GridObject } from './grid-config'

// ---------------------------------------------------------------------------
// Config snapshot helper
// ---------------------------------------------------------------------------

/**
 * Capture an immutable snapshot of the agent's mutable configuration fields.
 * This snapshot is stored on the run at creation time so that any subsequent
 * edits to the agent (name, goal, persona) do not affect in-flight runs.
 */
function snapshotAgentConfig(def: AgentDef): AgentConfigSnapshot {
  return {
    id: def.id,
    name: def.name,
    role: def.role,
    ...(def.goal !== undefined && { goal: def.goal }),
    ...(def.persona !== undefined && { persona: def.persona }),
    configVersion: def.configVersion,
  }
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface ViewState {
  x: number
  y: number
  zoom: number
}

interface AgentEntry {
  state: AgentState
  gfx: PIXI.Graphics
  container: PIXI.Container
  /** Rune glyph Text objects that orbit the agent during task runs. */
  runeTexts: PIXI.Text[]
}

interface SelectedAgentInfo {
  id: string
  name: string
  role: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Grid2D() {
  const { data: session, status } = useSession()
  const mountRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const worldRef = useRef<PIXI.Container | null>(null)
  const view = useRef<ViewState>({ x: 0, y: 0, zoom: 1 })
  const dragging = useRef(false)
  const lastPtr = useRef({ x: 0, y: 0 })

  // Agent system refs (updated imperatively — no React re-renders)
  const agentsRef = useRef<Map<string, AgentEntry>>(new Map())
  // Multi-selection: a Set of selected agent IDs
  const selectedAgentIdsRef = useRef<Set<string>>(new Set())
  const followingAgentRef = useRef<string | null>(null)

  // Rectangle selection refs
  const isRectSelectingRef = useRef(false)
  const rectSelectStartRef = useRef<{ x: number; y: number } | null>(null)
  const rectSelectEndRef = useRef<{ x: number; y: number } | null>(null)
  const selectionRectGfxRef = useRef<PIXI.Graphics | null>(null)

  // Run engine — persistent singleton; drives pulse/glow animations via events
  const runEngineRef = useRef<RunEngine>(new RunEngine())
  // Per-agent run animation state, read each frame by the pixi ticker
  const agentRunInfoRef = useRef<Map<string, AgentRunInfo>>(new Map())

  const [zoomPct, setZoomPct] = useState(25)
  const [mouseCell, setMouseCell] = useState<{ col: number; row: number } | null>(null)
  // Array of selected agents (empty = nothing selected, 1 = single, 2+ = multi)
  const [selectedAgents, setSelectedAgents] = useState<SelectedAgentInfo[]>([])

  // Agent Panel state
  const [panelAgentId, setPanelAgentId] = useState<string | null>(null)
  // Mutable copy of agent definitions (allows editing name/goal/persona at runtime)
  const [agentDefs, setAgentDefs] = useState<AgentDef[]>(AGENTS)

  // Wait-delivery inline result state
  // Tracks the phase of the currently open wait-delivery run so that the
  // AgentPanel can transition from the run form → spinner → inline result.
  const [waitPhase, setWaitPhase] = useState<WaitRunPhase>('idle')
  const [waitResult, setWaitResult] = useState<string | undefined>()
  const [waitError, setWaitError] = useState<string | undefined>()
  // Ref to the run ID that "owns" the current wait phase, used to guard
  // against stale updates when the panel is closed mid-run or the user
  // switches to a different agent.
  const waitRunIdRef = useRef<string | null>(null)

  // Inbox state — manages message feed for inbox-delivery task results
  const { messages, unreadCount, addMessage, updateMessage, addChildMessage, dismissMessage, clearAll, markRead } = useInbox()
  const [inboxOpen, setInboxOpen] = useState(false)

  // Question modal — shown for wait-delivery runs when agent needs user clarification
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null)

  // Per-run LLM params ref — needed to build the resume executor with conversation context
  // Maps runId → the params used for the initial API call
  const runParamsRef = useRef<Map<string, Omit<AgentRunParams, 'apiKey'>>>(new Map())

  // Account settings modal
  const [settingsOpen, setSettingsOpen] = useState(false)

  // API key status — fetched once after login to show the setup banner
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [keyBannerDismissed, setKeyBannerDismissed] = useState(false)

  // Fetch API key status once the session is available, so we can show a
  // non-blocking setup banner for users who haven't configured their key yet.
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/user/api-key')
      .then((r) => r.json())
      .then((d) => setHasApiKey(d.hasKey === true))
      .catch(() => setHasApiKey(null))
  }, [status])

  // When AccountSettings closes, re-check API key status so the banner
  // disappears immediately after the user saves their key.
  useEffect(() => {
    if (settingsOpen) return
    if (status !== 'authenticated') return
    fetch('/api/user/api-key')
      .then((r) => r.json())
      .then((d) => setHasApiKey(d.hasKey === true))
      .catch(() => {})
  }, [settingsOpen, status])

  // -------------------------------------------------------------------------
  // Draw static world (grid + objects)
  // -------------------------------------------------------------------------

  const drawWorld = useCallback(() => {
    const world = worldRef.current
    if (!world) return
    world.removeChildren()

    const { COLS, ROWS, CELL_SIZE } = MAP_CONFIG
    const W = COLS * CELL_SIZE
    const H = ROWS * CELL_SIZE

    // Background
    const bg = new PIXI.Graphics()
    bg.rect(0, 0, W, H)
    bg.fill({ color: 0x1e293b })
    world.addChild(bg)

    // Grid lines
    const lines = new PIXI.Graphics()
    lines.setStrokeStyle({ color: 0x334155, width: 1 })
    for (let c = 0; c <= COLS; c++) {
      lines.moveTo(c * CELL_SIZE, 0)
      lines.lineTo(c * CELL_SIZE, H)
    }
    for (let r = 0; r <= ROWS; r++) {
      lines.moveTo(0, r * CELL_SIZE)
      lines.lineTo(W, r * CELL_SIZE)
    }
    lines.stroke()
    world.addChild(lines)

    // Map border
    const border = new PIXI.Graphics()
    border.rect(0, 0, W, H)
    border.stroke({ color: 0x475569, width: 3, alignment: 1 })
    world.addChild(border)

    // Objects
    for (const obj of GRID_OBJECTS) {
      const g = new PIXI.Graphics()
      const px = obj.col * CELL_SIZE
      const py = obj.row * CELL_SIZE
      const s = obj.size * CELL_SIZE
      const pad = Math.round(s * 0.08)

      if (obj.type === 'square') {
        g.roundRect(px + pad, py + pad, s - pad * 2, s - pad * 2, 6)
        g.fill({ color: obj.color })
        g.roundRect(px + pad, py + pad, s - pad * 2, s - pad * 2, 6)
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.4 })
      } else {
        const cx = px + s / 2
        const cy = py + s / 2
        const r = s / 2 - pad
        g.circle(cx, cy, r)
        g.fill({ color: obj.color })
        g.circle(cx, cy, r)
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.4 })
      }

      world.addChild(g)

      const lbl = new PIXI.Text({
        text: obj.label,
        style: {
          fontSize: 14,
          fill: 0xf1f5f9,
          fontFamily: 'ui-monospace, monospace',
          fontWeight: 'bold',
          dropShadow: { color: 0x000000, blur: 4, distance: 0, alpha: 0.8 },
        },
      })
      lbl.x = px + s / 2 - lbl.width / 2
      lbl.y = py + s + 6
      world.addChild(lbl)
    }
  }, [])

  // -------------------------------------------------------------------------
  // Apply view state → translate + scale world container
  // -------------------------------------------------------------------------

  const applyView = useCallback(() => {
    const app = appRef.current
    const world = worldRef.current
    if (!app || !world) return

    const { MIN_ZOOM, MAX_ZOOM } = MAP_CONFIG
    const { w: mapW, h: mapH } = worldSize()
    const v = view.current

    v.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom))

    const sw = app.renderer.width
    const sh = app.renderer.height
    const scaledW = mapW * v.zoom
    const scaledH = mapH * v.zoom

    const MARGIN = 50
    v.x = Math.max(MARGIN - scaledW, Math.min(sw - MARGIN, v.x))
    v.y = Math.max(MARGIN - scaledH, Math.min(sh - MARGIN, v.y))

    world.x = v.x
    world.y = v.y
    world.scale.set(v.zoom)

    setZoomPct(Math.round(v.zoom * 100))
  }, [])

  // -------------------------------------------------------------------------
  // Initialise pixi.js on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!mountRef.current) return
    let app: PIXI.Application

    const init = async () => {
      app = new PIXI.Application()
      await app.init({
        background: 0x0f172a,
        resizeTo: mountRef.current!,
        antialias: true,
      })

      mountRef.current!.appendChild(app.canvas)
      appRef.current = app

      const world = new PIXI.Container()
      app.stage.addChild(world)
      worldRef.current = world

      // Selection rect overlay — lives on stage (screen space), above world
      const selectionRectGfx = new PIXI.Graphics()
      app.stage.addChild(selectionRectGfx)
      selectionRectGfxRef.current = selectionRectGfx

      // Centre map at 25 % zoom
      const { w: mapW, h: mapH } = worldSize()
      const initialZoom = 0.25
      view.current = {
        x: (app.renderer.width - mapW * initialZoom) / 2,
        y: (app.renderer.height - mapH * initialZoom) / 2,
        zoom: initialZoom,
      }

      drawWorld()
      applyView()

      // ---- Create agent layer ----
      const agentLayer = new PIXI.Container()
      world.addChild(agentLayer)

      const agentsMap = new Map<string, AgentEntry>()
      for (const def of AGENTS) {
        const state = createAgentState(def)
        const container = new PIXI.Container()
        const gfx = new PIXI.Graphics()

        const label = new PIXI.Text({
          text: def.name,
          style: {
            fontSize: 10,
            fill: 0xffffff,
            fontFamily: 'ui-monospace, monospace',
            fontWeight: 'bold',
            dropShadow: { color: 0x000000, blur: 3, distance: 0, alpha: 0.9 },
          },
        })
        // Centre label above head; anchor (0.5, 1) = horizontal centre, bottom edge
        label.anchor.set(0.5, 1)
        label.y = -34

        // ---- Rune glyph Text objects (orbit agent head during task runs) ----
        const runeTexts = RUNE_CHARS.slice(0, RUNE_COUNT).map((char) => {
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

        // Runes sit below the name label so the label stays readable on top.
        container.addChild(gfx)
        for (const r of runeTexts) container.addChild(r)
        container.addChild(label)
        container.x = state.x
        container.y = state.y
        agentLayer.addChild(container)

        agentsMap.set(def.id, { state, gfx, container, runeTexts })
      }
      agentsRef.current = agentsMap

      /** Sync selectedAgentIdsRef → React state (for UI re-render) */
      function syncSelectionState() {
        const infos: SelectedAgentInfo[] = []
        for (const id of selectedAgentIdsRef.current) {
          const entry = agentsRef.current.get(id)
          if (entry) {
            infos.push({ id, name: entry.state.name, role: entry.state.role })
          }
        }
        setSelectedAgents(infos)
      }

      // ---- Ticker: animate agents each frame ----
      app.ticker.add((ticker: PIXI.Ticker) => {
        const now = Date.now()
        const { w: mW, h: mH } = worldSize()

        for (const [id, entry] of agentsRef.current) {
          entry.state = updateAgent(entry.state, ticker.deltaMS, mW, mH)
          entry.container.x = entry.state.x
          entry.container.y = entry.state.y

          // ---- Compute run-state animation params via pure tick function ----
          const runInfo = agentRunInfoRef.current.get(id)
          const { runTime, completionAge, glowExpired } = tickRunInfo(
            runInfo,
            ticker.deltaMS / 1000,
            now,
          )

          // Accumulate runTime in the stored ref so phase is continuous
          if (runInfo && runTime !== null) {
            runInfo.runTime = runTime
          }
          // Clear expired glow from the stored ref
          if (runInfo && glowExpired) {
            runInfo.completionStart = null
          }

          drawStickFigure(
            entry.gfx,
            entry.state,
            selectedAgentIdsRef.current.has(id),
            runTime,
            completionAge,
          )

          // ---- Animate rune glyphs ----
          entry.runeTexts.forEach((runeText, i) => {
            if (runTime !== null) {
              // Orbiting pulse while running
              const rs = calcRuneOrbit(i, RUNE_COUNT, runTime, entry.state.color)
              runeText.visible = rs.visible
              runeText.x = rs.x
              runeText.y = rs.y
              runeText.alpha = rs.alpha
              runeText.scale.set(rs.scale)
              runeText.tint = rs.tint
            } else if (completionAge !== null) {
              // Expanding flash on completion
              const rs = calcRuneFlash(completionAge, i, RUNE_COUNT)
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
        }

        // Follow selected agent (centre view on first selected)
        if (followingAgentRef.current) {
          const followEntry = agentsRef.current.get(followingAgentRef.current)
          if (followEntry) {
            view.current.x =
              app.renderer.width / 2 - followEntry.state.x * view.current.zoom
            view.current.y =
              app.renderer.height / 2 - followEntry.state.y * view.current.zoom
            applyView()
          }
        }

        // Draw selection rect overlay (screen space)
        const selGfx = selectionRectGfxRef.current
        if (selGfx) {
          selGfx.clear()
          if (
            isRectSelectingRef.current &&
            rectSelectStartRef.current &&
            rectSelectEndRef.current
          ) {
            const { x: x1, y: y1 } = rectSelectStartRef.current
            const { x: x2, y: y2 } = rectSelectEndRef.current
            const rx = Math.min(x1, x2)
            const ry = Math.min(y1, y2)
            const rw = Math.abs(x2 - x1)
            const rh = Math.abs(y2 - y1)
            selGfx.rect(rx, ry, rw, rh)
            selGfx.fill({ color: 0x6366f1, alpha: 0.15 })
            selGfx.rect(rx, ry, rw, rh)
            selGfx.stroke({ color: 0x6366f1, width: 1.5, alpha: 0.85 })
          }
        }
      })

      // ---- Pointer events ----
      // Controls:
      //   Left button drag   → rectangle selection
      //   Left button click  → open Agent Panel on agent hit; deselect on empty
      //   Middle button drag → pan camera
      //   Scroll wheel       → zoom
      let pointerDownX = 0
      let pointerDownY = 0

      app.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
        pointerDownX = e.clientX
        pointerDownY = e.clientY
        app.canvas.setPointerCapture(e.pointerId)

        const canvasRect = app.canvas.getBoundingClientRect()
        const sx = e.clientX - canvasRect.left
        const sy = e.clientY - canvasRect.top

        if (e.button === 1) {
          // Middle mouse button: pan camera
          e.preventDefault()
          dragging.current = true
          lastPtr.current = { x: e.clientX, y: e.clientY }
          ;(app.canvas as HTMLCanvasElement).style.cursor = 'grabbing'
        } else if (e.button === 0) {
          // Left mouse button: start rectangle selection
          isRectSelectingRef.current = true
          rectSelectStartRef.current = { x: sx, y: sy }
          rectSelectEndRef.current = { x: sx, y: sy }
          ;(app.canvas as HTMLCanvasElement).style.cursor = 'crosshair'
        }
      })

      app.canvas.addEventListener('pointermove', (e: PointerEvent) => {
        // Update hovered-cell display
        const canvasRect = app.canvas.getBoundingClientRect()
        const sx = e.clientX - canvasRect.left
        const sy = e.clientY - canvasRect.top
        const wx = (sx - view.current.x) / view.current.zoom
        const wy = (sy - view.current.y) / view.current.zoom
        const col = Math.floor(wx / MAP_CONFIG.CELL_SIZE)
        const row = Math.floor(wy / MAP_CONFIG.CELL_SIZE)
        const inBounds =
          col >= 0 && col < MAP_CONFIG.COLS && row >= 0 && row < MAP_CONFIG.ROWS
        setMouseCell(inBounds ? { col, row } : null)

        if (isRectSelectingRef.current) {
          // Update rect end point
          rectSelectEndRef.current = { x: sx, y: sy }
          return
        }

        if (!dragging.current) return
        // Camera pan via middle mouse button
        const dx = e.clientX - lastPtr.current.x
        const dy = e.clientY - lastPtr.current.y
        lastPtr.current = { x: e.clientX, y: e.clientY }
        view.current.x += dx
        view.current.y += dy
        applyView()
      })

      app.canvas.addEventListener('pointerup', (e: PointerEvent) => {
        const movedX = e.clientX - pointerDownX
        const movedY = e.clientY - pointerDownY
        const isClick = movedX * movedX + movedY * movedY < 25 // < 5 px

        const canvasRect = app.canvas.getBoundingClientRect()
        const sx = e.clientX - canvasRect.left
        const sy = e.clientY - canvasRect.top
        const wx = (sx - view.current.x) / view.current.zoom
        const wy = (sy - view.current.y) / view.current.zoom

        if (e.button === 1) {
          // Middle mouse released: stop pan
          dragging.current = false
          ;(app.canvas as HTMLCanvasElement).style.cursor = 'default'
          return
        }

        if (isRectSelectingRef.current) {
          if (!isClick) {
            // Commit rectangle selection
            const start = rectSelectStartRef.current!
            const worldRect: WorldRect = {
              x1: (Math.min(start.x, sx) - view.current.x) / view.current.zoom,
              y1: (Math.min(start.y, sy) - view.current.y) / view.current.zoom,
              x2: (Math.max(start.x, sx) - view.current.x) / view.current.zoom,
              y2: (Math.max(start.y, sy) - view.current.y) / view.current.zoom,
            }

            const newIds: Set<string> = new Set()
            for (const [id, entry] of agentsRef.current) {
              if (agentInRect(entry.state, worldRect)) {
                newIds.add(id)
              }
            }
            selectedAgentIdsRef.current = newIds
            followingAgentRef.current = null
            syncSelectionState()
          }

          // Reset rect state
          isRectSelectingRef.current = false
          rectSelectStartRef.current = null
          rectSelectEndRef.current = null
          ;(app.canvas as HTMLCanvasElement).style.cursor = 'default'

          // If it was just a click (not a drag), handle agent selection
          if (isClick) {
            let hitId: string | null = null
            for (const [id, entry] of agentsRef.current) {
              if (hitTestAgent(entry.state, wx, wy)) {
                hitId = id
                break
              }
            }
            if (hitId) {
              selectedAgentIdsRef.current = new Set([hitId])
              followingAgentRef.current = null
              syncSelectionState()
              // Open Agent Panel for single-agent click
              setPanelAgentId(hitId)
            } else {
              selectedAgentIdsRef.current = new Set()
              followingAgentRef.current = null
              setSelectedAgents([])
            }
          }
        }
      })

      app.canvas.addEventListener('pointerleave', () => {
        dragging.current = false
        isRectSelectingRef.current = false
        rectSelectStartRef.current = null
        rectSelectEndRef.current = null
        setMouseCell(null)
        ;(app.canvas as HTMLCanvasElement).style.cursor = 'default'
      })

      // Prevent middle-click from triggering browser scroll mode
      app.canvas.addEventListener('auxclick', (e: MouseEvent) => {
        e.preventDefault()
      })

      // ---- Zoom via scroll wheel ----
      app.canvas.addEventListener(
        'wheel',
        (e: WheelEvent) => {
          e.preventDefault()
          const rect = app.canvas.getBoundingClientRect()
          const mx = e.clientX - rect.left
          const my = e.clientY - rect.top

          const oldZ = view.current.zoom
          const factor = e.deltaY < 0 ? 1.12 : 0.89
          const newZ = Math.max(
            MAP_CONFIG.MIN_ZOOM,
            Math.min(MAP_CONFIG.MAX_ZOOM, oldZ * factor),
          )

          view.current.x = mx - (mx - view.current.x) * (newZ / oldZ)
          view.current.y = my - (my - view.current.y) * (newZ / oldZ)
          view.current.zoom = newZ
          applyView()
        },
        { passive: false },
      )

      ;(app.canvas as HTMLCanvasElement).style.cursor = 'default'
    }

    // ---- Subscribe to RunEngine events ----
    // These handlers run outside the pixi ticker (async, event-driven) and
    // write into agentRunInfoRef which the ticker reads each frame.
    const engine = runEngineRef.current

    const unsubStarted = engine.on('run:started', (run) => {
      agentRunInfoRef.current.set(run.agentId, runStarted())
    })

    const unsubDelegating = engine.on('run:delegating', (run) => {
      // Parent is now orchestrating children — keep pulse active on the parent agent
      agentRunInfoRef.current.set(run.agentId, runStarted())
    })

    const unsubCompleted = engine.on('run:completed', (run) => {
      agentRunInfoRef.current.set(run.agentId, runCompleted())
    })

    // Awaiting: agent raised a clarifying question — show the same completion glow
    // The actual question UI is handled by delivery-specific logic in handleRunTask.
    const unsubAwaiting = engine.on('run:awaiting', (_run) => {
      // Pulse stops; glow shows. The delivery handler wires up the question UI.
      // We intentionally do not call runCompleted() here for wait delivery
      // because the question modal must remain open — the pixi state is set
      // by the delivery-specific handler below.
    })

    // Resumed: user answered the question — run is running again
    const unsubResumed = engine.on('run:resumed', (run) => {
      agentRunInfoRef.current.set(run.agentId, runStarted())
    })

    const unsubFailed = engine.on('run:failed', (run) => {
      // Clear all animation state — no glow is shown on failure
      agentRunInfoRef.current.set(run.agentId, runFailed())
    })

    init()

    return () => {
      unsubStarted()
      unsubDelegating()
      unsubCompleted()
      unsubAwaiting()
      unsubResumed()
      unsubFailed()
      appRef.current?.destroy(true, { children: true })
      appRef.current = null
    }
  }, [drawWorld, applyView])

  // -------------------------------------------------------------------------
  // Button handlers
  // -------------------------------------------------------------------------

  const zoomIn = () => {
    view.current.zoom = Math.min(MAP_CONFIG.MAX_ZOOM, view.current.zoom + MAP_CONFIG.ZOOM_STEP)
    applyView()
  }

  const zoomOut = () => {
    view.current.zoom = Math.max(MAP_CONFIG.MIN_ZOOM, view.current.zoom - MAP_CONFIG.ZOOM_STEP)
    applyView()
  }

  const resetView = () => {
    const app = appRef.current
    if (!app) return
    const { w: mapW, h: mapH } = worldSize()
    const z = 0.25
    view.current = {
      x: (app.renderer.width - mapW * z) / 2,
      y: (app.renderer.height - mapH * z) / 2,
      zoom: z,
    }
    applyView()
  }

  // ---- Multi-selection panel handler ----

  const closeMultiSelection = () => {
    selectedAgentIdsRef.current = new Set()
    followingAgentRef.current = null
    setSelectedAgents([])
  }

  // ---- Agent Panel handlers ----

  // Reset wait-delivery state whenever the panel switches to a different agent
  // (or closes). This prevents stale results from a previous run appearing in
  // a freshly opened panel.
  useEffect(() => {
    setWaitPhase('idle')
    setWaitResult(undefined)
    setWaitError(undefined)
    waitRunIdRef.current = null
  }, [panelAgentId])

  const handlePanelClose = () => {
    setPanelAgentId(null)
    selectedAgentIdsRef.current = new Set()
    followingAgentRef.current = null
    setSelectedAgents([])
  }

  const handleNewTask = () => {
    waitRunIdRef.current = null
    setWaitPhase('idle')
    setWaitResult(undefined)
    setWaitError(undefined)
  }

  /**
   * Build an executor that calls the /api/run endpoint.
   * Optionally includes previous question + user answer for resumed runs.
   * Optionally includes child results context for delegation runs.
   */
  const buildRunExecutor = (
    def: AgentDef,
    taskDescription: string,
    previousQuestion?: string,
    userAnswer?: string,
    childContext?: string,
  ) => async (): Promise<string> => {
    const body: Record<string, string> = {
      agentId: def.id,
      agentName: def.name,
      agentRole: def.role,
      taskDescription: childContext
        ? `${taskDescription}\n\nSub-agent results:\n${childContext}`
        : taskDescription,
    }
    if (def.goal) body.agentGoal = def.goal
    if (def.persona) body.agentPersona = def.persona
    if (previousQuestion) body.previousQuestion = previousQuestion
    if (userAnswer) body.userAnswer = userAnswer

    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 402) {
        setSettingsOpen(true)
      }
      throw new Error(data.userMessage ?? 'Nastala chyba. Zkus to znovu.')
    }

    return data.result as string
  }

  const handleRunTask = (payload: RunTaskPayload) => {
    const def = agentDefs.find((d) => d.id === payload.agentId)
    if (!def) return

    const engine = runEngineRef.current

    // Resolve child agents if this agent has delegation configured
    const childDefs = (def.childAgentIds ?? [])
      .map((id) => agentDefs.find((d) => d.id === id))
      .filter((d): d is AgentDef => d !== undefined)

    const isDelegation = childDefs.length > 0

    // Capture an immutable snapshot of the agent's config at this exact moment.
    // This ensures that any subsequent edits to the agent (name, goal, persona)
    // do not affect this run — the snapshot is stored on the Run object and used
    // for all execution steps, including delegation and resume.
    const configSnapshot = snapshotAgentConfig(def)

    const run = engine.createRun(payload.agentId, def.name, def.role, payload.task, undefined, configSnapshot)

    // Store params for potential resume (we need taskDescription + agent context)
    runParamsRef.current.set(run.id, {
      agentName: def.name,
      agentRole: def.role,
      agentGoal: def.goal,
      agentPersona: def.persona,
      taskDescription: payload.task,
    })

    if (payload.delivery === 'inbox') {
      // Add a card immediately — delegation shows amber badge, regular shows question
      addMessage({
        id: run.id,
        type: isDelegation ? 'delegating' : 'question',
        agentName: def.name,
        agentColor: def.color,
        task: payload.task,
        text: isDelegation
          ? `Deleguji na ${childDefs.map((c) => c.name).join(', ')}…`
          : 'Zpracovávám úkol…',
      })

      if (isDelegation) {
        // Subscribe to child run events to update child message cards
        const unsubChildStarted = engine.on('run:started', (startedRun) => {
          const parentRun = engine.getParentRun(startedRun.id)
          if (!parentRun || parentRun.id !== run.id) return
          const childDef = agentDefs.find((d) => d.id === startedRun.agentId)
          if (!childDef) return
          addChildMessage(run.id, {
            id: startedRun.id,
            type: 'question',
            agentName: childDef.name,
            agentColor: childDef.color,
            text: 'Zpracovávám…',
          })
        })

        const unsubChildCompleted = engine.on('run:completed', (completedRun) => {
          const parentRun = engine.getParentRun(completedRun.id)
          if (!parentRun || parentRun.id !== run.id) return
          const childDef = agentDefs.find((d) => d.id === completedRun.agentId)
          if (!childDef) return
          addChildMessage(run.id, {
            id: completedRun.id,
            type: 'done',
            agentName: childDef.name,
            agentColor: childDef.color,
            text: completedRun.result ?? 'Hotovo.',
          })
        })

        const unsubChildFailed = engine.on('run:failed', (failedRun) => {
          const parentRun = engine.getParentRun(failedRun.id)
          if (!parentRun || parentRun.id !== run.id) return
          const childDef = agentDefs.find((d) => d.id === failedRun.agentId)
          if (!childDef) return
          addChildMessage(run.id, {
            id: failedRun.id,
            type: 'error',
            agentName: childDef.name,
            agentColor: childDef.color,
            text: failedRun.error ?? 'Nastala chyba.',
          })
        })

        // When parent delegation completes
        const unsubRunCompleted = engine.on('run:completed', (completedRun) => {
          if (completedRun.id !== run.id) return
          updateMessage(run.id, { type: 'done', text: completedRun.result ?? 'Hotovo.', awaitingAnswer: false })
          unsubChildStarted()
          unsubChildCompleted()
          unsubChildFailed()
          unsubRunCompleted()
          unsubRunFailed()
        })

        const unsubRunFailed = engine.on('run:failed', (failedRun) => {
          if (failedRun.id !== run.id) return
          updateMessage(run.id, { type: 'error', text: failedRun.error ?? 'Nastala chyba.', awaitingAnswer: false })
          unsubChildStarted()
          unsubChildCompleted()
          unsubChildFailed()
          unsubRunCompleted()
          unsubRunFailed()
        })
      } else {
        // Subscribe to this specific run's terminal events (non-delegation)
        const unsubRunCompleted = engine.on('run:completed', (completedRun) => {
          if (completedRun.id !== run.id) return
          updateMessage(run.id, { type: 'done', text: completedRun.result ?? 'Hotovo.', awaitingAnswer: false })
          unsubRunCompleted()
        })

        const unsubRunAwaiting = engine.on('run:awaiting', (awaitingRun) => {
          if (awaitingRun.id !== run.id) return
          // Show pulse-stopped completion glow
          agentRunInfoRef.current.set(awaitingRun.agentId, runCompleted())
          // Update inbox card: show question + enable reply form
          updateMessage(run.id, {
            type: 'question',
            text: awaitingRun.question ?? 'Agent potřebuje upřesnění.',
            awaitingAnswer: true,
          })
          unsubRunAwaiting()

          // Subscribe to resumed (re-running)
          const unsubRunResumed = engine.on('run:resumed', (resumedRun) => {
            if (resumedRun.id !== run.id) return
            updateMessage(run.id, {
              type: 'question',
              text: 'Zpracovávám odpověď…',
              awaitingAnswer: false,
            })
            unsubRunResumed()
          })
        })

        const unsubRunFailed = engine.on('run:failed', (failedRun) => {
          if (failedRun.id !== run.id) return
          updateMessage(run.id, { type: 'error', text: failedRun.error ?? 'Nastala chyba.', awaitingAnswer: false })
          unsubRunFailed()
        })
      }

      // Open inbox so the user sees the new task card
      setInboxOpen(true)
    } else {
      // ── Wait delivery ─────────────────────────────────────────────────────
      // The panel stays open. We immediately show a spinner and update it to
      // either the result or an error once the run terminates.
      waitRunIdRef.current = run.id
      setWaitPhase('running')

      // When the agent needs clarification, pause the spinner and open the
      // QuestionModal. The spinner resumes on run:resumed (handled above in
      // the global RunEngine subscriber).
      const unsubWaitAwaiting = engine.on('run:awaiting', (awaitingRun) => {
        if (awaitingRun.id !== run.id) return
        // Show completion glow while waiting for answer
        agentRunInfoRef.current.set(awaitingRun.agentId, runCompleted())
        // Open question modal
        setPendingQuestion({
          runId: awaitingRun.id,
          agentName: def.name,
          agentColor: def.color,
          question: awaitingRun.question ?? 'Agent potřebuje upřesnění.',
        })
        unsubWaitAwaiting()
      })

      // Use let + optional chaining so each handler can clean up both
      // subscriptions (a run can only complete XOR fail, never both).
      let unsubWaitCompleted: (() => void) | null = null
      let unsubWaitFailed: (() => void) | null = null

      unsubWaitCompleted = engine.on('run:completed', (completedRun) => {
        if (completedRun.id !== run.id) return
        agentRunInfoRef.current.set(completedRun.agentId, runCompleted())
        // Guard: only update UI if this run is still the active wait run
        if (waitRunIdRef.current === run.id) {
          setWaitPhase('done')
          setWaitResult(completedRun.result ?? 'Hotovo.')
        }
        unsubWaitCompleted?.()
        unsubWaitFailed?.()
      })

      unsubWaitFailed = engine.on('run:failed', (failedRun) => {
        if (failedRun.id !== run.id) return
        agentRunInfoRef.current.set(failedRun.agentId, runFailed())
        // Guard: only update UI if this run is still the active wait run
        if (waitRunIdRef.current === run.id) {
          setWaitPhase('error')
          setWaitError(failedRun.error ?? 'Nastala chyba.')
        }
        unsubWaitCompleted?.()
        unsubWaitFailed?.()
      })
    }

    // Start the run — with or without children
    if (isDelegation) {
      // Build child agent defs with config snapshots captured NOW (before any edits).
      // Snapshots are stored in the child Run objects via startRunWithChildren → createRun,
      // ensuring that edits made after delegation starts do not affect child execution.
      const childSnapshotMap = new Map<string, AgentConfigSnapshot>(
        childDefs.map((cd) => [cd.id, snapshotAgentConfig(cd)]),
      )
      const childAgentDefs: ChildAgentDef[] = childDefs.map((cd) => ({
        agentId: cd.id,
        agentName: cd.name,
        agentRole: cd.role,
        configSnapshot: childSnapshotMap.get(cd.id),
      }))

      // Factory: each child gets its own executor using the SNAPSHOTTED config.
      // We use the snapshot map (captured above) rather than looking up agentDefs
      // at executor call time, which could return a post-edit config.
      const childExecutorFactory = (childAgentId: string) => {
        const snapshot = childSnapshotMap.get(childAgentId)
        if (!snapshot) return async () => `Child agent ${childAgentId} not found.`
        // Convert snapshot to minimal AgentDef shape for buildRunExecutor
        const snapshotDef: AgentDef = {
          id: snapshot.id,
          name: snapshot.name,
          role: snapshot.role,
          color: 0,
          startCol: 0,
          startRow: 0,
          goal: snapshot.goal,
          persona: snapshot.persona,
          configVersion: snapshot.configVersion,
        }
        return buildRunExecutor(snapshotDef, payload.task)
      }

      // Parent executor factory: receives completed child runs for synthesis.
      // Uses the parent's config snapshot (captured above) and child run snapshots
      // for labelling — never the current (potentially edited) agentDefs.
      const parentExecutorFactory = (completedChildRuns: import('../run-engine').Run[]) => {
        const childContext = completedChildRuns
          .map((cr) => {
            // Prefer the config snapshot stored on the child run; fall back to ID.
            const snap = cr.configSnapshot
            const label = snap
              ? `[${snap.name} — ${snap.role}]`
              : `[${cr.agentId}]`
            return cr.result
              ? `${label}\n${cr.result}`
              : `${label} (failed)\n${cr.error ?? 'Unknown error'}`
          })
          .join('\n\n')
        // Use the parent's snapshotted config (def is captured at handleRunTask call time)
        return buildRunExecutor(def, payload.task, undefined, undefined, childContext)
      }

      engine.startRunWithChildren(run.id, childAgentDefs, parentExecutorFactory, childExecutorFactory)
    } else {
      // Regular single-agent run
      engine.startRun(run.id, buildRunExecutor(def, payload.task))
    }

    // Inbox delivery: close the panel so the user can see the inbox feed.
    // Wait delivery: keep the panel open — it now shows a spinner that
    // transitions to the inline result once the run completes.
    if (payload.delivery === 'inbox') {
      handlePanelClose()
    }
  }

  /**
   * Handle user submitting an answer to a question.
   * Works for both wait-delivery (QuestionModal) and inbox-delivery (inline form).
   *
   * Config isolation: we always use the config snapshot stored on the run at creation
   * time, NOT the current `agentDefs` state. This ensures that edits made to the agent
   * while the run was in 'awaiting' state (waiting for a user answer) have no effect
   * on the resumed execution — the same model, persona, and goal are used throughout
   * the entire run lifecycle.
   */
  const handleReplyToQuestion = (runId: string, answer: string) => {
    const engine = runEngineRef.current
    const run = engine.getRun(runId)
    if (!run || run.status !== 'awaiting') return

    // Close the wait-delivery modal if open (do this early, before async work)
    setPendingQuestion(null)

    // Prefer the config snapshot stored on the run (set at run creation time).
    // This is the primary mechanism ensuring config isolation for resumed runs.
    if (run.configSnapshot) {
      const snap = run.configSnapshot
      const snapshotDef: AgentDef = {
        id: snap.id,
        name: snap.name,
        role: snap.role,
        color: 0,
        startCol: 0,
        startRow: 0,
        goal: snap.goal,
        persona: snap.persona,
        configVersion: snap.configVersion,
      }
      engine.resumeRun(
        runId,
        answer,
        buildRunExecutor(snapshotDef, run.taskDescription, run.question, answer),
      )
      return
    }

    // Fallback for runs created before config versioning was introduced
    // (no configSnapshot present). Use params from runParamsRef if available.
    const params = runParamsRef.current.get(runId)
    if (!params) {
      // Mock mode — no params stored; resume without executor
      engine.resumeRun(runId, answer)
      return
    }

    // Build a minimal AgentDef from stored params. We use run.agentId (stable)
    // rather than searching by name (which may have changed).
    const fallbackDef: AgentDef = {
      id: run.agentId,
      name: params.agentName,
      role: params.agentRole,
      color: 0,
      startCol: 0,
      startRow: 0,
      goal: params.agentGoal,
      persona: params.agentPersona,
      configVersion: 0,
    }

    engine.resumeRun(
      runId,
      answer,
      buildRunExecutor(fallbackDef, params.taskDescription, run.question, answer),
    )
  }

  const handleDismissQuestion = (runId: string) => {
    // User dismissed without answering — just close the modal; run stays 'awaiting'
    setPendingQuestion(null)
  }

  const handleInboxOpen = () => {
    setInboxOpen(true)
    markRead()
  }

  const handleInboxClose = () => {
    setInboxOpen(false)
  }

  const handleEditSave = (payload: EditSavePayload) => {
    // Update mutable agent definitions and increment configVersion.
    // Incrementing configVersion ensures any new runs started after this edit
    // will carry a different version in their snapshot, making it easy to trace
    // which config was active when each run was created.
    setAgentDefs((prev) =>
      prev.map((def) =>
        def.id === payload.agentId
          ? {
              ...def,
              name: payload.name,
              goal: payload.goal,
              persona: payload.persona,
              configVersion: def.configVersion + 1,
            }
          : def,
      ),
    )
    // Propagate name/goal/persona into live agent state
    const entry = agentsRef.current.get(payload.agentId)
    if (entry) {
      entry.state = { ...entry.state, name: payload.name, goal: payload.goal, persona: payload.persona }
    }
  }

  // Derived helpers
  const multiSelected = selectedAgents.length > 1 ? selectedAgents : null
  const panelAgentDef = panelAgentId ? agentDefs.find((d) => d.id === panelAgentId) ?? null : null
  const panelChildAgentDefs = panelAgentDef?.childAgentIds
    ?.map((id) => agentDefs.find((d) => d.id === id))
    .filter((d): d is AgentDef => d !== undefined)

  // User display name
  const userName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? ''

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // While NextAuth resolves the session, show a minimal loading screen to
  // avoid a flash of unauthenticated content.  The middleware handles the
  // actual server-side redirect; this guard is just for the client-side hydration gap.
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Načítání…</p>
        </div>
      </div>
    )
  }

  // Show the API key setup banner when the user is authenticated but has not
  // yet configured their LLM key, and has not dismissed the banner this session.
  const showKeyBanner = hasApiKey === false && !keyBannerDismissed

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900">
      {/* Pixi canvas mount point */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none text-center">
        <p className="text-lg font-bold text-white/75 tracking-widest uppercase">
          Agent Verse
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {MAP_CONFIG.COLS} × {MAP_CONFIG.ROWS} &nbsp;·&nbsp; scroll to zoom &nbsp;·&nbsp; click to select
        </p>
      </div>

      {/* User + Settings button + Delegation link (top-left) */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Link
          href="/delegation"
          className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-emerald-600 transition-colors"
          title="Zobrazit animaci delegace"
        >
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden sm:block">Delegace</span>
        </Link>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors group"
          title="Nastavení účtu"
        >
          <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:block max-w-[100px] truncate">{userName}</span>
          <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Zoom level */}
      <div className="absolute top-4 right-4 z-10 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-700 text-xs text-slate-400 select-none">
        {zoomPct}%
      </div>

      {/* Hovered cell coordinates */}
      <div className="absolute top-12 right-4 z-10 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-700 text-xs text-slate-400 select-none min-w-[90px] text-center">
        {mouseCell ? `${mouseCell.col}, ${mouseCell.row}` : '—'}
      </div>

      {/* ── Inbox toggle button ── */}
      <div className="absolute top-[84px] right-4 z-10">
        <InboxToggleButton
          unreadCount={unreadCount}
          isOpen={inboxOpen}
          onClick={inboxOpen ? handleInboxClose : handleInboxOpen}
        />
      </div>

      {/* ── Inbox panel ── */}
      <InboxPanel
        messages={messages}
        isOpen={inboxOpen}
        onClose={handleInboxClose}
        onDismiss={dismissMessage}
        onClearAll={clearAll}
        onReply={handleReplyToQuestion}
      />

      {/* ── Question modal (wait-delivery runs awaiting user answer) ── */}
      <QuestionModal
        pending={pendingQuestion}
        onAnswer={handleReplyToQuestion}
        onDismiss={handleDismissQuestion}
      />

      {/* ── Agent Panel (single-agent click) ── */}
      <AgentPanel
        agentDef={panelAgentDef}
        onClose={handlePanelClose}
        onRunTask={handleRunTask}
        onEditSave={handleEditSave}
        childAgentDefs={panelChildAgentDefs}
        waitPhase={waitPhase}
        waitResult={waitResult}
        waitError={waitError}
        onNewTask={handleNewTask}
      />

      {/* ── Account Settings Modal ── */}
      <AccountSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* ── API Key setup banner ── */}
      {showKeyBanner && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4 pointer-events-auto">
          <div className="bg-slate-800/95 backdrop-blur-sm border border-indigo-500/40 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-600/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Připoj svůj AI klíč</p>
              <p className="text-xs text-slate-400 mt-0.5">Pro spuštění agentů potřebuješ Anthropic API klíč.</p>
              <button
                onClick={() => { setSettingsOpen(true); setKeyBannerDismissed(true) }}
                className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Nastavit klíč →
              </button>
            </div>
            <button
              onClick={() => setKeyBannerDismissed(true)}
              className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
              aria-label="Zavřít"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Multi-agent selection panel ── */}
      {multiSelected && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="bg-slate-800/95 backdrop-blur-sm border border-indigo-500/60 rounded-xl shadow-2xl p-4 min-w-[220px] max-w-xs">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-indigo-300 font-bold text-sm tracking-wide">
                {multiSelected.length} agents selected
              </span>
              <button
                onClick={closeMultiSelection}
                className="text-slate-400 hover:text-white text-xs ml-2 leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 transition-colors"
                aria-label="Dismiss selection"
              >
                ✕
              </button>
            </div>

            {/* Agent list */}
            <ul className="flex flex-col gap-1.5 mb-3">
              {multiSelected.map((agent) => {
                const agentDef = agentDefs.find((a) => a.id === agent.id)
                const colorHex = agentDef
                  ? `#${agentDef.color.toString(16).padStart(6, '0')}`
                  : '#94a3b8'
                return (
                  <li
                    key={agent.id}
                    className="flex items-center gap-2 bg-slate-700/60 rounded-lg px-2.5 py-1.5"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: colorHex }}
                    />
                    <span className="text-white text-xs font-medium leading-tight">
                      {agent.name}
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono ml-auto truncate max-w-[80px]">
                      {agent.role}
                    </span>
                  </li>
                )
              })}
            </ul>

            {/* Actions */}
            <button
              onClick={closeMultiSelection}
              className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1.5 rounded-lg transition-colors text-center"
            >
              Dismiss all
            </button>
          </div>

          {/* Up-pointing arrow */}
          <div className="flex justify-center -mb-px overflow-hidden h-3 rotate-180">
            <div className="w-4 h-4 bg-slate-800 border-b border-r border-indigo-500/60 rotate-45 translate-y-[-50%]" />
          </div>
        </div>
      )}

      {/* Zoom / reset buttons */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
        {(
          [
            { label: '+', title: 'Zoom in', fn: zoomIn },
            { label: '−', title: 'Zoom out', fn: zoomOut },
            { label: '⌂', title: 'Reset view', fn: resetView },
          ] as const
        ).map(({ label, title, fn }) => (
          <button
            key={title}
            onClick={fn}
            title={title}
            className="w-10 h-10 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-lg text-lg font-bold shadow-lg transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700 select-none">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
          Objects
        </p>
        {GRID_OBJECTS.map((obj) => (
          <div key={obj.id} className="flex items-center gap-2 mb-1 last:mb-0">
            <div
              className="w-3 h-3 flex-shrink-0"
              style={{
                background: `#${obj.color.toString(16).padStart(6, '0')}`,
                borderRadius: obj.type === 'circle' ? '50%' : '2px',
              }}
            />
            <span className="text-xs text-slate-300">{obj.label}</span>
            <span className="text-[10px] text-slate-500">
              ({obj.col}, {obj.row})
            </span>
          </div>
        ))}

        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 mt-3">
          Agents
        </p>
        {agentDefs.map((agent) => (
          <div key={agent.id} className="flex items-center gap-2 mb-1 last:mb-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: `#${agent.color.toString(16).padStart(6, '0')}` }}
            />
            <span className="text-xs text-slate-300">{agent.name}</span>
            <span className="text-[10px] text-slate-500">{agent.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
