# Agent History — Chat-Style Interaction Log

## Overview

Each agent maintains a persistent chat-style history of all task interactions.
The history is visible in a dedicated **Log** tab inside the AgentPanel.

History is stored in-memory (React state) for the duration of the browser
session. It is reset when the page is refreshed.

---

## User Experience

1. User clicks an agent → AgentPanel opens on the **Run** tab.
2. User types a task and clicks **Spustit**.
3. The agent runs the task. When it finishes, the outcome is recorded.
4. User opens the **Log** tab to see the interaction history in chat style.
5. Each interaction shows:
   - **User bubble** (right-aligned, grey): the task description the user sent.
   - **Agent bubble** (left-aligned): the agent's response, colour-coded by outcome.
     - `done`     → emerald bubble with "✓ Hotovo" badge
     - `question` → indigo bubble with "? Otázka" badge
     - `error`    → red bubble with "✕ Chyba" badge
6. A **date separator** is automatically inserted between interactions that
   happened on different calendar days:
   - Same day as today   → "Dnes"
   - Previous day        → "Včera"
   - Older               → localised Czech date (e.g. "15. března 2024")
7. The **Log (N)** tab label shows the number of recorded interactions.
8. The user can clear the history for an agent with the **"Vymazat"** button.

---

## Data Model

### `HistoryEntry`

```ts
interface HistoryEntry {
  id: string                         // Auto-generated unique identifier
  agentId: string                    // Which agent this entry belongs to
  task: string                       // The user's task (user bubble, right-aligned)
  type: 'done' | 'question' | 'error'// Visual category — mirrors run terminal states
  result: string                     // Agent response, question, or error text
  timestamp: number                  // Unix ms when the entry was recorded
}
```

---

## Architecture

```
Grid2D
  ├── RunEngine (runEngineRef)       — singleton; executes tasks
  ├── useAgentHistory()              — pure React state hook (Map<agentId, entries[]>)
  └── AgentPanel
        └── AgentHistoryView        — chat bubbles, date separators, clear button
```

### Data flow

1. User submits task via AgentPanel → `Grid2D.handleRunTask` is called.
2. RunEngine executes the task asynchronously.
3. On **success**: `addHistoryEntry({ type: 'done', result, ... })` is called.
4. On **awaiting**: `addHistoryEntry({ type: 'question', result: question, ... })`.
5. On **failure**: `addHistoryEntry({ type: 'error', result: errorText, ... })`.
6. `AgentPanel` receives the updated history via `history={getHistory(agentId)}`.
7. `AgentHistoryView` renders chat bubbles with `groupEntriesWithSeparators()`
   to insert date separators between different-day groups.

---

## Components & Files

### `useAgentHistory` (`app/components/use-agent-history.ts`)

Pure React state hook. Does not subscribe to RunEngine directly.

```ts
const {
  getHistory,    // (agentId: string) => HistoryEntry[]
  addEntry,      // (entry: Omit<HistoryEntry, 'id'>) => void
  clearHistory,  // (agentId: string) => void
} = useAgentHistory()
```

State is a `Map<string, HistoryEntry[]>` (agentId → ordered entries).

### `AgentPanel` (`app/components/AgentPanel.tsx`)

Props related to history:

```ts
interface AgentPanelProps {
  history?: HistoryEntry[]          // filtered for this agent, oldest → newest
  onClearHistory?: () => void
}
```

Tabs: **Run** · **Edit** · **Log** (`tab-log`). Renders `AgentHistoryView`.

### `AgentHistoryView` (sub-component of `AgentPanel.tsx`)

- Scrollable container (`max-h-64`, `overflow-y-auto`).
- Scrolls to bottom whenever `history.length` changes (including on mount).
- **Empty state**: shown when no entries exist.
- **Date separators**: auto-inserted between entries from different calendar days.
- **Entry layout**: user task (right, grey bubble) + agent response (left, colour-coded bubble).
- **Footer**: entry count + "Vymazat" button.

### Date separator utilities (exported from `AgentPanel.tsx`)

```ts
// Returns YYYY-MM-DD string from a Unix ms timestamp (local time)
getDateKey(ts: number): string

// Returns a Czech label for a YYYY-MM-DD key:
//   today      → "Dnes"
//   yesterday  → "Včera"
//   older      → localised full date
formatDateLabel(isoDate: string): string

// Interleaves DateSeparatorItem objects between HistoryEntry objects
// whenever the calendar date changes (oldest → newest order preserved)
groupEntriesWithSeparators(entries: HistoryEntry[]): Array<HistoryEntry | DateSeparatorItem>
```

---

## Chat Bubble Design

| Source | Alignment | Style |
|--------|-----------|-------|
| User task | Right | Slate (`bg-slate-700/80`) rounded bubble |
| Agent done | Left | Emerald (`bg-emerald-950/60`) with "✓ Hotovo" badge |
| Agent question | Left | Indigo (`bg-indigo-950/60`) with "? Otázka" badge |
| Agent error | Left | Red (`bg-red-950/60`) with "✕ Chyba" badge |
| Date separator | Centre | Thin horizontal rule with date label |

Agent identity is shown via a small coloured dot (matching the agent's 2D world
colour) to the left of each agent bubble. Timestamps are shown as relative
strings (e.g. "právě teď", "před 5 min", "před 2 hod") or an absolute date for
messages older than 24 hours.

---

## Test Coverage

Tests live in `tests/agent-history.test.ts` and `tests/agent-panel.test.tsx`.

### `agent-history.test.ts`

- Initial state — empty arrays for unknown agents
- `addEntry` — stores entries, assigns unique IDs, maintains insertion order
- Per-agent isolation — entries for different agents stay separate
- All three types (`done`, `question`, `error`) are stored correctly
- `clearHistory` — removes target agent's entries, leaves others intact

### `agent-panel.test.tsx`

- Log tab button is visible; label shows entry count when non-empty
- Empty state is shown when `history` is empty or omitted
- Task bubble and result bubble render with correct text per entry
- Type badges ("Hotovo", "Otázka", "Chyba") reflect `entry.type`
- Clear button calls `onClearHistory`
- Date separators appear between entries on different days
- No duplicate separators for same-day entries
- `getDateKey`, `formatDateLabel`, `groupEntriesWithSeparators` unit tests
