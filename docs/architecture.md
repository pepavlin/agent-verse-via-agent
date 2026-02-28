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
    AgentPanel.tsx      – Unified agent panel (Run / Edit modes)
    grid-config.ts      – MAP_CONFIG, GRID_OBJECTS, GridObject interface, worldSize()
    agents-config.ts    – AGENTS array (AgentDef definitions, no pixi.js dep)
    agent-logic.ts      – Pure agent state functions (no pixi.js dep, fully testable)
    agent-drawing.ts    – Stick-figure drawing via PIXI.Graphics
    agent-run-effects.ts – Pure animation math for run-state effects (no pixi.js dep)
    agent-run-state.ts  – Pure run animation state machine: factory fns + tickRunInfo()
  run-engine/
    types.ts            – Run interface, RunStatus enum, RunEventType, RunEngineOptions
    results.ts          – Pure result-text generation (generateResult, templates)
    engine.ts           – RunEngine class (createRun, startRun, events, querying)
    index.ts            – Re-exports public API
tests/
  grid.test.ts              – Unit tests for config, worldSize(), and objects
  agents.test.ts            – Unit tests for agent logic, hit testing, and rect selection
  controls.test.ts          – Unit tests for click-threshold and coord-conversion helpers
  agent-panel.test.tsx      – Unit tests for AgentPanel component (Run mode, Edit mode, tabs)
  run-engine.test.ts        – Unit tests for RunEngine lifecycle, events, delays, querying
  agent-run-effects.test.ts – Unit tests for pulse and glow animation calculations
  agent-run-state.test.ts   – Unit tests for run animation state machine (transitions + ticks)
  setup.ts                  – @testing-library/jest-dom setup
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
| `runEngineRef` | `RunEngine` singleton that drives task run lifecycle |
| `agentRunInfoRef` | `Map<id, AgentRunInfo>` — per-agent run animation state read by ticker |

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
6. Pointer events handle left-drag rect-select and middle-drag pan; click-vs-drag threshold is 5 px.
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

### Control scheme

| Input | Action |
|---|---|
| Left button click on agent | Single-select that agent (deselects others) |
| Left button click on empty space | Deselect all agents |
| Left button drag | Rectangle selection — selects all agents whose centre falls within the drawn rect |
| Middle button drag | Pan the camera |
| Scroll wheel | Zoom toward cursor |

### Selection system

The grid supports two ways to select agents:

| Interaction | Result |
|---|---|
| Click on agent | Single-select that agent (deselects others) |
| Drag on canvas | Rectangle selection — selects all agents whose centre falls within the drawn rect |
| Click on empty space | Deselects all agents |

**Click detection:** On `pointerup`, if the pointer moved < 5 px since `pointerdown`, it is treated as a click. The click position is converted from screen → world coordinates and compared to each agent's position via `hitTestAgent` (circular radius 28 px).

**Rectangle selection:** On left `pointerdown`, `isRectSelectingRef` is set and the start point recorded. On each `pointermove` the end point is updated. The ticker draws a semi-transparent indigo rect in screen space via `selectionRectGfxRef` (a `PIXI.Graphics` on `app.stage`). On `pointerup`, if the pointer moved ≥ 5 px, the rect corners are converted to world coords and `agentInRect` tests each agent. If the pointer barely moved (click), it falls through to agent hit-test selection instead.

**Camera pan:** Middle mouse button (`button === 1`) on `pointerdown` sets `dragging = true`. `pointermove` accumulates delta and calls `applyView()`. Middle `pointerup` clears `dragging`.

**Visual feedback:** `drawStickFigure` receives `selected = true` for every agent whose ID is in `selectedAgentIdsRef`. Selected agents show a white glow ring around their head.

### Agent Panel

A unified dialog panel opens when the user clicks a single agent. It has two modes switchable via tabs:

| Mode | Purpose |
|---|---|
| **Run** | Enter a task description (textarea), choose delivery method (Počkat / Inbox), click Spustit to submit. |
| **Edit** | Edit the agent's name, goal, and persona inline; click Uložit to apply. |

The panel is a centered fixed overlay (`AgentPanel` component). Clicking the backdrop or the × button dismisses it. On dismiss, selection is cleared.

**State management for the panel:**
- `panelAgentId: string | null` (React state in `Grid2D`) — which agent's panel is open.
- `agentDefs: AgentDef[]` (React state in `Grid2D`) — mutable copy of agent definitions updated by Edit saves.
- On `handleEditSave`, both `agentDefs` state and the live `agentsRef` entry are updated.
- On `handleRunTask`, the payload is forwarded to `runEngineRef.current` via `createRun()` + `startRun()`. The resulting run events drive visual effects on the agent (see Run-State Visual Effects below).

**File:** `app/components/AgentPanel.tsx`

**Exports:**
- `AgentPanel` — default export, the panel component.
- `PanelMode` — `'run' | 'edit'`
- `DeliveryMode` — `'wait' | 'inbox'`
- `RunTaskPayload` — `{ agentId, task, delivery }`
- `EditSavePayload` — `{ agentId, name, goal, persona }`
- `AgentPanelProps` — props interface

### Selection UI

| Selection size | UI |
|---|---|
| 0 agents | No panel |
| 1 agent | Agent Panel dialog (Run / Edit modes) |
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

## Run-State Visual Effects

When the user submits a task via the Agent Panel, the run lifecycle is connected to the 2D world in real time, producing two visual effects on the targeted agent:

### Pulse ring (run is `running`)

