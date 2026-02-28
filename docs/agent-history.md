# Agent History — Chat-Style Interaction Log

## Overview

Each agent maintains a persistent chat-style history of all task interactions.
The history is visible in a dedicated **Historie** tab inside the AgentPanel
and survives page refreshes via `localStorage`.

---

## User Experience

1. User clicks an agent → AgentPanel opens.
2. User submits a task via the **Run** tab.
3. The task immediately appears in the **Historie** tab as a user bubble
   with a **loading indicator** (the entry is `pending`).
4. When the agent completes the task, the loading indicator is replaced
   by the **agent's response** in a grey bubble (`done`).
5. If the task fails, the error message appears in a **red bubble** (`error`).
6. The **Historie** tab label shows the entry count: `Historie (3)`.
7. The user can clear history for an agent with the **"Smazat historii"** button.

---

## Data Model

### `AgentHistoryEntry`

```ts
interface AgentHistoryEntry {
  id: string                  // Matches RunEngine run.id (used for updateEntry)
  agentId: string             // Which agent this entry belongs to
  task: string                // The user's task (user bubble, right-aligned)
  result?: string             // Agent response or error message (agent bubble)
  status: 'pending' | 'done' | 'error'
  timestamp: string           // ISO-8601 creation time
}
```

### Per-agent capacity

Maximum **50 entries per agent** are kept; oldest entries are dropped first
when the cap is reached.

---

## Architecture

```
Grid2D
  ├── RunEngine (runEngineRef)    — singleton, executes tasks
  ├── useAgentHistory()           — pure state hook, localStorage-backed
  └── AgentPanel
        └── HistoryView           — chat bubbles, clear button
```

### Data flow

1. User submits task → `Grid2D.handleRunTask` is called.
2. `addEntry(agentId, run.id, task)` creates a `pending` entry immediately.
3. RunEngine starts the LLM call asynchronously.
4. On **success**: the executor calls `updateEntry(run.id, { result, status: 'done' })`.
5. On **failure** (HTTP error): the executor calls `updateEntry` with `status: 'error'`
   before rethrowing. A `run:failed` listener handles non-HTTP errors (e.g. network).
6. AgentPanel receives entries via `history={getEntries(panelAgentId)}` prop and
   displays them in the HistoryView.

---

## Components & Files

### `useAgentHistory` (`app/components/use-agent-history.ts`)

Pure React state hook. Does not subscribe to RunEngine directly.

```ts
const {
  getEntries,        // (agentId: string) => AgentHistoryEntry[]
  addEntry,          // (agentId, entryId, task) => void
  updateEntry,       // (entryId, { result, status }) => void
  clearAgentHistory, // (agentId) => void
} = useAgentHistory()
```

**localStorage**: All entries are stored under `agent-verse:history` as a
flat JSON array. Hydrated once on mount (`useEffect`). Saved on every state
change via a second `useEffect`.

### `AgentPanel` (`app/components/AgentPanel.tsx`)

New props added:

```ts
interface AgentPanelProps {
  history: AgentHistoryEntry[]   // filtered for this agent, oldest → newest
  onClearHistory: () => void
}
```

New tab added: **Historie** (tab-history). Renders `HistoryView`.

### `HistoryView` (sub-component of `AgentPanel.tsx`)

- Scrollable container (`max-h-80`, `overflow-y-auto`).
- Scrolls to bottom whenever `history.length` changes.
- **Empty state**: shown when no entries exist.
- **Entry layout**: user task (right, indigo bubble) + agent response (left, grey/red bubble).
- **Footer**: entry count + "Smazat historii" button.

---

## Chat Bubble Design

| Source | Alignment | Style |
|--------|-----------|-------|
| User task | Right | Indigo (`bg-indigo-600/80`) rounded bubble |
| Agent response (done) | Left | Slate (`bg-slate-700/60`) rounded bubble |
| Agent response (error) | Left | Red (`bg-red-900/30`) rounded bubble |
| Pending | Left | Bouncing dots animation |

Agent identity is shown via a coloured avatar circle (matching the
agent's 2D world colour) to the left of each agent bubble.

---

## Test Coverage

Tests live in `tests/agent-history.test.ts` and `tests/agent-panel.test.tsx`.

### `agent-history.test.ts`

- `useAgentHistory — initial state`: empty history for new agent
- `useAgentHistory — addEntry`: pending entry, timestamp, agent isolation, insertion order
- `useAgentHistory — updateEntry`: done/error transition, no-op for unknown id, field preservation
- `useAgentHistory — clearAgentHistory`: clears target agent, leaves others intact
- `useAgentHistory — localStorage persistence`: saves on add, update, and clear

### `agent-panel.test.tsx` (additions)

- History tab button is visible
- Tab switching to/from History mode
- Tab label shows entry count when non-empty
- Empty state message
- `done`, `pending`, `error` entry rendering
- Clear button calls `onClearHistory`
