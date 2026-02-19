import {
  Agent,
  Message,
  Task,
  AgentExecutionResult,
  AgentStatus,
  AgentMessage,
  UserQuery,
  UserInteractionRequest,
  CommunicationEvent,
} from '@/types'
import { BaseAgent } from '@/app/agents/BaseAgent'
import {
  ResearcherAgent,
  StrategistAgent,
  CriticAgent,
  IdeatorAgent,
} from '@/app/agents'

/**
 * AgentOrchestrator - Manages communication and coordination between multiple agents
 * Implements the core AgentVerse multi-agent collaboration patterns
 */
export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map()
  private messageQueue: Message[] = []
  private taskQueue: Task[] = []
  private agentMessageQueues: Map<string, AgentMessage[]> = new Map()
  private userQueryCallback?: (query: UserInteractionRequest) => Promise<string>
  private pendingUserQueries: Map<string, UserQuery> = new Map()
  private communicationEvents: CommunicationEvent[] = []
  private maxEventsToKeep = 1000 // Keep last 1000 events

  constructor() {
    // Initialize empty orchestrator
  }

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(agent: Agent): void {
    const agentInstance = this.createAgentInstance(agent)
    this.agents.set(agent.id, agentInstance)
  }

  /**
   * Unregister an agent from the orchestrator
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId)
  }

  /**
   * Create appropriate agent instance based on role
   */
  private createAgentInstance(agent: Agent): BaseAgent {
    switch (agent.role) {
      case 'researcher':
        return new ResearcherAgent(agent)
      case 'strategist':
        return new StrategistAgent(agent)
      case 'critic':
        return new CriticAgent(agent)
      case 'ideator':
        return new IdeatorAgent(agent)
      default:
        return new ResearcherAgent(agent)
    }
  }

  /**
   * Execute a single agent with input
   */
  async executeAgent(
    agentId: string,
    input: string,
    context?: Record<string, unknown>
  ): Promise<AgentExecutionResult> {
    const agent = this.agents.get(agentId)

    if (!agent) {
      throw new Error(`Agent ${agentId} not found in orchestrator`)
    }

    // Log execution event
    this.logCommunicationEvent({
      type: 'execution',
      fromAgentId: 'system',
      fromAgentName: 'System',
      toAgentId: agentId,
      toAgentName: agent.getInfo().name,
      content: `Executing agent with input: ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}`,
      metadata: context as Record<string, unknown>,
    })

    return agent.execute(input, context)
  }

  /**
   * Execute multiple agents in sequence (pipeline pattern)
   * Each agent processes the output of the previous agent
   */
  async executePipeline(
    agentIds: string[],
    initialInput: string,
    context?: Record<string, unknown>
  ): Promise<AgentExecutionResult[]> {
    const results: AgentExecutionResult[] = []
    let currentInput = initialInput
    let currentContext = context || {}

    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId)

      if (!agent) {
        throw new Error(`Agent ${agentId} not found in pipeline`)
      }

      const result = await agent.execute(currentInput, currentContext)
      results.push(result)

      // Pass successful output to next agent
      if (result.success && result.result) {
        currentInput = String(result.result)
        // Accumulate context
        currentContext = {
          ...currentContext,
          previousResults: [
            ...((currentContext.previousResults as unknown[]) || []),
            result,
          ],
        }
      } else {
        // Stop pipeline on failure
        break
      }
    }

    return results
  }

  /**
   * Execute multiple agents in parallel
   * All agents receive the same input simultaneously
   */
  async executeParallel(
    agentIds: string[],
    input: string,
    context?: Record<string, unknown>
  ): Promise<AgentExecutionResult[]> {
    const promises = agentIds.map((agentId) => {
      const agent = this.agents.get(agentId)

      if (!agent) {
        throw new Error(`Agent ${agentId} not found for parallel execution`)
      }

      return agent.execute(input, context)
    })

    return Promise.all(promises)
  }

  /**
   * Execute a collaborative multi-agent workflow
   * Implements the AgentVerse collaboration pattern:
   * 1. Researcher gathers information
   * 2. Ideator generates ideas
   * 3. Strategist creates plan
   * 4. Critic evaluates and suggests improvements
   */
  async executeCollaborativeWorkflow(
    agents: {
      researcher?: string
      ideator?: string
      strategist?: string
      critic?: string
    },
    task: string,
    context?: Record<string, unknown>
  ): Promise<{
    research?: AgentExecutionResult
    ideas?: AgentExecutionResult
    strategy?: AgentExecutionResult
    critique?: AgentExecutionResult
    finalOutput: string
  }> {
    const workflowId = `workflow-${Date.now()}-${Math.random()}`
    
    // Log workflow start
    this.logCommunicationEvent({
      type: 'workflow_start',
      fromAgentId: 'system',
      fromAgentName: 'System',
      content: `Starting collaborative workflow for task: ${task.substring(0, 100)}${task.length > 100 ? '...' : ''}`,
      workflowId,
    })

    const workflow: {
      research?: AgentExecutionResult
      ideas?: AgentExecutionResult
      strategy?: AgentExecutionResult
      critique?: AgentExecutionResult
      finalOutput?: string
    } = {}

    // Phase 1: Research (if researcher available)
    if (agents.researcher) {
      const researchResult = await this.executeAgent(
        agents.researcher,
        `Research the following task: ${task}`,
        context
      )
      workflow.research = researchResult
    }

    // Phase 2: Ideation (if ideator available)
    if (agents.ideator) {
      const ideationInput = workflow.research?.result
        ? `Based on this research:\n${workflow.research.result}\n\nGenerate creative ideas for: ${task}`
        : `Generate creative ideas for: ${task}`

      const ideationResult = await this.executeAgent(
        agents.ideator,
        ideationInput,
        { ...context, research: workflow.research }
      )
      workflow.ideas = ideationResult
    }

    // Phase 3: Strategy (if strategist available)
    if (agents.strategist) {
      const strategyInput = workflow.ideas?.result
        ? `Based on these ideas:\n${workflow.ideas.result}\n\nCreate a strategic plan for: ${task}`
        : `Create a strategic plan for: ${task}`

      const strategyResult = await this.executeAgent(
        agents.strategist,
        strategyInput,
        { ...context, research: workflow.research, ideas: workflow.ideas }
      )
      workflow.strategy = strategyResult
    }

    // Phase 4: Critique (if critic available)
    if (agents.critic && workflow.strategy?.result) {
      const critiqueInput = `Evaluate this strategic plan:\n${workflow.strategy.result}`

      const critiqueResult = await this.executeAgent(
        agents.critic,
        critiqueInput,
        {
          ...context,
          research: workflow.research,
          ideas: workflow.ideas,
          strategy: workflow.strategy,
        }
      )
      workflow.critique = critiqueResult
    }

    // Compile final output
    const finalOutput = this.compileWorkflowOutput(workflow)

    // Log workflow end
    this.logCommunicationEvent({
      type: 'workflow_end',
      fromAgentId: 'system',
      fromAgentName: 'System',
      content: `Completed collaborative workflow with ${Object.keys(workflow).filter(k => k !== 'finalOutput').length} phases`,
      workflowId,
    })

    return { ...workflow, finalOutput }
  }

  /**
   * Compile workflow results into a cohesive output
   */
  private compileWorkflowOutput(workflow: {
    research?: AgentExecutionResult
    ideas?: AgentExecutionResult
    strategy?: AgentExecutionResult
    critique?: AgentExecutionResult
  }): string {
    const sections: string[] = []

    if (workflow.research?.result) {
      sections.push(`## Research Findings\n${workflow.research.result}`)
    }

    if (workflow.ideas?.result) {
      sections.push(`## Creative Ideas\n${workflow.ideas.result}`)
    }

    if (workflow.strategy?.result) {
      sections.push(`## Strategic Plan\n${workflow.strategy.result}`)
    }

    if (workflow.critique?.result) {
      sections.push(`## Critical Evaluation\n${workflow.critique.result}`)
    }

    return sections.join('\n\n---\n\n')
  }

  /**
   * Route a message to a specific agent
   */
  async routeMessage(message: Message): Promise<AgentExecutionResult | null> {
    const targetAgentId = message.metadata?.toAgent

    if (!targetAgentId) {
      throw new Error('Message must have a target agent (metadata.toAgent)')
    }

    const agent = this.agents.get(targetAgentId)

    if (!agent) {
      throw new Error(`Target agent ${targetAgentId} not found`)
    }

    return agent.execute(message.content, { sourceMessage: message })
  }

  /**
   * Get status of all registered agents
   */
  getAllAgentStatuses() {
    const statuses: AgentStatus[] = []

    this.agents.forEach((agent) => {
      statuses.push(agent.getStatus())
    })

    return statuses
  }

  /**
   * Get information about all registered agents
   */
  getRegisteredAgents() {
    const agentInfo: Record<string, unknown>[] = []

    this.agents.forEach((agent) => {
      agentInfo.push(agent.getInfo())
    })

    return agentInfo
  }

  /**
   * Clear all registered agents
   */
  clear(): void {
    this.agents.clear()
    this.messageQueue = []
    this.taskQueue = []
    this.agentMessageQueues.clear()
    this.pendingUserQueries.clear()
    this.communicationEvents = []
  }

  /**
   * Log a communication event
   */
  private logCommunicationEvent(event: Omit<CommunicationEvent, 'id' | 'timestamp'>): void {
    const fullEvent: CommunicationEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    
    this.communicationEvents.push(fullEvent)
    
    // Keep only the most recent events to prevent memory issues
    if (this.communicationEvents.length > this.maxEventsToKeep) {
      this.communicationEvents = this.communicationEvents.slice(-this.maxEventsToKeep)
    }
  }

  /**
   * Get all communication events
   */
  getCommunicationEvents(limit?: number): CommunicationEvent[] {
    if (limit) {
      return this.communicationEvents.slice(-limit)
    }
    return [...this.communicationEvents]
  }

  /**
   * Get communication events filtered by agent
   */
  getCommunicationEventsByAgent(agentId: string, limit?: number): CommunicationEvent[] {
    const filtered = this.communicationEvents.filter(
      event => event.fromAgentId === agentId || event.toAgentId === agentId
    )
    
    if (limit) {
      return filtered.slice(-limit)
    }
    return filtered
  }

  /**
   * Clear communication events history
   */
  clearCommunicationEvents(): void {
    this.communicationEvents = []
  }

  /**
   * Set callback for user interactions
   */
  setUserQueryCallback(
    callback: (query: UserInteractionRequest) => Promise<string>
  ): void {
    this.userQueryCallback = callback
  }

  /**
   * Request user input during workflow execution
   */
  async requestUserInput(
    workflowId: string,
    agentId: string,
    question: string,
    context?: Record<string, unknown>
  ): Promise<string> {
    if (!this.userQueryCallback) {
      throw new Error('User query callback not set. Cannot request user input.')
    }

    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    const agentInfo = agent.getInfo()

    const query: UserInteractionRequest = {
      workflowId,
      agentId,
      agentName: agentInfo.name,
      question,
      context,
      timeout: 300000, // 5 minutes default
    }

    // Store pending query
    const queryId = `query-${Date.now()}-${Math.random()}`
    const userQuery: UserQuery = {
      id: queryId,
      workflowId,
      agentId,
      question,
      context,
      status: 'pending',
      createdAt: new Date(),
      timeoutAt: new Date(Date.now() + (query.timeout || 300000)),
    }
    this.pendingUserQueries.set(queryId, userQuery)

    try {
      const answer = await this.userQueryCallback(query)
      userQuery.answer = answer
      userQuery.status = 'answered'
      userQuery.answeredAt = new Date()
      return answer
    } catch (error) {
      userQuery.status = 'timeout'
      throw error
    } finally {
      this.pendingUserQueries.delete(queryId)
    }
  }

  /**
   * Send message from one agent to another
   */
  async sendAgentMessage(
    fromAgentId: string,
    toAgentId: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<AgentMessage> {
    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      fromAgentId,
      toAgentId,
      content,
      metadata,
      status: 'sent',
      createdAt: new Date(),
    }

    // Add to recipient's message queue
    const queue = this.agentMessageQueues.get(toAgentId) || []
    queue.push(message)
    this.agentMessageQueues.set(toAgentId, queue)

    message.status = 'delivered'
    message.deliveredAt = new Date()

    // Log communication event
    const fromAgent = this.agents.get(fromAgentId)
    const toAgent = this.agents.get(toAgentId)
    
    this.logCommunicationEvent({
      type: 'message',
      fromAgentId,
      fromAgentName: fromAgent?.getInfo().name || fromAgentId,
      toAgentId,
      toAgentName: toAgent?.getInfo().name || toAgentId,
      content,
      metadata,
      workflowId: message.workflowId,
      taskId: message.taskId,
    })

    return message
  }

  /**
   * Get pending messages for an agent
   */
  getAgentMessages(agentId: string): AgentMessage[] {
    return this.agentMessageQueues.get(agentId) || []
  }

  /**
   * Process and clear messages for an agent
   */
  processAgentMessages(agentId: string): AgentMessage[] {
    const messages = this.agentMessageQueues.get(agentId) || []
    this.agentMessageQueues.set(agentId, [])

    // Mark messages as read
    messages.forEach((msg) => {
      msg.status = 'read'
      msg.readAt = new Date()
    })

    return messages
  }

  /**
   * Get all pending user queries
   */
  getPendingUserQueries(): UserQuery[] {
    return Array.from(this.pendingUserQueries.values())
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcastMessage(
    fromAgentId: string,
    targetAgentIds: string[],
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = []

    // Log broadcast event
    const fromAgent = this.agents.get(fromAgentId)
    this.logCommunicationEvent({
      type: 'broadcast',
      fromAgentId,
      fromAgentName: fromAgent?.getInfo().name,
      content: `Broadcasting to ${targetAgentIds.length} agents: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      metadata,
    })

    for (const toAgentId of targetAgentIds) {
      const message = await this.sendAgentMessage(
        fromAgentId,
        toAgentId,
        content,
        metadata
      )
      messages.push(message)
    }

    return messages
  }

  /**
   * Get message queue status
   */
  getMessageQueueStatus() {
    const status: Record<string, unknown> = {}

    this.agentMessageQueues.forEach((messages, agentId) => {
      const agent = this.agents.get(agentId)
      status[agentId] = {
        agentName: agent?.getInfo().name || 'Unknown',
        pendingMessages: messages.length,
        lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
      }
    })

    return status
  }
}

// Export singleton instance for use across the application
// Using globalThis to ensure the same instance is used across HMR reloads
const globalForOrchestrator = globalThis as unknown as {
  orchestrator: AgentOrchestrator | undefined
}

export const orchestrator = globalForOrchestrator.orchestrator ?? new AgentOrchestrator()

if (process.env.NODE_ENV !== 'production') {
  globalForOrchestrator.orchestrator = orchestrator
}
