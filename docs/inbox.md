# Inbox — Message Feed

## Overview

The Inbox is a visual feed that collects the results of agent tasks submitted
with the **"Inbox"** delivery mode. Instead of waiting for a result in the panel,
the user gets a non-blocking notification card in the Inbox when the agent finishes.

---

## Message Types

| Type     | Label (CZ) | Icon | Description |
|----------|-----------|------|-------------|
| `done`     | Hotovo    | ✓    | Task completed successfully (green accent) |
| `question` | Otázka    | ?    | Task in progress — agent is working (indigo, pulsing) |
| `error`    | Chyba     | ✕    | Task failed (red accent) |

---

## Architecture

```
Grid2D
  ├── RunEngine (runEngineRef) — singleton, executes tasks asynchronously
  ├── useInbox() — pure state hook: messages[], unreadCount, CRUD
  ├── InboxToggleButton — floating button with unread badge
  └── InboxPanel — slide-in panel with message cards
```

### Data flow

1. User opens agent panel, types a task, selects **Inbox** delivery, clicks **Spustit**.
2. `Grid2D.handleRunTask` creates a `RunEngine` run and immediately adds a
   `question` message to the inbox (task in progress).
3. The inbox panel opens automatically so the user can see the new card.
4. When the `RunEngine` emits `run:completed`, the message is updated to type `done`
   with the result text. When `run:failed` fires, it becomes type `error`.
5. The unread badge on the toggle button increments on each terminal event
   (`done` or `error`). Clicking the toggle calls `markRead()` to reset it.

---

## Components

### `useInbox` (`app/components/use-inbox.ts`)

Custom React hook, owns inbox state. Framework-agnostic — works independently
of RunEngine, coordination is done at the Grid2D level.

```ts
const {
  messages,       // InboxMessage[]
  unreadCount,    // number
  addMessage,     // (msg: InboxMessage) => void
  updateMessage,  // (id: string, updates: Partial<InboxMessage>) => void
  dismissMessage, // (id: string) => void
  clearAll,       // () => void
  markRead,       // () => void
} = useInbox()
```

#### `InboxMessage` type

```ts
interface InboxMessage {
  id: string              // Matches RunEngine run.id
  type: 'done' | 'question' | 'error'
  agentName: string       // Display name (not stored in Run, resolved from AgentDef)
  agentColor: number      // 0xRRGGBB agent brand colour
  task: string            // Original task description
  text: string            // Status/result prose
}
```

### `InboxToggleButton` (`app/components/Inbox.tsx`)

Small button in the top-right HUD that opens/closes the inbox panel.
Shows an unread badge when there are new terminal messages.

Props: `{ unreadCount, isOpen, onClick }`

### `InboxPanel` (`app/components/Inbox.tsx`)

Fixed-position panel on the right side of the screen. Scrollable list of
message cards. Each card has a dismiss button; the header has a "Vymazat vše"
(clear all) button.

Props: `{ messages, isOpen, onClose, onDismiss, onClearAll }`

---

## Visual Design Decisions

- **No tables, no IDs, no raw timestamps** — only human-readable text.
- Cards use a coloured left border to communicate type at a glance.
- The `question` icon pulses (CSS `animate-pulse`) to indicate activity.
- Agent identity is shown via a coloured dot (matching the 2D world colour)
  and the agent name.
- The panel overlays the grid but has a semi-transparent backdrop that closes
  it on click, keeping the UI non-intrusive.

---

## Test coverage

Tests live in `tests/inbox.test.tsx` and cover:

- `useInbox` hook: add, update, dismiss, clearAll, markRead, unreadCount tracking
- `InboxToggleButton`: rendering, badge display/capping, click handling
- `InboxPanel`: open/close, empty state, all three message types, dismiss,
  clear all, backdrop click, message count footer
