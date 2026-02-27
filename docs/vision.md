# Product Vision

## Concept

Agent Verse is a **visual 2D world** where AI agents exist as living characters (animated stick figures) on an interactive map. It is **not** a task management system, admin dashboard, or developer tool. It is an environment — a place you visit, explore, and interact with naturally.

## Core Experience

1. **Explore** — the user navigates a 2D world by panning and zooming with the mouse
2. **Discover** — agents wander the map autonomously; they feel alive
3. **Engage** — click on any agent to open a natural interaction
4. **Assign** — type a task in plain language ("find information about X", "write a poem", "summarise this")
5. **Wait visually** — the agent enters a visible "busy" state (visual indicator, distinct animation or aura)
6. **Receive** — the result arrives and is shown in a simple, readable way — no jargon, no IDs, no enums

## UX Principles

### What the user SEES
- Agents moving, living, breathing on the map
- A natural bubble/panel when clicking an agent
- A simple text field to type a task
- A clear visual signal that the agent is working (spinning aura, colour shift, thought bubble)
- The result in clean prose when done

### What the user NEVER SEES
- `run_id`, `task_id`, or any UUID
- Status enums (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`)
- Raw JSON or data structures
- Error stack traces
- Technical loading spinners with HTTP status codes

## Design Constraints

| Constraint | Description |
|---|---|
| Minimalist | No admin panels, no tables, no dashboards |
| Graphical | Everything expressed visually, not textually |
| Living | The world should feel animated and alive at all times |
| Natural | Interaction feels like talking to a character, not submitting a form |
| Internal complexity | All state machines, API calls, retries, etc. are hidden from view |

## What This Is NOT

- ❌ A task queue manager
- ❌ A job monitoring dashboard
- ❌ A developer console
- ❌ An admin interface
- ❌ A chat application (it's a world, not a chat room)

## Interaction Pattern

```
User pans map → spots an agent → clicks → panel opens
User types: "Summarise the latest AI news"
Agent: animates as "thinking" (visual busy state)
Agent: visual result panel appears when done
User reads result, dismisses, continues exploring
```

## Implementation Guidance

Every feature must pass this test:
> "Would a non-technical person understand what's happening just by looking at the screen?"

If the answer is no, the feature is too technical and must be abstracted.

All agent task execution, status tracking, API integration, and error handling lives **inside the system** — invisible to the user. The UI surface is a window into a living world, not a control panel.
