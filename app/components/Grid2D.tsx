'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import * as PIXI from 'pixi.js'
import { MAP_CONFIG, GRID_OBJECTS, worldSize } from './grid-config'
import { AGENTS, type AgentDef } from './agents-config'
import { AgentState, createAgentState, updateAgent, hitTestAgent, agentInRect, WorldRect } from './agent-logic'
import { drawStickFigure } from './agent-drawing'
import AgentPanel, { type RunTaskPayload, type EditSavePayload } from './AgentPanel'
import { RunEngine } from '../run-engine'
import { GLOW_DURATION_MS } from './agent-run-effects'
import { useInbox } from './use-inbox'
import { InboxToggleButton, InboxPanel } from './Inbox'

// Re-export so external code can import from either location
export { MAP_CONFIG, GRID_OBJECTS, worldSize } from './grid-config'
export type { GridObject } from './grid-config'

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
}

interface SelectedAgentInfo {
  id: string
  name: string
  role: string
}

/**
 * Per-agent run animation state, kept in a ref so the pixi ticker can read
 * it without triggering React re-renders.
 */
interface AgentRunInfo {
  /** 'running' while a run is active; null when idle or completed. */
  runState: 'running' | null
  /** Timestamp (ms) when the latest run completed; null if no recent completion. */
  completionStart: number | null
  /** Accumulated seconds of running time — used as phase for the pulse effect. */
  runTime: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Grid2D() {
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

  // Inbox state — manages message feed for inbox-delivery task results
  const { messages, unreadCount, addMessage, updateMessage, dismissMessage, clearAll, markRead } = useInbox()
  const [inboxOpen, setInboxOpen] = useState(false)

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

        container.addChild(gfx)
        container.addChild(label)
        container.x = state.x
        container.y = state.y
        agentLayer.addChild(container)

        agentsMap.set(def.id, { state, gfx, container })
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

          // ---- Compute run-state animation params ----
          let runTime: number | null = null
          let completionAge: number | null = null

          const runInfo = agentRunInfoRef.current.get(id)
          if (runInfo) {
            if (runInfo.runState === 'running') {
              runInfo.runTime += ticker.deltaMS / 1000
              runTime = runInfo.runTime
            }
            if (runInfo.completionStart !== null) {
              const age = now - runInfo.completionStart
              if (age < GLOW_DURATION_MS) {
                completionAge = age
              } else {
                // Glow expired — clear so we stop rendering it
                runInfo.completionStart = null
              }
            }
          }

          drawStickFigure(
            entry.gfx,
            entry.state,
            selectedAgentIdsRef.current.has(id),
            runTime,
            completionAge,
          )
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
      agentRunInfoRef.current.set(run.agentId, {
        runState: 'running',
        completionStart: null,
        runTime: 0,
      })
    })

    const unsubCompleted = engine.on('run:completed', (run) => {
      agentRunInfoRef.current.set(run.agentId, {
        runState: null,
        completionStart: Date.now(),
        runTime: 0,
      })
    })

    init()

    return () => {
      unsubStarted()
      unsubCompleted()
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

  const handlePanelClose = () => {
    setPanelAgentId(null)
    selectedAgentIdsRef.current = new Set()
    followingAgentRef.current = null
    setSelectedAgents([])
  }

  const handleRunTask = (payload: RunTaskPayload) => {
    const def = agentDefs.find((d) => d.id === payload.agentId)
    if (def) {
      const engine = runEngineRef.current
      const run = engine.createRun(payload.agentId, def.name, def.role, payload.task)

      if (payload.delivery === 'inbox') {
        // Add a 'question' card immediately — will be updated on completion
        addMessage({
          id: run.id,
          type: 'question',
          agentName: def.name,
          agentColor: def.color,
          task: payload.task,
          text: 'Zpracovávám úkol…',
        })

        // Subscribe to this specific run's completion
        const unsubCompleted = engine.on('run:completed', (completedRun) => {
          if (completedRun.id !== run.id) return
          updateMessage(run.id, { type: 'done', text: completedRun.result ?? 'Hotovo.' })
          unsubCompleted()
        })

        const unsubFailed = engine.on('run:failed', (failedRun) => {
          if (failedRun.id !== run.id) return
          updateMessage(run.id, { type: 'error', text: failedRun.error ?? 'Nastala chyba.' })
          unsubFailed()
        })

        // Open inbox so the user sees the new task card
        setInboxOpen(true)
      }

      engine.startRun(run.id)
    }
    handlePanelClose()
  }

  const handleInboxOpen = () => {
    setInboxOpen(true)
    markRead()
  }

  const handleInboxClose = () => {
    setInboxOpen(false)
  }

  const handleEditSave = (payload: EditSavePayload) => {
    // Update mutable agent definitions
    setAgentDefs((prev) =>
      prev.map((def) =>
        def.id === payload.agentId
          ? { ...def, name: payload.name, goal: payload.goal, persona: payload.persona }
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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900">
      {/* Pixi canvas mount point */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none text-center">
        <p className="text-lg font-bold text-white/75 tracking-widest uppercase">
          2D Grid Explorer
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {MAP_CONFIG.COLS} × {MAP_CONFIG.ROWS} cells &nbsp;·&nbsp; middle-drag to pan &nbsp;·&nbsp;
          scroll to zoom &nbsp;·&nbsp; click to select &nbsp;·&nbsp; drag to rect-select
        </p>
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
      />

      {/* ── Agent Panel (single-agent click) ── */}
      <AgentPanel
        agentDef={panelAgentDef}
        onClose={handlePanelClose}
        onRunTask={handleRunTask}
        onEditSave={handleEditSave}
      />

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
