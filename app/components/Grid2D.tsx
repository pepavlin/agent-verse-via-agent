'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import * as PIXI from 'pixi.js'
import { MAP_CONFIG, GRID_OBJECTS, worldSize } from './grid-config'
import { AGENTS } from './agents-config'
import { AgentState, createAgentState, updateAgent, hitTestAgent } from './agent-logic'
import { drawStickFigure } from './agent-drawing'

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
  const selectedAgentIdRef = useRef<string | null>(null)
  const followingAgentRef = useRef<string | null>(null)
  const menuDivRef = useRef<HTMLDivElement | null>(null)

  const [zoomPct, setZoomPct] = useState(25)
  const [mouseCell, setMouseCell] = useState<{ col: number; row: number } | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgentInfo | null>(null)

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

      // ---- Ticker: animate agents each frame ----
      app.ticker.add((ticker: PIXI.Ticker) => {
        const { w: mW, h: mH } = worldSize()

        for (const [id, entry] of agentsRef.current) {
          entry.state = updateAgent(entry.state, ticker.deltaMS, mW, mH)
          entry.container.x = entry.state.x
          entry.container.y = entry.state.y
          drawStickFigure(entry.gfx, entry.state, selectedAgentIdRef.current === id)
        }

        // Follow selected agent (centre view on it)
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

        // Update menu position imperatively (no React re-render needed)
        if (selectedAgentIdRef.current && menuDivRef.current) {
          const entry = agentsRef.current.get(selectedAgentIdRef.current)
          if (entry) {
            const sx = entry.state.x * view.current.zoom + view.current.x
            const sy = entry.state.y * view.current.zoom + view.current.y
            menuDivRef.current.style.left = `${sx}px`
            menuDivRef.current.style.top = `${sy}px`
          }
        }
      })

      // ---- Pan ----
      let pointerDownX = 0
      let pointerDownY = 0

      app.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
        pointerDownX = e.clientX
        pointerDownY = e.clientY
        dragging.current = true
        lastPtr.current = { x: e.clientX, y: e.clientY }
        app.canvas.setPointerCapture(e.pointerId)
        ;(app.canvas as HTMLCanvasElement).style.cursor = 'grabbing'
      })

      app.canvas.addEventListener('pointermove', (e: PointerEvent) => {
        // Update hovered-cell display
        const rect = app.canvas.getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        const wx = (sx - view.current.x) / view.current.zoom
        const wy = (sy - view.current.y) / view.current.zoom
        const col = Math.floor(wx / MAP_CONFIG.CELL_SIZE)
        const row = Math.floor(wy / MAP_CONFIG.CELL_SIZE)
        const inBounds =
          col >= 0 && col < MAP_CONFIG.COLS && row >= 0 && row < MAP_CONFIG.ROWS
        setMouseCell(inBounds ? { col, row } : null)

        if (!dragging.current) return
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

        if (isClick) {
          const rect = app.canvas.getBoundingClientRect()
          const sx = e.clientX - rect.left
          const sy = e.clientY - rect.top
          const wx = (sx - view.current.x) / view.current.zoom
          const wy = (sy - view.current.y) / view.current.zoom

          let hitId: string | null = null
          for (const [id, entry] of agentsRef.current) {
            if (hitTestAgent(entry.state, wx, wy)) {
              hitId = id
              break
            }
          }

          if (hitId) {
            selectedAgentIdRef.current = hitId
            followingAgentRef.current = null // stop following on new selection
            const entry = agentsRef.current.get(hitId)!
            setSelectedAgent({ id: hitId, name: entry.state.name, role: entry.state.role })
          } else {
            selectedAgentIdRef.current = null
            setSelectedAgent(null)
          }
        }

        dragging.current = false
        ;(app.canvas as HTMLCanvasElement).style.cursor = 'grab'
      })

      app.canvas.addEventListener('pointerleave', () => {
        dragging.current = false
        setMouseCell(null)
        ;(app.canvas as HTMLCanvasElement).style.cursor = 'grab'
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

      ;(app.canvas as HTMLCanvasElement).style.cursor = 'grab'
    }

    init()

    return () => {
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

  // ---- Agent menu handlers ----

  const closeMenu = () => {
    selectedAgentIdRef.current = null
    followingAgentRef.current = null
    setSelectedAgent(null)
  }

  const followAgent = () => {
    if (selectedAgent) {
      followingAgentRef.current = selectedAgent.id
    }
  }

  const stopFollowing = () => {
    followingAgentRef.current = null
  }

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
          {MAP_CONFIG.COLS} × {MAP_CONFIG.ROWS} cells &nbsp;·&nbsp; drag to pan &nbsp;·&nbsp;
          scroll to zoom &nbsp;·&nbsp; click agents
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

      {/* Agent context menu — positioned imperatively via menuDivRef */}
      {selectedAgent && (
        <div
          ref={menuDivRef}
          className="absolute z-20 pointer-events-auto"
          style={{ transform: 'translate(-50%, calc(-100% - 44px))' }}
        >
          <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl shadow-2xl p-3 min-w-[168px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-white font-bold text-sm leading-tight">
                {selectedAgent.name}
              </span>
              <button
                onClick={closeMenu}
                className="text-slate-400 hover:text-white text-xs ml-2 leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 transition-colors"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <div className="text-indigo-400 text-[11px] font-mono mb-3">{selectedAgent.role}</div>

            {/* Actions */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={followAgent}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg transition-colors text-left font-medium"
              >
                Follow
              </button>
              <button
                onClick={stopFollowing}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1.5 rounded-lg transition-colors text-left"
              >
                Stop following
              </button>
              <button
                onClick={closeMenu}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 px-2.5 py-1.5 rounded-lg transition-colors text-left"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Down-pointing arrow */}
          <div className="flex justify-center -mt-px overflow-hidden h-3">
            <div className="w-4 h-4 bg-slate-800 border-b border-r border-slate-600 rotate-45 translate-y-[-50%]" />
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
        {AGENTS.map((agent) => (
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
