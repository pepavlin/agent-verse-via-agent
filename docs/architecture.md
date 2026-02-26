# Architecture

## Overview

Single-page Next.js application rendering an interactive 2D grid via pixi.js WebGL.

## Key Files

```
app/
  page.tsx            – Root page, renders <Grid2D />
  layout.tsx          – HTML shell, imports globals.css
  globals.css         – Base styles (Tailwind 4)
  components/
    Grid2D.tsx        – Main grid component (all logic)
tests/
  grid-config.test.ts – Unit tests for map config and objects
```

## Grid2D Component

### State and Refs

| Name | Type | Purpose |
|------|------|---------|
| `appRef` | Ref | pixi.js Application instance |
| `worldContainerRef` | Ref | PIXI.Container that holds grid + objects |
| `viewRef` | Ref | Current `{ x, y, zoom }` – updated without re-renders |
| `displayZoom` | State | Reactive zoom % shown in HUD |

### Rendering Pipeline

1. `useEffect` initialises pixi.js and attaches canvas to `canvasRef` div.
2. `renderWorld()` draws background, border, grid lines, and objects into `worldContainerRef`.
3. `applyView()` translates/scales `worldContainerRef` to match `viewRef`, then calls `setDisplayZoom`.
4. Pointer events (pointerdown/pointermove/pointerup) update `viewRef.x/y` for panning.
5. Wheel event updates `viewRef.zoom` and adjusts `viewRef.x/y` to zoom toward cursor.

### Coordinate System

- **World space** – origin at top-left corner of map; 1 unit = `CELL_SIZE` pixels at zoom 1.
- **Screen space** – browser pixels; `worldContainer.x/y` is the world origin in screen space.
- Zoom pivot: `screen = world * zoom + offset`, kept under cursor on wheel.

### Clamping

`applyView()` clamps:
- `zoom` within `[MIN_ZOOM, MAX_ZOOM]`
- `x/y` so the map edge never goes past the screen edge (user always sees part of the map)

## Object Format

```ts
interface GridObject {
  id: string
  type: 'square' | 'circle'
  col: number    // left edge in cells
  row: number    // top edge in cells
  color: number  // 0xRRGGBB
  size: number   // width/height in cells
  label: string
}
```
