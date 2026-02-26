# Architecture

## Overview

Single-page Next.js application rendering an interactive 2D grid via pixi.js (WebGL).

## File Structure

```
app/
  page.tsx              – Root page, renders <Grid2D />
  layout.tsx            – HTML shell, metadata, globals.css import
  globals.css           – Base styles (Tailwind 4 reset)
  components/
    Grid2D.tsx          – Entire grid component: config, types, rendering, input
tests/
  grid.test.ts          – Unit tests for config, worldSize(), and objects
  setup.ts              – @testing-library/jest-dom setup
docs/
  architecture.md       – This file
```

## Grid2D Component

### Exports

| Export | Type | Description |
|---|---|---|
| `MAP_CONFIG` | `const` | Grid dimensions, cell size, zoom limits |
| `GRID_OBJECTS` | `GridObject[]` | Static list of objects placed on the grid |
| `worldSize()` | `() => { w, h }` | Total map size in pixels at zoom = 1 |
| `GridObject` | interface | Shape of an object entry |
| `Grid2D` | React component | Default export |

### Refs (performance – no React re-renders)

| Ref | Purpose |
|---|---|
| `mountRef` | DOM div that pixi canvas is appended to |
| `appRef` | `PIXI.Application` instance |
| `worldRef` | `PIXI.Container` holding all drawn content |
| `view` | `{ x, y, zoom }` — current camera state |
| `dragging` | Whether the user is currently panning |
| `lastPtr` | Last pointer position for delta calculation |

### State (React – triggers re-render)

| State | Purpose |
|---|---|
| `zoomPct` | Displayed zoom percentage in the HUD |
| `mouseCell` | Current hovered cell `{ col, row }` or null |

### Rendering

1. `useEffect` initialises `PIXI.Application` and attaches the canvas.
2. `drawWorld()` populates `worldRef` with: background fill, grid lines, map border, objects, labels.
3. `applyView()` clamps `view.zoom` and `view.x/y`, then applies them to `worldRef.x/y/scale`.
4. Pointer events handle pan (`pointerdown/move/up/leave`).
5. Wheel event handles zoom-toward-cursor.
6. Three HUD buttons call `zoomIn`, `zoomOut`, `resetView`.

### Coordinate Mapping

```
screenX = worldX * zoom + offsetX
worldX  = (screenX - offsetX) / zoom
cellCol = Math.floor(worldX / CELL_SIZE)
```

### Clamping Rules

- `zoom` is clamped to `[MIN_ZOOM, MAX_ZOOM]`.
- `x/y` are clamped so the map never fully leaves the viewport (user always sees part of it).

## Object Format

```ts
interface GridObject {
  id: string       // unique identifier
  type: 'square' | 'circle'
  col: number      // left edge column (0-based)
  row: number      // top edge row (0-based)
  color: number    // 0xRRGGBB
  size: number     // width = height in cells
  label: string    // shown below the object
}
```
