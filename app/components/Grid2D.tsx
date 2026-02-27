'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import * as PIXI from 'pixi.js'
import { MAP_CONFIG, GRID_OBJECTS, worldSize } from './grid-config'

// Re-export so external code can import from either location
export { MAP_CONFIG, GRID_OBJECTS, worldSize } from './grid-config'
export type { GridObject } from './grid-config'

// ---------------------------------------------------------------------------
// Internal view state (updated imperatively — no React re-renders)
// ---------------------------------------------------------------------------

interface ViewState {
  x: number
  y: number
  zoom: number
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

  const [zoomPct, setZoomPct] = useState(25)
  const [mouseCell, setMouseCell] = useState<{ col: number; row: number } | null>(null)

  // -------------------------------------------------------------------------
  // Draw everything into the world container
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

    // Map border (outermost edge)
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

      // Label below the object
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

    // Clamp zoom
    v.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom))

    const sw = app.renderer.width
    const sh = app.renderer.height
    const scaledW = mapW * v.zoom
    const scaledH = mapH * v.zoom

    // Minimum px of the map that must stay visible inside the viewport.
    // This lets users freely drag a small (zoomed-out) map around while
    // ensuring they can never pan it completely off-screen.
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

      // Centre map at 25 % zoom initially
      const { w: mapW, h: mapH } = worldSize()
      const initialZoom = 0.25
      view.current = {
        x: (app.renderer.width - mapW * initialZoom) / 2,
        y: (app.renderer.height - mapH * initialZoom) / 2,
        zoom: initialZoom,
      }

      drawWorld()
      applyView()

      // ---- Pan ----
      app.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
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

      app.canvas.addEventListener('pointerup', () => {
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

          // Zoom toward cursor
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
          {MAP_CONFIG.COLS} × {MAP_CONFIG.ROWS} cells &nbsp;·&nbsp; drag to pan &nbsp;·&nbsp; scroll to zoom
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
      </div>
    </div>
  )
}
