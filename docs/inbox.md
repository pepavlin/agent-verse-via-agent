# Inbox — Visual Message Feed

## Overview

The Inbox is a visual feed that collects the results of agent tasks submitted
with the **"Inbox"** delivery mode. Instead of waiting for a result in the panel,
the user gets a non-blocking notification card in the Inbox when the agent finishes.

---

## Message Types

| Type       | Label (CZ) | Icon | Description |
|------------|------------|------|-------------|
| `done`     | Hotovo     | ✓    | Task completed successfully (emerald accent) |
| `question` | Otázka     | ?    | Task in progress OR agent waiting for answer (indigo) |
| `error`    | Chyba      | ✕    | Task failed (red accent) |

The `question` type covers two sub-states:
- **Working** (`awaitingAnswer: false`) — agent is processing; icon pulses.
- **Awaiting answer** (`awaitingAnswer: true`) — agent paused with a clarifying question; an inline reply form appears.

---

## Design Principles

- **No tables, no IDs, no raw timestamps** — only human-readable content.
- **Type communicated visually first** — large coloured icon + label is the dominant element.
- **Coloured card backgrounds** — each type has a subtle tinted background (emerald/indigo/red).
- **Left accent border** — thick coloured left border reinforces the message type at a glance.
- **Agent identity** — colour dot matching the 2D world + agent name.
- **Feed layout** — newest cards first, scrollable, compact.

---

## Architecture

```
Grid2D
  ├── RunEngine (runEngineRef) — singleton, executes tasks asynchronously
  ├── useInbox() — pure state hook: messages[], unreadCount, CRUD
  ├── InboxToggleButton — floating button with unread badge
  └── InboxPanel — slide-in panel with message feed
        └── MessageCard — individual feed card (one per message)
```

### Data flow

1. User opens agent panel, types a task, selects **Inbox** delivery, clicks **Spustit**.
2. `Grid2D.handleRunTask` creates a `RunEngine` run and immediately adds a
   `question` message to the inbox (task in progress, `awaitingAnswer: false`).
3. The inbox panel opens automatically so the user can see the new card.
4. When `run:awaiting` fires, the message text is updated with the agent's question
   and `awaitingAnswer` is set to `true` — an inline reply form appears.
5. The user types an answer and submits it; `Grid2D.handleReplyToQuestion()` calls
   `engine.resumeRun()`. The message returns to a "processing" state.
6. When `run:completed` fires, the message is updated to type `done` with the result.
   When `run:failed` fires, it becomes type `error`.
7. The unread badge on the toggle button increments on each terminal event
   (`done` or `error`). Clicking the toggle calls `markRead()` to reset it.

---

## Components

### `useInbox` (`app/components/use-inbox.ts`)

Custom React hook, owns inbox state. Framework-agnostic — works independently
of RunEngine; coordination is done at the Grid2D level.

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
  id: string              // Matches RunEngine run.id (internal, not shown in UI)
  type: 'done' | 'question' | 'error'
  agentName: string       // Display name
  agentColor: number      // 0xRRGGBB agent brand colour
  task: string            // Original task description
  text: string            // Status/result prose
  awaitingAnswer?: boolean // true when agent is waiting for user reply (needs_user)
}
```

### `InboxToggleButton` (`app/components/Inbox.tsx`)

Small button in the top-right HUD that opens/closes the inbox panel.
Shows an unread badge when there are new terminal messages.

Props: `{ unreadCount, isOpen, onClick }`

### `InboxPanel` (`app/components/Inbox.tsx`)

Fixed-position panel on the right side of the screen. Scrollable feed of
message cards. Each card has a dismiss button; the header has a "Vymazat vše"
(clear all) button and a count display.

Props: `{ messages, isOpen, onClose, onDismiss, onClearAll, onReply? }`

### `MessageCard` (internal, `app/components/Inbox.tsx`)

Visual card for a single message in the feed. Key visual elements:
- **Large type icon** (w-7 h-7 coloured circle) with label
- **Type-coloured card background** (subtle tint: emerald/indigo/red)
- **Left accent border** (border-l-4) matching the type colour
- **Agent identity** (colour dot + name)
- **Task description** (context, smaller text)
- **Result/status text** (main content, lighter text)
- **Inline reply form** (shown when `type === 'question'` and `awaitingAnswer === true`)

When `onReply` is provided and a message has `awaitingAnswer: true`, an inline
textarea + submit button is rendered inside the card. Submitting calls
`onReply(id, trimmedAnswer)`.

### `QuestionModal` (`app/components/QuestionModal.tsx`)

A blocking modal overlay shown for **wait** delivery runs when the agent transitions
to `awaiting`. Displays the agent's question with a textarea for the user's answer.

Props: `{ pending: PendingQuestion | null, onAnswer, onDismiss }`

---

## Visual Design

### Card structure

```
┌─ [colour border] ──────────────────────────────────────┐
│  [●icon] Hotovo              ● AgentName           [✕] │
│                                                        │
│  Task description text (smaller, slate-400)            │
│  Result / status text (main content, slate-100)        │
│                                                        │
│  [Inline reply form — only for awaiting questions]     │
└────────────────────────────────────────────────────────┘
```

### Colour scheme per type

| Type     | Card bg           | Border           | Icon bg            | Icon / label  |
|----------|-------------------|------------------|--------------------|---------------|
| done     | `emerald-950/40`  | `emerald-500`    | `emerald-500/20`   | `emerald-400` |
| question | `indigo-950/40`   | `indigo-500`     | `indigo-500/20`    | `indigo-400`  |
| error    | `red-950/40`      | `red-500`        | `red-500/20`       | `red-400`     |

---

## Test coverage

Tests live in `tests/inbox.test.tsx` and cover:

- `useInbox` hook: add, update, dismiss, clearAll, markRead, unreadCount tracking
- `InboxToggleButton`: rendering, badge display/capping, click handling
- `InboxPanel`: open/close, empty state, all three message types, dismiss,
  clear all, backdrop click, message count footer
- **Inline reply form**: visibility conditions, disabled state, submit with trim,
  Enter key, Shift+Enter no-op, whitespace guard, dismiss still works

All 43 tests pass.
