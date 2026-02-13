import { Agent, Message, Task, AgentExecutionResult, Department } from "@/types"
import { BaseAgent } from "@/app/agents/BaseAgent"
import { ResearcherAgent, StrategistAgent, CriticAgent, IdeatorAgent } from "@/app/agents"

/**
 * AgentOrchestrator - Manages communication and coordination between multiple agents
 * Implements the core AgentVerse multi-agent collaboration patterns
 */
export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map()
  private messageQueue: Message[] = []
  private taskQueue: Task[] = []

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
    context?: any
  ): Promise<AgentExecutionResult> {
    const agent = this.agents.get(agentId)

    if (!agent) {
      throw new Error(`Agent ${agentId} not found in orchestrator`)
    }

    return agent.execute(input, context)
  }

  /**
   * Execute multiple agents in sequence (pipeline pattern)
   * Each agent processes the output of the previous agent
   */
  async executePipeline(
    agentIds: string[],
    initialInput: string,
    context?: any
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
        currentInput = result.result
        // Accumulate context
        currentContext = {
          ...currentContext,
          previousResults: [...(currentContext.previousResults || []), result]
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
    context?: any
  ): Promise<AgentExecutionResult[]> {
    const promises = agentIds.map(agentId => {
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
    context?: any
  ): Promise<{
    research?: AgentExecutionResult
    ideas?: AgentExecutionResult
    strategy?: AgentExecutionResult
    critique?: AgentExecutionResult
    finalOutput: string
  }> {
    const workflow: any = {}

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
          strategy: workflow.strategy
        }
      )
      workflow.critique = critiqueResult
    }

    // Compile final output
    workflow.finalOutput = this.compileWorkflowOutput(workflow)

    return workflow
  }

  /**
   * Compile workflow results into a cohesive output
   */
  private compileWorkflowOutput(workflow: any): string {
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
      throw new Error("Message must have a target agent (metadata.toAgent)")
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
    const statuses: any[] = []

    this.agents.forEach((agent, agentId) => {
      statuses.push(agent.getStatus())
    })

    return statuses
  }

  /**
   * Get information about all registered agents
   */
  getRegisteredAgents() {
    const agentInfo: any[] = []

    this.agents.forEach((agent, agentId) => {
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
  }
}

// Export singleton instance for use across the application
export const orchestrator = new AgentOrchestrator()
