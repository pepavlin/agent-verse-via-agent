# MockLLM Service

## Overview

The MockLLM subsystem generates realistic fake LLM responses for agent tasks without requiring an Anthropic API key. It is composed of four layers:

| Layer | File | Responsibility |
|-------|------|----------------|
| Pure generation functions | `app/run-engine/realistic-results.ts` | Topic detection, persona style detection, style-bucketed template selection |
| Generic fallback functions | `app/run-engine/results.ts` | Simple agent-name / role / task templates (no topic awareness) |
| **MockLLMService** (service) | `app/run-engine/mock-llm-service.ts` | Stateful service: encapsulates agent config, caches style, exposes clean API |
| MockLLM (executor adapter) | `app/run-engine/mock-llm.ts` | Wraps generation with timing delays and probability control for RunEngine |
| **Demo mode executor factory** | `app/run-engine/demo-executor.ts` | UI integration: creates MockLLM executors with agent goal/persona for Grid2D demo mode |

---

## Response Generation Pipeline

```
task description
      │
      ▼
 detectTopic()          ← keyword heuristics (9 categories)
      │
      ├─ topic: exploration | construction | intelligence | defense
      │          coding | research | communication | planning | general
      │
      ▼
agent.persona
      │
      ▼
 detectPersonaStyle()   ← keyword heuristics (5 styles)
      │
      ├─ style: bold | methodical | swift | steadfast | neutral
      │
      ▼
 RESULT_STYLE_BUCKETS[topic][style]
      │
      ├─ subset of template indices appropriate for this persona style
      │
      ▼
 Pick template from bucket (random or deterministic via pickIndex)
      │
      ▼
 Interpolate: agentName, agentRole, taskDescription, agentGoal
      │
      ▼
 Inject goal if not already present in template output
      │
      ▼
 Final response string
```

---

## Topic Detection

Topic is inferred from the **task description** using keyword matching. The category with the most keyword hits wins. Returns `'general'` as a fallback when no keywords match.

| Category | Example keywords |
|----------|-----------------|
| `exploration` | map, explore, survey, scan, chart, navigate, territory |
| `construction` | build, construct, install, repair, deploy, structure |
| `intelligence` | scout, intel, recon, observe, gather, track, detect |
| `defense` | defend, protect, secure, guard, patrol, monitor, fortify |
| `coding` | code, debug, implement, refactor, api, algorithm, test |
| `research` | analyze, research, study, investigate, review, benchmark |
| `communication` | send, message, notify, broadcast, alert, transmit |
| `planning` | plan, organize, coordinate, schedule, strategy, roadmap |
| `general` | *(fallback — no keywords matched)* |

---

## Persona Style Detection

Style is inferred from the **agent's persona description** using keyword matching. The style with the most hits wins. Returns `'neutral'` when persona is absent or unrecognised.

| Style | Example keywords | Tone of generated responses |
|-------|-----------------|------------------------------|
| `bold` | bold, curious, adventurous, daring, fearless, venture | Short, action-first, confident |
| `methodical` | methodical, reliable, careful, systematic, precise | Detailed, structured, step-by-step |
| `swift` | fast, quick, agile, rapid, move, speed | Brief, punchy, efficient |
| `steadfast` | steadfast, vigilant, responsible, duty, protect | Formal, thorough, duty-conscious |
| `neutral` | *(fallback)* | Balanced — full template variety |

### Real Agent Style Mapping

| Agent | Persona keywords | Detected style |
|-------|-----------------|---------------|
| Alice (Explorer) | curious, bold, venture | `bold` |
| Bob (Builder) | methodical, reliable, solid | `methodical` |
| Carol (Scout) | fast, observant, lingers | `swift` |
| Dave (Defender) | steadfast, vigilant, abandon, post | `steadfast` |

---

## Style-Bucketed Template Selection

Each topic has 5 result templates and 3 question templates. Instead of picking randomly from all templates regardless of persona, the service uses **style buckets** — a mapping from `PersonaStyle` to the template indices that match that style's tone.

### Example: Exploration Result Templates

| Index | Excerpt | Style bucket |
|-------|---------|-------------|
| 0 | "Mapping operation complete. Alice has fully charted…" | `bold` |
| 1 | "Alice (Explorer) filed the following field report…" | `methodical` |
| 2 | "Exploration of … concluded. Alice documented 14 waypoints…" | `steadfast` |
| 3 | "Alice the Explorer completed the survey… Terrain: mixed forest…" | `methodical` |
| 4 | "… — fully executed. Alice returned with high-resolution sector data…" | `swift` |

