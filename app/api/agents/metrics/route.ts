import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError, authenticationError } from "@/lib/error-handler"

/**
 * GET /api/agents/metrics
 * Get aggregated metrics for all user's agents
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authenticationError(
        "Unauthorized",
        "You must be logged in to view agent metrics"
      )
    }

    // Get all user's agents
    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        name: true,
        role: true,
        color: true
      }
    })

    // Get metrics for each agent
    const metricsPromises = agents.map(async (agent) => {
      // Get latest status from metrics
      const latestMetric = await prisma.agentMetrics.findFirst({
        where: {
          agentId: agent.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Get aggregate metrics
      const totalTasks = await prisma.message.count({
        where: {
          agentId: agent.id,
          role: 'assistant'
        }
      })

      // Get metrics from last 24 hours
      const last24Hours = new Date()
      last24Hours.setHours(last24Hours.getHours() - 24)

      const recentMetrics = await prisma.agentMetrics.findMany({
        where: {
          agentId: agent.id,
          createdAt: {
            gte: last24Hours
          }
        }
      })

      // Calculate error rate
      const totalExecutions = recentMetrics.length
      const failedExecutions = recentMetrics.filter(m => !m.success).length
      const errorRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0

      // Calculate average response time
      const executionTimes = recentMetrics.filter(m => m.executionTime).map(m => m.executionTime!)
      const avgResponseTime = executionTimes.length > 0
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
        : 0

      // Get last activity
      const lastMessage = await prisma.message.findFirst({
        where: {
          agentId: agent.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          createdAt: true
        }
      })

      return {
        agentId: agent.id,
        name: agent.name,
        role: agent.role,
        color: agent.color,
        status: latestMetric?.status || 'idle',
        lastActivity: lastMessage?.createdAt || null,
        metrics: {
          tasksCompleted: totalTasks,
          averageResponseTime: Math.round(avgResponseTime),
          errorRate: Math.round(errorRate * 10) / 10,
          activityFrequency: recentMetrics.length
        }
      }
    })

    const metrics = await Promise.all(metricsPromises)

    return NextResponse.json({
      agents: metrics,
      timestamp: new Date()
    })
  } catch (error) {
    return handleApiError(error, "AGENT_METRICS")
  }
}
