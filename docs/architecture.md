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
    Grid2D.tsx          – Grid component: rendering, input, agents integration
    grid-config.ts      – MAP_CONFIG, GRID_OBJECTS, GridObject interface, worldSize()
    agents-config.ts    – AGENTS array (AgentDef definitions, no pixi.js dep)
    agent-logic.ts      – Pure agent state functions (no pixi.js dep, fully testable)
    agent-drawing.ts    – Stick-figure drawing via PIXI.Graphics
tests/
  grid.test.ts          – Unit tests for config, worldSize(), and objects
  agents.test.ts        – Unit tests for agent logic, hit testing, and rect selection
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
| `agentsRef` | Map of `id → { state, gfx, container }` for all walking agents |
| `selectedAgentIdsRef` | `Set<string>` of currently selected agent IDs |
| `followingAgentRef` | ID of the agent the camera is following (or null) |
| `menuDivRef` | Ref to the single-agent context-menu DOM element for imperative positioning |
| `isRectSelectingRef` | Whether a rectangle selection drag is in progress |
| `rectSelectStartRef` | Screen-space start point of the selection rect |
| `rectSelectEndRef` | Screen-space current end point of the selection rect |
| `selectionRectGfxRef` | `PIXI.Graphics` overlay (on stage, screen space) for the selection rect |

### State (React – triggers re-render)

| State | Purpose |
|---|---|
| `zoomPct` | Displayed zoom percentage in the HUD |
| `mouseCell` | Current hovered cell `{ col, row }` or null |
| `selectedAgents` | `SelectedAgentInfo[]` — empty = none, 1 = single, 2+ = multi |

### Rendering

1. `useEffect` initialises `PIXI.Application` and attaches the canvas.
2. `drawWorld()` populates `worldRef` with: background fill, grid lines, map border, objects, labels.
3. Agent layer is created and populated with stick-figure containers (one per agent).
4. `app.ticker` runs every frame: updates agent states, redraws figures, follows camera target, positions the context menu div imperatively (zero React re-renders per frame).
5. `applyView()` clamps `view.zoom` and `view.x/y`, then applies them to `worldRef.x/y/scale`.
6. Pointer events handle pan (`pointerdown/move/up/leave`) and click-vs-drag detection (threshold: 5 px).
7. Wheel event handles zoom-toward-cursor.
8. Three HUD buttons call `zoomIn`, `zoomOut`, `resetView`.

## Agent System

### Data flow

```
AGENTS (AgentDef[])
  └─ createAgentState()  →  AgentState (pure, no PIXI)
       └─ updateAgent()  →  new AgentState each tick (pure)

AgentState + PIXI.Graphics
  └─ drawStickFigure()   →  mutates graphics commands
```

### Walking behaviour

Agents wander within the grid bounds. On reaching their target they idle for 1–5 s then pick a new random target. Speed varies per agent (40–80 px/s at zoom 1).

### Stick figure layout (y=0 at container centre)

```
y = -30  top of head
y = -21  head centre   (radius 9)
y =  -7  shoulders
y =  +4  arm attachment
y = +10  hips
y = +30  feet / shadow
```

Legs and arms swing with `sin(walkTime)`, amplitude 9 px, only when the agent is moving.

### Selection system

The grid supports three ways to select agents:

| Interaction | Result |
|---|---|
| Click on agent | Single-select that agent (deselects others) |
| Shift + click on agent | Toggle that agent in/out of the current selection |
| Shift + drag on empty space | Rectangle selection — selects all agents whose centre falls within the drawn rect |
| Click on empty space | Deselects all agents |

**Click detection:** On `pointerup`, if the pointer moved < 5 px since `pointerdown`, it is treated as a click. The click position is converted from screen → world coordinates and compared to each agent's position via `hitTestAgent` (circular radius 28 px).

**Rectangle selection:** When `Shift` is held on `pointerdown`, `isRectSelectingRef` is set and the start point recorded. On each `pointermove` the end point is updated. The ticker draws a semi-transparent indigo rect in screen space via `selectionRectGfxRef` (a `PIXI.Graphics` on `app.stage`). On `pointerup`, the rect corners are converted to world coords and `agentInRect` tests each agent.

**Visual feedback:** `drawStickFigure` receives `selected = true` for every agent whose ID is in `selectedAgentIdsRef`. Selected agents show a white glow ring around their head.

### Context menus

| Selection size | UI |
|---|---|
| 0 agents | No menu |
| 1 agent | Floating panel anchored above the agent (position updated imperatively via `menuDivRef` in ticker). Actions: Follow, Stop following, Dismiss. |
| 2+ agents | Fixed panel centred at bottom of screen listing all selected agents with name, role and colour dot. Action: Dismiss all. |

### Coordinate Mapping

```
screenX = worldX * zoom + offsetX
worldX  = (screenX - offsetX) / zoom
cellCol = Math.floor(worldX / CELL_SIZE)
```

### Clamping Rules

- `zoom` is clamped to `[MIN_ZOOM, MAX_ZOOM]`.
- `x/y` are clamped so the map never fully leaves the viewport (user always sees part of it).

## Deployment

### Docker Compose

The application ships with a multi-stage `Dockerfile` that leverages Next.js `output: "standalone"` mode:

| Stage | Base image | Purpose |
|---|---|---|
| `deps` | `node:22-alpine` | Install npm dependencies |
| `builder` | `node:22-alpine` | Run `next build` and produce standalone output |
| `runner` | `node:22-alpine` | Minimal production image running `node server.js` |

The final image contains only the standalone bundle, static assets, and public files — `node_modules` are not included.

`docker-compose.yml` exposes port **3000** and restarts the container unless stopped manually.

```bash
# Build and start
docker compose up --build

# Stop
docker compose down
```

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
