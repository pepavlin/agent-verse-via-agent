export interface Agent {
  id: string
  name: string
  description: string | null
  model: string
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
  agentId: string
}

export interface AgentWithMessages extends Agent {
  messages: Message[]
}

export type ClaudeModel =
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-haiku-20240307'
