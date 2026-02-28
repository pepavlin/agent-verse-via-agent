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
    agent-runes.ts      – Pure rune glyph animation math (orbit + flash, no pixi.js dep)
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
  agent-runes.test.ts       – Unit tests for rune orbit and flash animation math
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
            ├─ run:awaiting  → agentRunInfoRef[agentId] = runCompleted()  (same glow)
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

### Rune glyphs (`agent-runes.ts`)

Elder Futhark Unicode glyphs that orbit around an agent's head to make task execution visually dramatic.

#### Running state — orbiting pulse

Four rune characters (`ᚠ ᚱ ᚾ ᛏ`) orbit the head at `RUNE_ORBIT_RADIUS = 26 px` with angular velocity `RUNE_ORBIT_SPEED = 0.7 rad/s`. Each rune also pulses independently:

| Property | Range | Frequency |
|---|---|---|
| alpha | 0.25 – 0.85 | 2.0 rad/s |
| scale | 0.8 – 1.2 | 2.0 rad/s |
| tint | agent colour | — |

The pulse phases are staggered by `2π/RUNE_COUNT` per rune so they do not all blink in unison.

#### Completion state — flash outward

When the run completes the runes switch to a brief `1 000 ms` flash:

- Angle is fixed (evenly distributed, no more orbiting).
- Radius expands from `RUNE_ORBIT_RADIUS` → `+22 px` over the flash lifetime.
- Alpha rises quickly (first 15 %) then fades to zero.
- Scale grows from 1 → 1.5×.
- Tint switches to **white** (`0xffffff`) for maximum brightness.

#### Implementation

Rune texts are `PIXI.Text` children of each agent's `PIXI.Container`. They are created once (with `fill: 0xffffff`) and their `x/y/alpha/scale/tint/visible` properties are updated imperatively every pixi ticker frame via `calcRuneOrbit` or `calcRuneFlash`. No React re-renders are involved.

```
AgentEntry {
  state: AgentState
  gfx: PIXI.Graphics      ← stick figure (cleared + redrawn each frame)
  runeTexts: PIXI.Text[]  ← 4 rune glyphs (updated in place each frame)
  container: PIXI.Container
}
```

#### Updated data flow

```
pixi ticker (every frame)
  └─ tickRunInfo(runInfo, deltaSeconds, now)
       ├─ returns { runTime, completionAge, glowExpired }
       ├─ drawStickFigure(gfx, state, selected, runTime, completionAge)
       │    ├─ calcPulseRing(runTime, HEAD_R)    → ring params
       │    └─ calcCompletionGlow(completionAge) → glow params
       └─ forEach runeText[i]:
            ├─ if runTime     → calcRuneOrbit(i, RUNE_COUNT, runTime, agentColor)
            ├─ if completionAge → calcRuneFlash(completionAge, i, RUNE_COUNT)
            └─ else           → runeText.visible = false
```

Pure helper functions are in `app/components/agent-runes.ts` and covered by unit tests in `tests/agent-runes.test.ts`.

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
                     │
startRun()   ──►  running  ──► [2–6 s delay] ──┬──►  completed  (result set)
                                                ├──►  awaiting   (question set, mock only)
                                                └──►  failed     (error set)
