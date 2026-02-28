// ---------------------------------------------------------------------------
// MockLLM — simulated LLM executor for the RunEngine
// ---------------------------------------------------------------------------
//
// MockLLM acts as a drop-in executor for RunEngine.startRun(). After a
// configurable delay it resolves to either a result or a clarifying question,
// mirroring the two possible outcomes of a real LLM call.
//
// Usage (basic — no goal/persona):
//   const mock = new MockLLM('Alice', 'Explorer', 'Map the north sector')
//   engine.startRun(run.id, mock.asExecutor())
//
// Usage (realistic — with goal and persona):
//   const mock = new MockLLM('Alice', 'Explorer', 'Map the north sector', {
//     goal: 'Map all unexplored areas of the grid',
//     persona: 'Curious and bold. Always the first to venture into unknown territory.',
//   })
//   engine.startRun(run.id, mock.asExecutor())
//
// The returned executor produces a MockLLMResponse that the RunEngine routes:
//   { kind: 'result', text }   → run transitions to 'completed'
//   { kind: 'question', text } → run transitions to 'awaiting'
//
// When `goal` and/or `persona` are supplied (or `useRealisticGeneration` is
// explicitly set to true), the service uses topic-aware, persona-driven
// templates from realistic-results.ts instead of the generic fallbacks from
// results.ts. This produces responses that feel natural for the type of task
// the agent is working on and are grounded in the agent's mission statement.
// ---------------------------------------------------------------------------

import type { MockLLMResponse } from './types'
import { generateResult, generateQuestion } from './results'
import { generateRealisticResult, generateRealisticQuestion } from './realistic-results'

/** Construction options for MockLLM. */
export interface MockLLMOptions {
  /**
   * Probability [0, 1] that the simulated response is a clarifying question
   * rather than a completion result.
   * Default: 0.3 (30 % chance of question, 70 % chance of result).
   */
  questionProbability?: number
  /** Minimum simulated processing delay in milliseconds. Default: 2000. */
  minDelayMs?: number
  /** Maximum simulated processing delay in milliseconds. Default: 6000. */
  maxDelayMs?: number
  /**
   * Custom delay calculator — receives min and max and returns the actual
   * delay in ms. Defaults to a uniform random value in [minDelayMs, maxDelayMs].
   * Override in tests to control timing deterministically.
   */
  delayFn?: (minMs: number, maxMs: number) => number
  /**
   * Agent's overarching goal / mission statement.
   * When provided, realistic generation is enabled by default and the goal
   * is woven into the generated result text.
   */
  goal?: string
  /**
   * Agent's personality / persona description.
   * When provided, realistic generation is enabled by default and the
   * persona influences the style of generated responses (bold, methodical,
   * swift, steadfast, or neutral).
   */
  persona?: string
  /**
   * Explicitly control whether to use topic-aware realistic generation
   * (from realistic-results.ts) or the simpler generic templates (results.ts).
   *
   * - true  → always use realistic generation
   * - false → always use generic templates
   * - undefined (default) → use realistic generation when `goal` or `persona`
   *   is provided, otherwise use generic templates
   */
  useRealisticGeneration?: boolean
}

/** Default delay: uniform distribution in [minMs, maxMs]. */
function defaultDelayFn(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs)
}

// ---------------------------------------------------------------------------
// MockLLM
// ---------------------------------------------------------------------------

/**
 * Simulated LLM that produces a `MockLLMResponse` after a configurable delay.
 *
 * - With probability `questionProbability` (default 0.3) it returns a
 *   clarifying question (`kind: 'question'`).
 * - Otherwise it returns a completion result (`kind: 'result'`).
 *
 * When `goal` or `persona` are supplied in the options, MockLLM switches to
 * realistic generation mode: responses are topic-aware (detected from the
 * task description via keyword heuristics), grounded in the agent's mission
 * (`goal`), and styled to match the agent's personality (`persona`).
 *
 * Without `goal`/`persona`, behaviour is identical to the original
 * implementation — generic templates from results.ts are used — so all
 * existing code that creates `new MockLLM(name, role, task)` continues to
 * work unchanged.
 *
 * The key difference from the built-in mock is that MockLLM is a first-class
 * executor: it can be composed, configured, and tested independently of the
 * RunEngine, and it exposes `asExecutor()` to integrate with `startRun()`.
 */
export class MockLLM {
  private readonly _agentName: string
  private readonly _agentRole: string
  private readonly _taskDescription: string
  private readonly _questionProbability: number
  private readonly _minDelayMs: number
  private readonly _maxDelayMs: number
  private readonly _delayFn: (minMs: number, maxMs: number) => number
  private readonly _goal: string | undefined
  private readonly _persona: string | undefined
  private readonly _useRealistic: boolean

  constructor(
    agentName: string,
    agentRole: string,
    taskDescription: string,
    options: MockLLMOptions = {},
  ) {
    this._agentName = agentName
    this._agentRole = agentRole
    this._taskDescription = taskDescription
    this._questionProbability = options.questionProbability ?? 0.3
    this._minDelayMs = options.minDelayMs ?? 2_000
    this._maxDelayMs = options.maxDelayMs ?? 6_000
    this._delayFn = options.delayFn ?? defaultDelayFn
    this._goal = options.goal
    this._persona = options.persona

    // Use realistic generation when explicitly enabled, or when goal/persona
    // are supplied (and not explicitly disabled).
    if (options.useRealisticGeneration !== undefined) {
      this._useRealistic = options.useRealisticGeneration
    } else {
      this._useRealistic = !!(options.goal || options.persona)
    }
  }

  /**
   * Simulate LLM processing and resolve with a result or a question.
   *
   * The promise resolves (never rejects) after the configured delay.
   * Use `asExecutor()` to pass this directly to `RunEngine.startRun()`.
   *
   * When realistic generation is active, the result/question text is
   * contextualised by the agent's goal, persona, and the inferred topic
   * of the task description.
   */
  run(): Promise<MockLLMResponse> {
    const delayMs = this._delayFn(this._minDelayMs, this._maxDelayMs)
    return new Promise<MockLLMResponse>((resolve) => {
      setTimeout(() => {
        if (Math.random() < this._questionProbability) {
          const text = this._useRealistic
            ? generateRealisticQuestion(
                this._agentName,
                this._agentRole,
                this._taskDescription,
                this._goal,
                this._persona,
              )
            : generateQuestion(this._agentName, this._agentRole, this._taskDescription)
          resolve({ kind: 'question', text })
        } else {
          const text = this._useRealistic
            ? generateRealisticResult(
                this._agentName,
                this._agentRole,
                this._taskDescription,
                this._goal,
                this._persona,
              )
            : generateResult(this._agentName, this._agentRole, this._taskDescription)
          resolve({ kind: 'result', text })
        }
      }, delayMs)
    })
  }

  /**
   * Return a `RunExecutor`-compatible function wrapping `this.run()`.
   *
   * @example
   * const mock = new MockLLM(agentName, agentRole, task, { goal, persona })
   * engine.startRun(run.id, mock.asExecutor())
   */
  asExecutor(): () => Promise<MockLLMResponse> {
    return () => this.run()
  }

  // ---------------------------------------------------------------------------
  // Accessors (for testing and inspection)
  // ---------------------------------------------------------------------------

  /** Whether this instance is using realistic generation mode. */
  get isRealistic(): boolean {
    return this._useRealistic
  }

  /** The agent goal passed at construction time (undefined if not provided). */
  get goal(): string | undefined {
    return this._goal
  }

  /** The agent persona passed at construction time (undefined if not provided). */
  get persona(): string | undefined {
    return this._persona
  }
}
