import Anthropic from "@anthropic-ai/sdk"
import { Agent, Message, AgentRole, AgentExecutionResult, AgentStatus } from "@/types"
import { MetricsService } from "@/lib/metrics-service"

/**
 * BaseAgent class - Foundation for all AgentVerse agents
 * Provides core functionality for agent execution, communication, and task management
 */
export abstract class BaseAgent {
  protected id: string
  protected name: string
  protected role: AgentRole
  protected model: string
  protected personality: string
  protected specialization: string
  protected anthropic: Anthropic
  protected systemPrompt: string
  protected status: AgentStatus['status'] = 'idle'
  protected userId: string
  protected lastTokenUsage?: { input: number; output: number }

  constructor(agent: Agent) {
    this.id = agent.id
    this.name = agent.name
    this.role = agent.role || 'executor'
    this.model = agent.model
    this.personality = agent.personality || this.getDefaultPersonality()
    this.specialization = agent.specialization || ''
    this.systemPrompt = this.buildSystemPrompt()
    this.userId = agent.userId

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required")
    }
    this.anthropic = new Anthropic({ apiKey })
  }

  /**
   * Get default personality for this agent type
   */
  protected abstract getDefaultPersonality(): string

  /**
   * Build system prompt based on agent configuration
   */
  protected buildSystemPrompt(): string {
    return `You are ${this.name}, a ${this.role} agent in the AgentVerse system.

Personality: ${this.personality}
Specialization: ${this.specialization || 'General purpose'}

Your role is to ${this.getRoleDescription()}.

When responding:
- Stay in character according to your personality
- Focus on your specialization area
- Collaborate effectively with other agents
- Provide clear, actionable insights
- Ask for clarification when needed`
  }

  /**
   * Get description of this agent's role
   */
  protected abstract getRoleDescription(): string

  /**
   * Execute a task with the given input
   */
  async execute(input: string, context?: Record<string, unknown>): Promise<AgentExecutionResult> {
    const startTime = Date.now()
    const createdAt = new Date()
    this.status = 'running'

    try {
      const result = await this.processTask(input, context)
      const executionTime = Date.now() - startTime
      const completedAt = new Date()

      this.status = 'idle'

      // Record metrics
      await MetricsService.recordMetric({
        agentId: this.id,
        agentName: this.name,
        agentRole: this.role,
        userId: this.userId,
        operationType: (context?.operationType as any) || 'execute',
        taskId: context?.taskId as string,
        workflowId: context?.workflowId as string,
        success: true,
        executionTime,
        inputTokens: this.lastTokenUsage?.input,
        outputTokens: this.lastTokenUsage?.output,
        model: this.model,
        createdAt,
        completedAt,
      })

      return {
        agentId: this.id,
        success: true,
        result,
        executionTime,
        timestamp: completedAt
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const completedAt = new Date()
      this.status = 'error'

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorType = error instanceof Error ? error.constructor.name : 'UnknownError'

      // Record error metrics
      await MetricsService.recordMetric({
        agentId: this.id,
        agentName: this.name,
        agentRole: this.role,
        userId: this.userId,
        operationType: (context?.operationType as any) || 'execute',
        taskId: context?.taskId as string,
        workflowId: context?.workflowId as string,
        success: false,
        executionTime,
        inputTokens: this.lastTokenUsage?.input,
        outputTokens: this.lastTokenUsage?.output,
        model: this.model,
        errorType,
        errorMessage,
        createdAt,
        completedAt,
      })

      return {
        agentId: this.id,
        success: false,
        error: errorMessage,
        executionTime,
        timestamp: completedAt
      }
    }
  }

  /**
   * Process a task - override in specialized agents for custom behavior
   */
  protected async processTask(input: string, context?: Record<string, unknown>): Promise<string> {
    const messages: Anthropic.MessageParam[] = []

    // Add context if provided
    if (context?.messages && Array.isArray(context.messages)) {
      for (const msg of context.messages) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      }
    }

    // Add current input
    messages.push({
      role: 'user',
      content: input
    })

    // Call Claude API
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: this.systemPrompt,
      messages
    })

    // Store token usage for metrics
    this.lastTokenUsage = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    }

    // Extract text from response
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n')

    return textContent
  }

  /**
   * Get current status of the agent
   */
  getStatus(): AgentStatus {
    return {
      agentId: this.id,
      status: this.status,
      lastActivity: new Date()
    }
  }

  /**
   * Prepare a message for another agent
   */
  prepareMessage(content: string, toAgent: string, taskId?: string): Message {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      role: 'assistant',
      agentId: this.id,
      createdAt: new Date(),
      metadata: {
        fromAgent: this.id,
        toAgent,
        taskId,
        type: 'query'
      }
    }
  }

  /**
   * Validate input before processing
   */
  protected validateInput(input: string): boolean {
    return Boolean(input && input.trim().length > 0)
  }

  /**
   * Format output for consistency
   */
  protected formatOutput(content: string): string {
    return content
  }

  /**
   * Get agent information
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      specialization: this.specialization,
      personality: this.personality
    }
  }
}
