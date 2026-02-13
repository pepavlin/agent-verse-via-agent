import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError, authenticationError, notFoundError } from "@/lib/error-handler"
import { AgentStatus } from "@/types"

/**
 * GET /api/agents/[agentId]/status
 * Get current status of an agent
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const session = await auth()
    const { agentId } = await params

    if (!session?.user?.id) {
      return authenticationError(
        "Unauthorized",
        "You must be logged in to view agent status"
      )
    }

    // Fetch agent from database
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: session.user.id
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!agent) {
      return notFoundError(
        "Agent",
        `No agent found with ID: ${agentId} for this user`
      )
    }

    // Calculate metrics
    const totalMessages = await prisma.message.count({
      where: {
        agentId: agent.id,
        role: 'assistant'
      }
    })

    const lastActivity = agent.messages.length > 0
      ? agent.messages[0].createdAt
      : agent.updatedAt

    // Build status response
    const status: AgentStatus = {
      agentId: agent.id,
      status: 'idle', // In a real system, this would be tracked in database or cache
      lastActivity,
      metrics: {
        tasksCompleted: totalMessages,
        averageResponseTime: 0, // Would need to track execution times
        successRate: 100 // Would need to track failures
      }
    }

    console.log('[AGENT_STATUS_SUCCESS]', {
      userId: session.user.id,
      agentId: agent.id,
      status: status.status,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(status)
  } catch (error) {
    return handleApiError(error, "AGENT_STATUS")
  }
}
