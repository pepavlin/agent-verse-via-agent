// ---------------------------------------------------------------------------
// Public API for the Run engine
// ---------------------------------------------------------------------------

export type { Run, RunStatus, RunEventType, RunEventHandler, RunEngineOptions, MockLLMResponse, AgentConfigSnapshot } from './types'
export type { AgentMeta, RunExecutor, ChildAgentDef, ParentExecutorFactory } from './engine'
export { RunEngine } from './engine'
export {
  generateResult,
  RESULT_TEMPLATE_COUNT,
  generateQuestion,
  QUESTION_TEMPLATE_COUNT,
  composeDelegatedResults,
} from './results'
export type { ChildRunOutcome } from './results'
export type { MockLLMOptions } from './mock-llm'
export { MockLLM } from './mock-llm'
export type { MockLLMServiceConfig } from './mock-llm-service'
export { MockLLMService, createMockLLMService } from './mock-llm-service'