When a `bold` Alice explores, only template 0 is eligible. When `methodical` Bob explores, templates 1 and 3 are eligible. The `neutral` style uses all templates.

This ensures the **agent's personality consistently reflects in every response**, not just in detected metadata.

---

## MockLLMService API

### Construction

```typescript
import { MockLLMService, createMockLLMService } from '@/app/run-engine'

// Via constructor
const service = new MockLLMService({
  agentName: 'Alice',
  agentRole: 'Explorer',
  goal: 'Map all unexplored areas of the grid',
  persona: 'Curious and bold. Always the first to venture.',
})

// Via factory (equivalent)
const service = createMockLLMService({ agentName: 'Alice', ... })
```

### Config Options

```typescript
interface MockLLMServiceConfig {
  agentName: string              // Agent display name
  agentRole: string              // Role label
  goal?: string                  // Mission statement (enables realistic generation)
  persona?: string               // Personality description (drives style detection)
  useRealisticGeneration?: boolean  // Override automatic realistic/generic choice
}
```

### Methods

```typescript
// Generate a task completion result
const result = service.generateResult('Map the north sector')
const result = service.generateResult('Map the north sector', 2)  // deterministic index

// Generate a clarifying question
const question = service.generateQuestion('Map the north sector')

// Introspect topic detection
const topic = service.detectTopicFor('Map the north sector')  // → 'exploration'
```

### Getters

```typescript
service.agentName     // → 'Alice'
service.agentRole     // → 'Explorer'
service.goal          // → 'Map all unexplored areas…' | undefined
service.persona       // → 'Curious and bold…' | undefined
service.personaStyle  // → 'bold' | 'methodical' | 'swift' | 'steadfast' | 'neutral'
service.isRealistic   // → true if realistic generation is active
```

---

## MockLLM API

### Key methods

```typescript
// Async: resolves after simulated delay — for use with RunEngine.startRun()
mock.run(): Promise<MockLLMResponse>

// Sync: returns immediately — used internally by RunEngine's built-in mock path
mock.generateSync(): MockLLMResponse

// Wraps run() as a RunExecutor-compatible function
mock.asExecutor(): () => Promise<MockLLMResponse>
```

### `generateSync()` — synchronous generation

`generateSync()` is the **core generation method**: it applies the result/question probability, selects templates (generic or realistic), and returns a `MockLLMResponse` without any timing delay.

- `run()` calls `generateSync()` after the configured delay — both paths produce identical content.
- `RunEngine._completeRunWithMock()` calls `generateSync()` inside its `setTimeout` callback — the engine's built-in mock (no-executor path) uses the same generation logic as `MockLLM.asExecutor()`.

This makes `MockLLM` the **single source of truth** for mock response generation across both code paths.

---

## MockLLM vs MockLLMService

| | MockLLM | MockLLMService |
|---|---------|---------------|
| **Primary use** | RunEngine executor (timing + probability) | Content generation (standalone) |
| **Timing control** | Yes (`minDelayMs`, `maxDelayMs`, `delayFn`) | No |
| **Probability control** | Yes (`questionProbability`) | No |
| **RunEngine integration** | Yes (`asExecutor()`) | No |
| **Synchronous generation** | Yes (`generateSync()`) | Yes (direct method calls) |
| **Style-bucketed selection** | Yes (via updated `generateRealistic*` functions) | Yes |
| **Caches persona style** | No (recalculates on each call) | Yes (cached at construction) |
| **Standalone testability** | `generateSync()` is testable without fake timers | Direct synchronous calls |

Both classes use the same underlying `generateRealisticResult()` / `generateRealisticQuestion()` functions, so improvements to the generation pipeline benefit both.

---

## RunEngine built-in mock and configSnapshot

When `RunEngine.startRun()` is called **without an executor** (built-in mock path), it creates a `MockLLM` internally and calls `generateSync()` after the configured delay. Crucially, if the run has a `configSnapshot` with `goal` or `persona` fields, these are forwarded to `MockLLM`, enabling realistic generation even in no-executor mode:

```typescript
// configSnapshot passed at run creation time
const snapshot = { id: 'agent-alice', name: 'Alice', role: 'Explorer',
                   goal: 'Map all unexplored areas', persona: 'Curious and bold.',
                   configVersion: 1 }

const run = engine.createRun('agent-alice', 'Alice', 'Explorer', 'Map the north sector',
                             undefined, snapshot)
engine.startRun(run.id)  // no executor — built-in mock uses snapshot.goal + snapshot.persona
// run.result will contain the goal text (realistic generation active)
```

This ensures that the engine's built-in mock produces contextual, persona-styled responses identical to those produced via `MockLLM.asExecutor()`, with no extra configuration needed at the call site.

---

## Adding New Templates

### Add a result template

1. Append to the appropriate `*_RESULT_TEMPLATES` array in `realistic-results.ts`.
2. Add the new index to the relevant style bucket(s) in `RESULT_STYLE_BUCKETS`.
3. Update `tests/mock-llm-service.test.ts` if the bucket counts changed.

### Add a new topic

1. Add the new value to the `TopicCategory` union type.
2. Add keywords to `TOPIC_KEYWORDS`.
3. Add template arrays: `NEW_TOPIC_RESULT_TEMPLATES` and `NEW_TOPIC_QUESTION_TEMPLATES`.
4. Add to `REALISTIC_RESULT_TEMPLATES` and `REALISTIC_QUESTION_TEMPLATES` maps.
5. Add style bucket entries to `RESULT_STYLE_BUCKETS` and `QUESTION_STYLE_BUCKETS`.
6. Add to `ALL_TOPIC_CATEGORIES`.
7. Add a task fixture to `TOPIC_TASKS` in `tests/mock-llm-service.test.ts`.

### Add a new persona style

1. Add the value to the `PersonaStyle` union type.
2. Add keywords to `PERSONA_STYLE_KEYWORDS`.
3. Add the style key to every entry in `RESULT_STYLE_BUCKETS` and `QUESTION_STYLE_BUCKETS`.
4. Add to `ALL_PERSONA_STYLES`.

---

## Demo Mode (Grid2D Integration)

Demo mode is the UI-level integration of the MockLLM subsystem. It activates when the user has not yet configured a real Anthropic API key, allowing the app to remain fully functional with simulated responses.

### Activation

Demo mode is controlled by the `demoMode` React state in `Grid2D.tsx`:

- **Automatic**: When a run attempt returns HTTP 402 (no API key), demo mode is enabled automatically.
- **Manual (banner)**: The API key setup banner offers a "Zkusit demo →" button.
- **Manual (badge)**: Clicking the amber "Demo" badge in the top-left toolbar disables demo mode.

### Visual Indicator

An amber "Demo" badge appears in the top-left toolbar whenever demo mode is active. A dismissable banner also appears to explain the mode and link to the settings.

### How It Works

When `demoMode` is `true`, `Grid2D.tsx` uses executor factories from `demo-executor.ts` instead of the real `/api/run` API calls:

```typescript
// Single-agent run in demo mode
engine.startRun(run.id, createDemoExecutor(toDemoContext(def), payload.task))

// Delegation in demo mode
const childFactory = createDemoChildExecutorFactory(childContextMap, payload.task)
const parentFactory = createDemoParentExecutorFactory(toDemoContext(def), payload.task)
engine.startRunWithChildren(run.id, childDefs, parentFactory, childFactory)
```

### `demo-executor.ts` API

```typescript
// Create an executor for a single demo run
createDemoExecutor(agent: DemoAgentContext, task: string, overrides?): RunExecutor

// Create a child executor factory for delegation
createDemoChildExecutorFactory(
  agentContextMap: ReadonlyMap<string, DemoAgentContext>,
  task: string,
): (childAgentId: string) => RunExecutor

// Create a parent executor factory for delegation synthesis
createDemoParentExecutorFactory(
  parentContext: DemoAgentContext,
  task: string,
): (completedChildRuns) => RunExecutor
```

### Demo Mode Defaults

| Setting | Value | Notes |
|---------|-------|-------|
| `questionProbability` | 0.25 | 25% chance of clarifying question |
| `minDelayMs` | 1 500 ms | Snappier than default (2 000 ms) |
| `maxDelayMs` | 4 000 ms | Snappier than default (6 000 ms) |

Parent synthesis executors always use `questionProbability: 0` (always produce a result, never a question).