A coloured ring drawn around the agent's head pulses rhythmically while the run is executing.

- **Colour:** agent's own colour
- **Frequency:** 2.5 rad/s (`PULSE_FREQ`)
- **Radius:** `HEAD_R + 7 ± 3 px` (sinusoidal oscillation)
- **Alpha:** `0.45 ± 0.25` (sinusoidal oscillation)
- Rendered _behind_ the head so it does not obscure the figure

### Completion glow (run just `completed`)

A bright white expanding ring flashes and fades out when a run completes.

- **Duration:** 1 500 ms (`GLOW_DURATION_MS`)
- **Expansion:** radius grows from `HEAD_R + 5 px` to `HEAD_R + 33 px`
- **Alpha:** fades linearly from `0.85` to `0`
- **Stroke width:** decreases from `3 px` to `1 px`
- After `GLOW_DURATION_MS` the effect is cleared and no longer rendered

### Data flow

```
User submits task (AgentPanel)
  └─ Grid2D.handleRunTask()
       └─ RunEngine.createRun() + startRun()
            ├─ run:started   → agentRunInfoRef[agentId] = runStarted()
            ├─ run:completed → agentRunInfoRef[agentId] = runCompleted()
            └─ run:failed    → agentRunInfoRef[agentId] = runFailed()

pixi ticker (every frame)
  └─ tickRunInfo(runInfo, deltaSeconds, now)
       ├─ returns { runTime, completionAge, glowExpired }
       └─ drawStickFigure(gfx, state, selected, runTime, completionAge)
            ├─ calcPulseRing(runTime, HEAD_R)    → ring params
            └─ calcCompletionGlow(completionAge) → glow params
```

### Run animation state machine (`agent-run-state.ts`)

Pure functions with no pixi.js / React dependency, fully covered by unit tests in `tests/agent-run-state.test.ts`.

**Factory functions** (called by RunEngine event handlers):

| Function | Returns | Effect |
|---|---|---|
| `runStarted()` | `AgentRunInfo` | Starts the pulse; clears any previous glow |
| `runCompleted(now?)` | `AgentRunInfo` | Stops the pulse; starts the glow timer |
| `runFailed()` | `AgentRunInfo` | Clears all animation state (no glow on failure) |

**Tick function** (called every pixi frame):

| Function | Input | Output |
|---|---|---|
| `tickRunInfo(runInfo, deltaSeconds, now, glowDurationMs?)` | current state + frame delta | `{ runTime, completionAge, glowExpired }` |

- `runTime` is non-null while `runState === 'running'`; used as phase for `calcPulseRing`.
- `completionAge` is non-null while the glow animation is active; used by `calcCompletionGlow`.
- `glowExpired` signals when the caller should clear `completionStart` from the stored ref.

### Pure animation helpers (`agent-run-effects.ts`)

| Function | Input | Output |
|---|---|---|
| `calcPulseRing(runTime, headR)` | seconds elapsed, head radius | `{ radiusOffset, alpha }` |
| `calcCompletionGlow(completionAge, duration?)` | ms since completion | `{ active, radiusOffset, alpha, strokeWidth }` |

These functions have no pixi.js dependency and are covered by unit tests in `tests/agent-run-effects.test.ts`.

## Run Engine

### Overview

The Run engine manages the lifecycle of task executions ("runs"). It lives entirely in `app/run-engine/` and has no dependency on pixi.js or React — it is fully testable with Vitest and fake timers.

### Run Lifecycle

```
createRun()  ──►  pending
startRun()   ──►  running  ──► [2–6 s delay] ──►  completed
```

| State | Description |
|---|---|
| `pending` | Run created, not yet started |
| `running` | Run is executing; a completion timer is scheduled |
| `completed` | Run finished; `result` text is available |
| `failed` | Reserved for future error handling |

### Public API

```ts
const engine = new RunEngine(options?)

// Create a run (status: 'pending')
const run = engine.createRun(agentId, agentName, agentRole, taskDescription)

// Transition to 'running', schedule completion in 2–6 s
engine.startRun(run.id)

// Query
engine.getRun(run.id)           // → Run | undefined
engine.getAllRuns()              // → Run[]
engine.getRunsByAgent(agentId)  // → Run[]

// Events
const unsub = engine.on('run:completed', (run) => console.log(run.result))
unsub()  // unsubscribe
engine.off('run:created', handler)
```

### Events

| Event | When fired |
|---|---|
| `run:created` | After `createRun()` — status is `pending` |
| `run:started` | After `startRun()` — status is `running` |
| `run:completed` | After the delay expires — status is `completed`, `result` is set |
| `run:failed` | Reserved for future use |

### Configuration

```ts
new RunEngine({
  minDelayMs: 2000,      // default
  maxDelayMs: 6000,      // default
  delayFn: (min, max) => /* custom delay */ // injectable for tests
})
```

### Result Generation

`generateResult(agentName, agentRole, taskDescription, pickIndex?)` is a pure function
that selects one of several plain-prose result templates and fills in agent context.
An optional `pickIndex` enables deterministic selection in tests.

### Modules

| File | Purpose |
|---|---|
| `types.ts` | `Run`, `RunStatus`, `RunEventType`, `RunEventHandler`, `RunEngineOptions` |
| `results.ts` | `generateResult()`, `RESULT_TEMPLATE_COUNT`, template array |
| `engine.ts` | `RunEngine` class, `AgentMeta` interface |
| `index.ts` | Re-exports for external consumers |

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
