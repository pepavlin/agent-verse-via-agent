// Base Agent interface
export interface Agent {
  id: string
  name: string
  description?: string | null
  model: string
  createdAt: Date
  updatedAt: Date
  userId: string
  // AgentVerse specific fields
  personality?: string | null
  role?: AgentRole | null
  specialization?: string | null
  departmentId?: string | null
}

// Agent roles in AgentVerse
export type AgentRole =
  | 'researcher'
  | 'strategist'
  | 'critic'
  | 'ideator'
  | 'coordinator'
  | 'executor'

// Agent personality traits
export interface AgentPersonality {
  traits: string[]
  communicationStyle: 'formal' | 'casual' | 'technical' | 'creative'
  decisionMaking: 'analytical' | 'intuitive' | 'collaborative' | 'decisive'
}

// Department interface for organizing agents
export interface Department {
  id: string
  name: string
  description: string
  agents: Agent[]
  createdAt: Date
  updatedAt: Date
}

// Message interface for agent communication
export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  createdAt: Date
  agentId: string
  metadata?: MessageMetadata
}

// Message metadata for inter-agent communication
export interface MessageMetadata {
  fromAgent?: string
  toAgent?: string
  taskId?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  type?: 'query' | 'response' | 'notification' | 'task'
}

// Task interface for agent work items
export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: string // agentId
  createdBy?: string // agentId or userId
  departmentId?: string
  dependencies?: string[] // taskIds
  result?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// Task status
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'failed'

// Agent execution status
export interface AgentStatus {
  agentId: string
  status: 'idle' | 'running' | 'paused' | 'error'
  currentTask?: string
  lastActivity?: Date
  metrics?: {
    tasksCompleted: number
    averageResponseTime: number
    successRate: number
  }
}

// Agent with full context
export interface AgentWithMessages extends Agent {
  messages: Message[]
}

// Agent execution result
export interface AgentExecutionResult {
  agentId: string
  taskId?: string
  success: boolean
  result?: any
  error?: string
  executionTime: number
  timestamp: Date
}

export type ClaudeModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-haiku-20240307'

// Department workflow types
export interface DepartmentWorkflow {
  id: string
  departmentId: string
  name: string
  description: string
  steps: WorkflowStep[]
  status: WorkflowStatus
  input?: any
  output?: any
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface WorkflowStep {
  stepNumber: number
  agentRole: AgentRole
  agentId?: string
  description: string
  input?: any
  output?: any
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export type WorkflowStatus =
  | 'pending'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

// User interaction types
export interface UserQuery {
  id: string
  workflowId: string
  agentId: string
  question: string
  context?: any
  answer?: string
  status: 'pending' | 'answered' | 'timeout'
  createdAt: Date
  answeredAt?: Date
  timeoutAt?: Date
}

export interface UserInteractionRequest {
  workflowId: string
  agentId: string
  agentName: string
  question: string
  context?: any
  timeout?: number
}

export interface UserInteractionResponse {
  queryId: string
  answer: string
  timestamp: Date
}

// Agent-to-agent communication types
export interface AgentMessage {
  id: string
  fromAgentId: string
  toAgentId: string
  workflowId?: string
  taskId?: string
  content: string
  metadata?: MessageMetadata
  status: 'sent' | 'delivered' | 'read' | 'failed'
  createdAt: Date
  deliveredAt?: Date
  readAt?: Date
}

export interface MessageQueue {
  agentId: string
  messages: AgentMessage[]
  lastProcessedAt?: Date
}

// Department execution types
export interface DepartmentExecutionRequest {
  departmentId: string
  input: string
  context?: any
  userId: string
  options?: DepartmentExecutionOptions
}

export interface DepartmentExecutionOptions {
  enableUserInteraction?: boolean
  timeout?: number
  parallelExecution?: boolean
  customWorkflow?: WorkflowStep[]
}

export interface DepartmentExecutionResult {
  workflowId: string
  departmentId: string
  success: boolean
  result?: any
  error?: string
  steps: WorkflowStep[]
  userQueries?: UserQuery[]
  executionTime: number
  timestamp: Date
}
