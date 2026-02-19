import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, notFoundError, validationError } from "@/lib/error-handler"
import { ResearcherAgent, StrategistAgent, CriticAgent, IdeatorAgent } from "@/app/agents"
import { Agent } from "@/types"
import { AgentStatusTracker } from "@/lib/agent-status-tracker"

/**
 * Factory function to create appropriate agent instance based on role
 */
function createAgentInstance(agent: Agent) {
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
      // Default to researcher if no role specified
      return new ResearcherAgent(agent)
  }
}

/**
 * POST /api/agents/[agentId]/run
 * Execute an agent with given input
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const fakeUserId = "fake-user"
    const { agentId } = await params

    // Parse request body
    const body = await request.json()
    const { input, context } = body

    if (!input || typeof input !== 'string') {
      return validationError(
        "Input is required",
        "input",
        "Please provide a valid input string for the agent"
      )
    }

    // Fetch agent from database
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: fakeUserId
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 10 // Last 10 messages for context
        }
      }
    })

    if (!agent) {
      return notFoundError(
        "Agent",
        `No agent found with ID: ${agentId} for this user`
      )
    }

    // Create agent instance - map database agent to Agent type
    const agentData: Agent = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      model: agent.model,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      userId: agent.userId,
      personality: agent.personality || undefined,
      role: agent.role as Agent['role'],
      specialization: agent.specialization || undefined,
      departmentId: agent.departmentId || undefined
    }

    const agentInstance = createAgentInstance(agentData)

    // Update status to thinking before execution
    AgentStatusTracker.updateState(agent.id, agent.name, 'thinking', input)

    try {
      // Execute agent
      const startTime = Date.now()
      const result = await agentInstance.execute(input, {
        messages: agent.messages,
        ...context
      })
      const executionTime = Date.now() - startTime

      // Record task execution
      AgentStatusTracker.recordTaskExecution(
        agent.id,
        agent.name,
        result.success,
        executionTime,
        result.success ? undefined : {
          message: result.error || 'Unknown error',
          details: result.error,
        }
      )

      // Save the interaction to database
      await prisma.message.create({
        data: {
          content: input,
          role: 'user',
          agentId: agent.id
        }
      })

      if (result.success && result.result) {
        await prisma.message.create({
          data: {
            content: String(result.result),
            role: 'assistant',
            agentId: agent.id
          }
        })
      }

      console.log('[AGENT_RUN_SUCCESS]', {
        userId: fakeUserId,
        agentId: agent.id,
        agentRole: agent.role,
        executionTime: result.executionTime,
        success: result.success,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(result)
    } catch (error) {
      // Ensure status is updated to error state if execution fails
      const executionTime = Date.now() - Date.now() // Will be 0 for failed executions
      AgentStatusTracker.recordTaskExecution(
        agent.id,
        agent.name,
        false,
        executionTime,
        {
          message: error instanceof Error ? error.message : 'Execution failed',
          details: error instanceof Error ? error.stack : String(error),
        }
      )
      throw error // Re-throw to be handled by outer catch
    }
  } catch (error) {
    return handleApiError(error, "AGENT_RUN")
  }
}
