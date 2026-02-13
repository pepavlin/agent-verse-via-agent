import { Agent, AgentRole, WorkflowStep, WorkflowStatus, DepartmentExecutionResult, UserQuery, UserInteractionRequest } from '@/types'
import { AgentOrchestrator } from './orchestrator'
import { ResearcherAgent } from '@/app/agents/ResearcherAgent'
import { StrategistAgent } from '@/app/agents/StrategistAgent'
import { CriticAgent } from '@/app/agents/CriticAgent'
import { IdeatorAgent } from '@/app/agents/IdeatorAgent'

export interface DepartmentConfig {
  id: string
  name: string
  description: string
  requiredRoles: AgentRole[]
  workflowTemplate: Omit<WorkflowStep, 'agentId' | 'status' | 'startedAt' | 'completedAt'>[]
}

/**
 * Department class manages groups of agents and coordinates their workflows
 */
export class Department {
  private id: string
  private name: string
  private description: string
  private agents: Map<AgentRole, Agent>
  private orchestrator: AgentOrchestrator
  private config: DepartmentConfig
  private userQueryCallback?: (query: UserInteractionRequest) => Promise<string>

  constructor(config: DepartmentConfig) {
    this.id = config.id
    this.name = config.name
    this.description = config.description
    this.config = config
    this.agents = new Map()
    this.orchestrator = new AgentOrchestrator()
  }

  /**
   * Register an agent with this department
   */
  registerAgent(agent: Agent): void {
    if (!agent.role) {
      throw new Error(`Agent ${agent.id} does not have a role assigned`)
    }

    if (!this.config.requiredRoles.includes(agent.role)) {
      throw new Error(`Role ${agent.role} is not required for department ${this.name}`)
    }

    this.agents.set(agent.role, agent)
    this.orchestrator.registerAgent(agent)
  }

  /**
   * Unregister an agent from this department
   */
  unregisterAgent(agentRole: AgentRole): void {
    const agent = this.agents.get(agentRole)
    if (agent) {
      this.orchestrator.unregisterAgent(agent.id)
      this.agents.delete(agentRole)
    }
  }

  /**
   * Get all registered agents
   */
  getAgents(): Agent[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get agent by role
   */
  getAgentByRole(role: AgentRole): Agent | undefined {
    return this.agents.get(role)
  }

  /**
   * Check if all required roles are filled
   */
  isFullyStaffed(): boolean {
    return this.config.requiredRoles.every(role => this.agents.has(role))
  }

  /**
   * Get missing roles
   */
  getMissingRoles(): AgentRole[] {
    return this.config.requiredRoles.filter(role => !this.agents.has(role))
  }

  /**
   * Set callback for user interactions
   */
  setUserQueryCallback(callback: (query: UserInteractionRequest) => Promise<string>): void {
    this.userQueryCallback = callback
  }

  /**
   * Request user input during workflow execution
   */
  async requestUserInput(
    workflowId: string,
    agentId: string,
    question: string,
    context?: any
  ): Promise<string> {
    if (!this.userQueryCallback) {
      throw new Error('User query callback not set')
    }

    const agent = Array.from(this.agents.values()).find(a => a.id === agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in department`)
    }

    const query: UserInteractionRequest = {
      workflowId,
      agentId,
      agentName: agent.name,
      question,
      context,
      timeout: 300000 // 5 minutes default
    }

    return await this.userQueryCallback(query)
  }

  /**
   * Execute department workflow
   */
  async execute(
    input: string,
    context?: any,
    enableUserInteraction: boolean = false
  ): Promise<DepartmentExecutionResult> {
    const startTime = Date.now()
    const workflowId = `workflow-${this.id}-${Date.now()}`

    if (!this.isFullyStaffed()) {
      const missingRoles = this.getMissingRoles()
      return {
        workflowId,
        departmentId: this.id,
        success: false,
        error: `Department is not fully staffed. Missing roles: ${missingRoles.join(', ')}`,
        steps: [],
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      }
    }

    const steps: WorkflowStep[] = this.config.workflowTemplate.map((template, index) => ({
      ...template,
      agentId: this.agents.get(template.agentRole)?.id,
      status: 'pending' as const
    }))

    const userQueries: UserQuery[] = []
    let currentContext = context || {}
    let workflowInput = input

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const agent = this.agents.get(step.agentRole)

        if (!agent) {
          step.status = 'failed'
          step.error = `Agent with role ${step.agentRole} not found`
          continue
        }

        step.status = 'in_progress'
        step.startedAt = new Date()

        try {
          // Prepare input for this step (includes previous step output)
          const stepInput = i === 0 ? workflowInput : steps[i - 1].output

          // Execute agent with context
          const result = await this.orchestrator.executeAgent(
            agent.id,
            stepInput,
            {
              ...currentContext,
              workflowId,
              stepNumber: step.stepNumber,
              previousSteps: steps.slice(0, i).map(s => ({
                role: s.agentRole,
                output: s.output
              }))
            }
          )

          step.output = result.result
          step.status = 'completed'
          step.completedAt = new Date()

          // Update context with step results
          currentContext = {
            ...currentContext,
            [`${step.agentRole}Result`]: result.result
          }

        } catch (error) {
          step.status = 'failed'
          step.error = error instanceof Error ? error.message : String(error)
          step.completedAt = new Date()

          // Continue to next step or fail workflow based on criticality
          // For now, we'll continue but mark the failure
        }
      }

      // Compile final result from all steps
      const successfulSteps = steps.filter(s => s.status === 'completed')
      const failedSteps = steps.filter(s => s.status === 'failed')

      const finalResult = {
        summary: this.compileFinalResult(steps),
        steps: steps.map(s => ({
          role: s.agentRole,
          description: s.description,
          status: s.status,
          output: s.output,
          error: s.error
        })),
        context: currentContext
      }

      return {
        workflowId,
        departmentId: this.id,
        success: failedSteps.length === 0,
        result: finalResult,
        steps,
        userQueries: userQueries.length > 0 ? userQueries : undefined,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      }

    } catch (error) {
      return {
        workflowId,
        departmentId: this.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        steps,
        userQueries: userQueries.length > 0 ? userQueries : undefined,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      }
    }
  }

  /**
   * Compile final result from all workflow steps
   */
  private compileFinalResult(steps: WorkflowStep[]): string {
    const completedSteps = steps.filter(s => s.status === 'completed')

    if (completedSteps.length === 0) {
      return 'No steps completed successfully'
    }

    let summary = `# ${this.name} - Workflow Results\n\n`

    completedSteps.forEach(step => {
      summary += `## ${step.agentRole.charAt(0).toUpperCase() + step.agentRole.slice(1)} Analysis\n`
      summary += `${step.output}\n\n`
    })

    summary += `---\n\n`
    summary += `**Workflow Summary**: Completed ${completedSteps.length} of ${steps.length} steps successfully.\n`

    return summary
  }

  /**
   * Get department info
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      requiredRoles: this.config.requiredRoles,
      registeredAgents: Array.from(this.agents.entries()).map(([role, agent]) => ({
        role,
        agentId: agent.id,
        agentName: agent.name
      })),
      isFullyStaffed: this.isFullyStaffed(),
      missingRoles: this.getMissingRoles()
    }
  }

  /**
   * Get department ID
   */
  getId(): string {
    return this.id
  }

  /**
   * Get department name
   */
  getName(): string {
    return this.name
  }
}
