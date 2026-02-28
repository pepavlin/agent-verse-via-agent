// ---------------------------------------------------------------------------
// MockLLMService — stateful service for generating realistic fake LLM responses
// ---------------------------------------------------------------------------
//
// MockLLMService is a higher-level abstraction over the pure generation
// functions in realistic-results.ts. Unlike MockLLM (which focuses on timing
// and probability mechanics for RunEngine integration), MockLLMService is
// concerned with the *content* of generated responses.
//
// Key responsibilities:
//   1. Encapsulate agent configuration (name, role, goal, persona) in one place.
//   2. Cache persona-style detection so it is computed only once per agent.
//   3. Apply topic detection + style-bucketed template selection so that the
//      agent's personality actually influences the *tone* of generated text.
//   4. Expose a clean, testable API independent of timing/probability logic.
//
// Usage:
//   const service = new MockLLMService({ agentName: 'Alice', agentRole: 'Explorer',
//     goal: 'Map all unexplored areas', persona: 'Curious and bold.' })
//
//   // Generate a task result (topic auto-detected from the task text)
//   const result = service.generateResult('Map the north sector')
//
//   // Generate a clarifying question
//   const question = service.generateQuestion('Map the north sector')
//
//   // Inspect detected persona style
//   console.log(service.personaStyle)  // → 'bold'
//
//   // Inspect detected topic for a task description
//   console.log(service.detectTopicFor('Map the north sector'))  // → 'exploration'
//
// Integration with MockLLM:
//   MockLLMService complements MockLLM. Use MockLLMService when you need
//   content-focused generation without timing delays or probability control.
//   Use MockLLM (which internally calls the same generation functions) when
//   you need a drop-in RunEngine executor with configurable delays.
// ---------------------------------------------------------------------------

import {
  detectTopic,
  detectPersonaStyle,
  generateRealisticResult,
  generateRealisticQuestion,
} from './realistic-results'
import { generateResult, generateQuestion } from './results'
import type { TopicCategory, PersonaStyle } from './realistic-results'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for a MockLLMService instance.
 *
 * All fields mirror the agent definition so that a service can be constructed
 * directly from an `AgentDef` or `AgentConfigSnapshot`.
 */
export interface MockLLMServiceConfig {
  /** Agent display name (e.g. "Alice"). */
  agentName: string
  /** Agent role label (e.g. "Explorer"). */
  agentRole: string
  /**
   * Agent's overarching mission statement.
   * When provided the goal is woven into generated result text and the
   * service switches to realistic (topic-aware) generation automatically.
   */
  goal?: string
  /**
   * Agent's personality description.
   * Used to detect a `PersonaStyle` which selects style-appropriate templates.
   * When provided the service uses realistic generation automatically.
   */
  persona?: string
  /**
   * Explicitly control whether to use topic-aware realistic generation
   * (from realistic-results.ts) or simpler generic templates (results.ts).
   *
   * - true  → always use realistic generation
   * - false → always use generic templates
   * - undefined (default) → realistic when `goal` or `persona` is provided
   */
  useRealisticGeneration?: boolean
}

// ---------------------------------------------------------------------------
// MockLLMService
// ---------------------------------------------------------------------------

/**
 * Stateful service that generates contextual fake LLM responses for an agent.
 *
 * Persona style is detected once at construction and cached. Every subsequent
 * call to `generateResult()` or `generateQuestion()` uses this cached style
 * to select from the persona-appropriate template bucket.
 *
 * This means a `bold` (Alice) agent consistently gets action-first responses,
 * a `methodical` (Bob) agent gets detailed structured responses, a `swift`
 * (Carol) agent gets brief responses, and a `steadfast` (Dave) agent gets
 * formal duty-conscious responses.
 */
export class MockLLMService {
  private readonly _config: MockLLMServiceConfig
  private readonly _style: PersonaStyle
  private readonly _useRealistic: boolean

  constructor(config: MockLLMServiceConfig) {
    this._config = config
    this._style = detectPersonaStyle(config.persona)

    if (config.useRealisticGeneration !== undefined) {
      this._useRealistic = config.useRealisticGeneration
    } else {
      this._useRealistic = !!(config.goal || config.persona)
    }
  }

  // ---------------------------------------------------------------------------
  // Public generation API
  // ---------------------------------------------------------------------------

  /**
   * Generate a realistic result string for a completed task.
   *
   * When realistic generation is active (goal or persona provided), the topic
   * is auto-detected from `taskDescription` via keyword heuristics and the
   * persona style selects from a style-appropriate template bucket.
   *
   * When generic generation is used (no goal/persona), a random template from
   * results.ts is returned.
   *
   * @param taskDescription  The task that was executed (used for topic detection)
   * @param pickIndex        Optional deterministic template index (for testing)
   */
  generateResult(taskDescription: string, pickIndex?: number): string {
    if (this._useRealistic) {
      return generateRealisticResult(
        this._config.agentName,
        this._config.agentRole,
        taskDescription,
        this._config.goal,
        this._config.persona,
        pickIndex,
      )
    }
    return generateResult(
      this._config.agentName,
      this._config.agentRole,
      taskDescription,
      pickIndex,
    )
  }

  /**
   * Generate a realistic clarifying question for an awaiting run.
   *
   * When realistic generation is active, the question is domain-specific and
   * persona-styled. When generic generation is used, a template from
   * results.ts is returned.
   *
   * @param taskDescription  The task that triggered the question
   * @param pickIndex        Optional deterministic template index (for testing)
   */
  generateQuestion(taskDescription: string, pickIndex?: number): string {
    if (this._useRealistic) {
      return generateRealisticQuestion(
        this._config.agentName,
        this._config.agentRole,
        taskDescription,
        this._config.goal,
        this._config.persona,
        pickIndex,
      )
    }
    return generateQuestion(
      this._config.agentName,
      this._config.agentRole,
      taskDescription,
      pickIndex,
    )
  }

  // ---------------------------------------------------------------------------
  // Inspection / diagnostic API
  // ---------------------------------------------------------------------------

  /**
   * Detect the topic category for a given task description.
   *
   * Delegates to the pure `detectTopic()` function from realistic-results.ts.
   * Exposed here so callers can introspect the topic without calling a generation
   * function, which is useful for tests and diagnostics.
   */
  detectTopicFor(taskDescription: string): TopicCategory {
    return detectTopic(taskDescription)
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** The persona style detected from the agent's persona description. */
  get personaStyle(): PersonaStyle {
    return this._style
  }

  /** Whether this service uses realistic (topic-aware) generation. */
  get isRealistic(): boolean {
    return this._useRealistic
  }

  /** The agent display name. */
  get agentName(): string {
    return this._config.agentName
  }

  /** The agent role label. */
  get agentRole(): string {
    return this._config.agentRole
  }

  /** The agent's goal/mission statement (undefined if not provided). */
  get goal(): string | undefined {
    return this._config.goal
  }

  /** The agent's persona description (undefined if not provided). */
  get persona(): string | undefined {
    return this._config.persona
  }
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Convenience factory for creating a `MockLLMService` from agent configuration.
 *
 * Equivalent to `new MockLLMService(config)` but reads more naturally when
 * constructing from an `AgentDef` or `AgentConfigSnapshot`:
 *
 * @example
 * const service = createMockLLMService({
 *   agentName: agent.name,
 *   agentRole: agent.role,
 *   goal: agent.goal,
 *   persona: agent.persona,
 * })
 */
export function createMockLLMService(config: MockLLMServiceConfig): MockLLMService {
  return new MockLLMService(config)
}
