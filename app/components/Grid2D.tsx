'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import * as PIXI from 'pixi.js'

// Map configuration
export const MAP_CONFIG = {
  /** Total width of the map in world units (cells) */
  COLS: 100,
  /** Total height of the map in world units (cells) */
  ROWS: 100,
  /** Size of each cell in pixels at zoom=1 */
  CELL_SIZE: 40,
  /** Minimum zoom level (most zoomed out) */
  MIN_ZOOM: 0.1,
  /** Maximum zoom level (most zoomed in) */
  MAX_ZOOM: 5,
  /** Step for zoom buttons */
  ZOOM_STEP: 0.2,
} as const

// Objects placed on the grid
export const GRID_OBJECTS: GridObject[] = [
  {
    id: 'square-1',
    type: 'square',
    col: 20,
    row: 15,
    color: 0x6366f1, // indigo
    size: 2,
    label: 'Square A',
  },
  {
    id: 'circle-1',
    type: 'circle',
    col: 60,
    row: 40,
    color: 0x22d3ee, // cyan
    size: 2,
    label: 'Circle B',
  },
]

export interface GridObject {
  id: string
  type: 'square' | 'circle'
  col: number
  row: number
  color: number
  /** Size in grid cells */
  size: number
  label: string
}

interface ViewState {
  x: number
  y: number
  zoom: number
}