```

| State | Description |
|---|---|
| `pending` | Run created, not yet started |
| `running` | Run is executing; a completion timer is scheduled |
| `completed` | Run finished; `result` text is available |
| `awaiting` | Agent raised a clarifying question; `question` text is available (mock mode only) |
| `failed` | Run terminated with an error; `error` text is available |

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
| `run:awaiting` | After the delay expires (mock only) — status is `awaiting`, `question` is set |
| `run:failed` | On executor error — status is `failed`, `error` is set |

### Configuration

```ts
new RunEngine({
  minDelayMs: 2000,              // default
  maxDelayMs: 6000,              // default
  delayFn: (min, max) => ...,   // injectable for tests
  mockQuestionProbability: 0.3,  // 30% chance of question in mock mode (default)
})
```

### Result and Question Generation

Both generators are pure functions in `results.ts`:

- `generateResult(agentName, agentRole, taskDescription, pickIndex?)` — selects one of 8 completion templates.
- `generateQuestion(agentName, agentRole, taskDescription, pickIndex?)` — selects one of 8 clarifying-question templates.

An optional `pickIndex` enables deterministic template selection in tests.

### Mock mode — result vs question

When `startRun()` is called without an executor the engine schedules a timeout.
After the delay:

1. `Math.random()` is compared to `mockQuestionProbability`.
2. If the random value is **below** the probability → question path: status becomes `awaiting`, `run:awaiting` is emitted.
3. Otherwise → result path: status becomes `completed`, `run:completed` is emitted.

The real LLM executor path is unaffected and always resolves to `completed` or `failed`.

### Modules

| File | Purpose |
|---|---|
| `types.ts` | `Run`, `RunStatus`, `RunEventType`, `RunEventHandler`, `RunEngineOptions` |
| `results.ts` | `generateResult()`, `RESULT_TEMPLATE_COUNT`, `generateQuestion()`, `QUESTION_TEMPLATE_COUNT` |
| `engine.ts` | `RunEngine` class, `AgentMeta` interface, `RunExecutor` type |
| `index.ts` | Re-exports for external consumers |

## Delegation Scene (`/delegation`)

A self-contained animated 2D world that visualises the concept of **task delegation** between stick-figure agents. It lives at the `/delegation` route and uses the same Pixi.js stack as the main Grid2D world.

### Files

| File | Purpose |
|---|---|
| `app/delegation/page.tsx` | Next.js page that renders `<DelegationScene />` |
| `app/components/DelegationScene.tsx` | Pixi.js scene component (canvas lifecycle, per-frame update) |
| `app/components/delegation-logic.ts` | Pure logic: phase definitions, movement helpers, arc math (no pixi.js) |
| `tests/delegation-scene.test.ts` | 29 unit tests for pure logic |

### Phase state machine

The scene cycles through 10 phases and then loops:

| # | Phase | English description | Czech description |
|---|---|---|---|
| 1 | `idle` | Manager notices a task, shows "?" bubble. Worker wanders. | Manažer zjistí, co je třeba udělat |
| 2 | `calling` | Manager calls the worker | Manažer zavolá pracovníka |
| 3 | `meeting` | Worker walks to manager's position | Pracovník přichází za manažerem |
| 4 | `briefing` | Manager delegates: "Build the bridge at Sector 7!" | Deleguje: "Postav most v Sektoru 7!" |
| 5 | `acknowledging` | Worker: "Understood! I'm on it!" | Pracovník: "Rozumím! Jdu na to!" |
| 6 | `executing` | Animated dashed arrow + flying task card; worker walks to task | Pracovník se vydává k místu úkolu |
| 7 | `working` | Worker at task location, animated "Working…" bubble | Pracovník plní delegovaný úkol |
| 8 | `completing` | Task done; task marker turns green with checkmark | Úkol úspěšně splněn |
| 9 | `reporting` | Worker returns to manager | Pracovník se vrací s hlášením |
| 10 | `celebrating` | Both celebrate; manager: "Excellent work!" | Manažer: "Výborná práce!" |

### Czech localisation

All visible text in the scene is rendered in Czech:

| Element | Value |
|---|---|
| Scene title | "Delegace v 2D světě" |
| Subtitle | "Delegation in a 2D World" (English, dimmed) |
| Agent labels | "Manažer" (red), "Pracovník" (blue) |
| Task location | "Sektor 7" |
| Flying card | "ÚKOL" |
| Phase bar | Czech subtitle (bold) + English (dimmed) |
| Speech bubbles | Czech (sourced from `MGR_BUBBLE_CS` / `WKR_BUBBLE_CS`) |

`delegation-logic.ts` exports three localisation maps:

| Export | Type | Purpose |
|---|---|---|
| `PHASE_TEXT` | `Record<Phase, string>` | English phase bar label |
| `PHASE_TEXT_CS` | `Record<Phase, string>` | Czech phase bar label |
| `MGR_BUBBLE_CS` | `Partial<Record<Phase, string>>` | Czech manager speech bubble text per phase |
| `WKR_BUBBLE_CS` | `Partial<Record<Phase, string>>` | Czech worker speech bubble text per phase |

### Navigation

The main `Grid2D` world includes a **Delegace** button in the top-left HUD (next to the user/settings button). Clicking it navigates to `/delegation` using Next.js `<Link>`. The icon is a people-group SVG in emerald green, with the text "Delegace" hidden on small screens.

### Key design decisions

- **Pure logic / rendering split:** `delegation-logic.ts` exports only pure functions (movement, phase math, arc interpolation). These are unit-tested without a browser or pixi.js context.
- **Immutable agent updates:** `moveToward()` returns a new `SceneAgent` object rather than mutating in place, matching the style of `agent-logic.ts`.
- **SceneAgent ↔ AgentState compatibility:** `SceneAgent` satisfies the structural shape of `AgentState` so `drawStickFigure()` from `agent-drawing.ts` can be reused unchanged.
- **Speech bubbles as world objects:** Bubbles are `PIXI.Container` children of `app.stage`, positioned in world space each frame so they naturally follow agent movement.
- **Progress indicator:** A thin blue bar at the very bottom of the scene fills left-to-right over the duration of each phase.
- **Bilingual bar:** The phase info bar at the bottom shows Czech text (bold, white) on the lower line and English (dimmer, smaller) on the upper line, supporting both Czech and international users.

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
