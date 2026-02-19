import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError, authenticationError } from "@/lib/error-handler"

/**
 * GET /api/dashboard/status
 * Get real-time status of all agents for the current user
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authenticationError(
        "Unauthorized",
        "You must be logged in to view dashboard status"
      )
    }

    // Fetch all agents for the user
    const agents = await prisma.agent.findMany({
      where: {
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

    // Fetch metrics for each agent
    const agentStatuses = await Promise.all(
      agents.map(async (agent) => {
        // Get or create metrics
        let metrics = await prisma.agentMetrics.findUnique({
          where: { agentId: agent.id }
        })

        if (!metrics) {
          metrics = await prisma.agentMetrics.create({
            data: {
              agentId: agent.id,
              totalExecutions: 0,
              successfulExecutions: 0,
              failedExecutions: 0,
              averageResponseTime: 0,
              currentStatus: 'idle'
            }
          })
        }

        // Get recent executions for this agent
        const recentExecutions = await prisma.agentExecution.findMany({
          where: {
            agentId: agent.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        })

        const lastActivity = agent.messages.length > 0
          ? agent.messages[0].createdAt
          : metrics.lastActivityAt || agent.updatedAt

        return {
          agentId: agent.id,
          name: agent.name,
          role: agent.role,
          color: agent.color,
          status: metrics.currentStatus,
          lastActivity,
          metrics: {
            totalExecutions: metrics.totalExecutions,
            successfulExecutions: metrics.successfulExecutions,
            failedExecutions: metrics.failedExecutions,
            averageResponseTime: metrics.averageResponseTime,
            successRate: metrics.totalExecutions > 0 
              ? (metrics.successfulExecutions / metrics.totalExecutions) * 100 
              : 100
          },
          recentExecutions: recentExecutions.map(exec => ({
            id: exec.id,
            status: exec.status,
            responseTime: exec.responseTime,
            success: exec.success,
            createdAt: exec.createdAt
          }))
        }
      })
    )

    console.log('[DASHBOARD_STATUS_SUCCESS]', {
      userId: session.user.id,
      agentCount: agents.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      agents: agentStatuses,
      summary: {
        totalAgents: agents.length,
        activeAgents: agentStatuses.filter(a => a.status !== 'idle').length,
        errorAgents: agentStatuses.filter(a => a.status === 'error').length,
        idleAgents: agentStatuses.filter(a => a.status === 'idle').length
      }
    })
  } catch (error) {
    return handleApiError(error, "DASHBOARD_STATUS")
  }
}