export default function Grid2D() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const worldContainerRef = useRef<PIXI.Container | null>(null)
  const viewRef = useRef<ViewState>({ x: 0, y: 0, zoom: 1 })
  const isDraggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const [displayZoom, setDisplayZoom] = useState(25)

  /** Rebuild and render grid lines + objects into worldContainer */
  const renderWorld = useCallback(() => {
    const app = appRef.current
    const world = worldContainerRef.current
    if (!app || !world) return

    world.removeChildren()

    const { COLS, ROWS, CELL_SIZE } = MAP_CONFIG
    const mapW = COLS * CELL_SIZE
    const mapH = ROWS * CELL_SIZE

    // --- Map background ---
    const bg = new PIXI.Graphics()
    bg.rect(0, 0, mapW, mapH)
    bg.fill({ color: 0x1e293b })
    world.addChild(bg)

    // --- Map boundary ---
    const border = new PIXI.Graphics()
    border.rect(0, 0, mapW, mapH)
    border.stroke({ color: 0x6366f1, width: 3, alignment: 1 })
    world.addChild(border)

    // --- Grid lines ---
    const gridLines = new PIXI.Graphics()
    gridLines.setStrokeStyle({ color: 0x334155, width: 1 })

    for (let c = 0; c <= COLS; c++) {
      const x = c * CELL_SIZE
      gridLines.moveTo(x, 0)
      gridLines.lineTo(x, mapH)
    }
    for (let r = 0; r <= ROWS; r++) {
      const y = r * CELL_SIZE
      gridLines.moveTo(0, y)
      gridLines.lineTo(mapW, y)
    }
    gridLines.stroke()
    world.addChild(gridLines)

    // --- Objects ---
    for (const obj of GRID_OBJECTS) {
      const g = new PIXI.Graphics()
      const px = obj.col * CELL_SIZE
      const py = obj.row * CELL_SIZE
      const s = obj.size * CELL_SIZE

      if (obj.type === 'square') {
        const padding = 4
        g.rect(px + padding, py + padding, s - padding * 2, s - padding * 2)
        g.fill({ color: obj.color })
        g.rect(px + padding, py + padding, s - padding * 2, s - padding * 2)
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.5 })
      } else {
        const cx = px + s / 2
        const cy = py + s / 2
        const radius = s / 2 - 4
        g.circle(cx, cy, radius)
        g.fill({ color: obj.color })
        g.circle(cx, cy, radius)
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.5 })
      }

      world.addChild(g)

      // Label
      const label = new PIXI.Text({
        text: obj.label,
        style: {
          fontSize: 12,
          fill: 0xffffff,
          fontFamily: 'Arial',
          fontWeight: 'bold',
        },
      })
      label.x = px + s / 2 - label.width / 2
      label.y = py + s + 4
      world.addChild(label)
    }
  }, [])

  /** Apply current viewRef state to the world container */
  const applyView = useCallback(() => {
    const app = appRef.current
    const world = worldContainerRef.current
    if (!app || !world) return

    const { COLS, ROWS, CELL_SIZE, MIN_ZOOM, MAX_ZOOM } = MAP_CONFIG
    const mapW = COLS * CELL_SIZE
    const mapH = ROWS * CELL_SIZE
    const view = viewRef.current

    // Clamp zoom
    view.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, view.zoom))

    const screenW = app.renderer.width
    const screenH = app.renderer.height

    // Clamp pan so the map never fully leaves the screen
    const minX = Math.min(0, screenW - mapW * view.zoom)
    const minY = Math.min(0, screenH - mapH * view.zoom)
    view.x = Math.max(minX, Math.min(0, view.x))
    view.y = Math.max(minY, Math.min(0, view.y))

    world.x = view.x
    world.y = view.y
    world.scale.set(view.zoom)
    setDisplayZoom(Math.round(view.zoom * 100))
  }, [setDisplayZoom])

  useEffect(() => {
    if (!canvasRef.current) return

    let app: PIXI.Application

    const init = async () => {
      app = new PIXI.Application()
      await app.init({
        background: 0x0f172a,
        resizeTo: canvasRef.current!,
        antialias: true,
      })

      canvasRef.current!.appendChild(app.canvas)
      appRef.current = app

      const world = new PIXI.Container()
      app.stage.addChild(world)
      worldContainerRef.current = world

      // Center map initially
      const { COLS, ROWS, CELL_SIZE } = MAP_CONFIG
      const mapW = COLS * CELL_SIZE
      const mapH = ROWS * CELL_SIZE
      viewRef.current = {
        x: (app.renderer.width - mapW) / 2,
        y: (app.renderer.height - mapH) / 2,
        zoom: 0.25,
      }

      renderWorld()
      applyView()

      // --- Pointer events for pan ---
      app.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
        isDraggingRef.current = true
        lastPointerRef.current = { x: e.clientX, y: e.clientY }
        app.canvas.setPointerCapture(e.pointerId)
      })

      app.canvas.addEventListener('pointermove', (e: PointerEvent) => {
        if (!isDraggingRef.current) return
        const dx = e.clientX - lastPointerRef.current.x
        const dy = e.clientY - lastPointerRef.current.y
        lastPointerRef.current = { x: e.clientX, y: e.clientY }
        viewRef.current.x += dx
        viewRef.current.y += dy
        applyView()
      })

      app.canvas.addEventListener('pointerup', () => {
        isDraggingRef.current = false
      })

      // --- Mouse wheel for zoom ---
      app.canvas.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault()

        const rect = app.canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const oldZoom = viewRef.current.zoom
        const delta = e.deltaY < 0 ? 1.1 : 0.9
        const newZoom = Math.max(
          MAP_CONFIG.MIN_ZOOM,
          Math.min(MAP_CONFIG.MAX_ZOOM, oldZoom * delta)
        )

        // Zoom toward mouse pointer
        viewRef.current.x = mouseX - (mouseX - viewRef.current.x) * (newZoom / oldZoom)
        viewRef.current.y = mouseY - (mouseY - viewRef.current.y) * (newZoom / oldZoom)
        viewRef.current.zoom = newZoom

        applyView()
        setDisplayZoom(Math.round(newZoom * 100))
      }, { passive: false })
    }

    init()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [renderWorld, applyView])

  const handleZoomIn = () => {
    viewRef.current.zoom = Math.min(MAP_CONFIG.MAX_ZOOM, viewRef.current.zoom + MAP_CONFIG.ZOOM_STEP)
    applyView()
  }

  const handleZoomOut = () => {
    viewRef.current.zoom = Math.max(MAP_CONFIG.MIN_ZOOM, viewRef.current.zoom - MAP_CONFIG.ZOOM_STEP)
    applyView()
  }

  const handleResetView = () => {
    if (!appRef.current) return
    const { COLS, ROWS, CELL_SIZE } = MAP_CONFIG
    const mapW = COLS * CELL_SIZE
    const mapH = ROWS * CELL_SIZE
    const zoom = 0.25
    viewRef.current = {
      x: (appRef.current.renderer.width - mapW * zoom) / 2,
      y: (appRef.current.renderer.height - mapH * zoom) / 2,
      zoom,
    }
    applyView()
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900">
      {/* pixi canvas container */}
      <div ref={canvasRef} className="absolute inset-0" style={{ cursor: 'grab' }} />

      {/* HUD overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <h1 className="text-xl font-bold text-white/80 tracking-wider text-center">
          2D Grid Explorer
        </h1>
        <p className="text-xs text-slate-400 text-center mt-1">
          Drag to pan &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Map: {MAP_CONFIG.COLS}×{MAP_CONFIG.ROWS} cells
        </p>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xl font-bold shadow-lg transition-colors"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xl font-bold shadow-lg transition-colors"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={handleResetView}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold shadow-lg transition-colors"
          title="Reset view"
        >
          ⌂
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700 text-sm text-slate-300">
        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Objects</p>
        {GRID_OBJECTS.map((obj) => (
          <div key={obj.id} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{
                background: `#${obj.color.toString(16).padStart(6, '0')}`,
                borderRadius: obj.type === 'circle' ? '50%' : '2px',
              }}
            />
            <span>{obj.label}</span>
            <span className="text-slate-500 text-xs">
              ({obj.col}, {obj.row})
            </span>
          </div>
        ))}
      </div>

      {/* Zoom level indicator */}
      <div className="absolute top-4 right-4 z-10 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-700 text-xs text-slate-400">
        Zoom: {displayZoom}%
      </div>
    </div>
  )
}
