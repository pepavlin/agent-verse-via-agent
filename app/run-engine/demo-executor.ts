// ---------------------------------------------------------------------------
// Demo-mode executor factory
// ---------------------------------------------------------------------------
//
// Provides pure factory functions that create MockLLM-backed executors for
// use in Grid2D "demo mode" — when the user has not yet configured a real
// Anthropic API key.
//
// These executors are drop-in replacements for the real API executor
// (`buildRunExecutor` in Grid2D.tsx) and integrate seamlessly with RunEngine:
//   - They return `MockLLMResponse` objects (`kind: 'result' | 'question'`)
//   - The RunEngine routes them to `completed` or `awaiting` states
//   - Goal and persona are injected so responses feel contextual and natural
//
// Usage:
//   import { createDemoExecutor, createDemoChildExecutorFactory } from '../run-engine/demo-executor'
//
//   // Single-agent run
//   engine.startRun(run.id, createDemoExecutor('Alice', 'Explorer', 'Map the north sector', {
//     goal: 'Map all unexplored areas',
//     persona: 'Curious and bold.',
//   }))
//
//   // Delegation
//   engine.startRunWithChildren(run.id, childDefs, parentExecutorFactory,
//     createDemoChildExecutorFactory(agentDefMap, task))
// ---------------------------------------------------------------------------

import { MockLLM } from './mock-llm'
import type { MockLLMResponse } from './types'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Demo mode timing and probability tuned for a snappy, engaging experience:
 * - Shorter delays than the default (1.5–4 s vs 2–6 s) for responsive feedback.
 * - 25% question probability — realistic but not annoying.
 */
export const DEMO_MODE_DEFAULTS = {
  questionProbability: 0.25,
  minDelayMs: 1_500,
  maxDelayMs: 4_000,
} as const

// ---------------------------------------------------------------------------
// Agent context passed to executor factories
// ---------------------------------------------------------------------------

/**
 * Minimal agent context required to generate realistic demo responses.
 * Mirrors the relevant fields from `AgentDef` and `AgentConfigSnapshot`.
 */
export interface DemoAgentContext {
  /** Agent display name (e.g. "Alice"). */
  name: string
  /** Agent role label (e.g. "Explorer"). */
  role: string
  /** Agent's overarching mission statement — woven into result text. */
  goal?: string
  /** Agent personality description — influences response tone and style. */
  persona?: string
}

// ---------------------------------------------------------------------------
// Single-run executor factory
// ---------------------------------------------------------------------------

/**
 * Create a demo-mode executor for a single agent run.
 *
 * Wraps `MockLLM` with the agent's goal and persona so that the generated
 * response is topic-aware, goal-grounded, and persona-styled. Returns a
 * `RunExecutor`-compatible function ready to pass to `RunEngine.startRun()`.
 *
 * @param agent           Agent context (name, role, goal, persona).
 * @param taskDescription The task being executed (used for topic detection).
 * @param overrides       Optional timing/probability overrides for testing.
 */
export function createDemoExecutor(
  agent: DemoAgentContext,
  taskDescription: string,
  overrides?: {
    questionProbability?: number
    minDelayMs?: number
    maxDelayMs?: number
    /** Deterministic delay for tests — receives (min, max) and returns ms. */
    delayFn?: (min: number, max: number) => number
  },
): () => Promise<MockLLMResponse> {
  const mock = new MockLLM(agent.name, agent.role, taskDescription, {
    goal: agent.goal,
    persona: agent.persona,
    questionProbability: overrides?.questionProbability ?? DEMO_MODE_DEFAULTS.questionProbability,
    minDelayMs: overrides?.minDelayMs ?? DEMO_MODE_DEFAULTS.minDelayMs,
    maxDelayMs: overrides?.maxDelayMs ?? DEMO_MODE_DEFAULTS.maxDelayMs,
    delayFn: overrides?.delayFn,
  })
  return mock.asExecutor()
}

// ---------------------------------------------------------------------------
// Child executor factory for delegation
// ---------------------------------------------------------------------------

/**
 * Create a factory that produces demo-mode executors for child agents in a
 * delegation run.
 *
 * The returned factory is compatible with the `childExecutorFactory` parameter
 * of `RunEngine.startRunWithChildren()`. It looks up each child agent by ID
 * from the provided map and builds a `MockLLM` executor using the child's own
 * goal, persona, and the parent's task description.
 *
 * @param agentContextMap Maps agentId → DemoAgentContext for all child agents.
 * @param taskDescription The parent task — used as the base task for children.
 */
export function createDemoChildExecutorFactory(
  agentContextMap: ReadonlyMap<string, DemoAgentContext>,
  taskDescription: string,
): (childAgentId: string) => () => Promise<MockLLMResponse> {
  return (childAgentId: string) => {
    const context = agentContextMap.get(childAgentId)
    if (!context) {
      // Fallback: return an instant result executor for unknown child agents
      return async () => ({
        kind: 'result' as const,
        text: `Child agent ${childAgentId} completed the delegated task.`,
      })
    }
    return createDemoExecutor(context, taskDescription)
  }
}

// ---------------------------------------------------------------------------
// Parent executor factory for delegation synthesis
// ---------------------------------------------------------------------------

/**
 * Create a demo-mode parent executor for delegation result synthesis.
 *
 * After all children complete, the RunEngine calls the parent executor factory
 * with the completed child runs. This factory returns a `MockLLM` executor for
 * the parent agent that incorporates the child results into a synthesis prompt.
 *
 * @param parentContext   Agent context for the delegating (parent) agent.
 * @param taskDescription The original task given to the parent agent.
 */
export function createDemoParentExecutorFactory(
  parentContext: DemoAgentContext,
  taskDescription: string,
): (completedChildRuns: ReadonlyArray<{ result?: string; error?: string }>) => () => Promise<MockLLMResponse> {
  return (_completedChildRuns) => {
    // Parent synthesises child results — always returns a result (no question
    // at synthesis phase) to keep the delegation flow clean.
    return createDemoExecutor(parentContext, taskDescription, {
      questionProbability: 0, // Synthesis always produces a result
    })
  }
}
