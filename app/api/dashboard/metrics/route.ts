import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/dashboard/metrics
 * Get real-time health metrics for all agents
 */
export async function GET() {
  try {
    // Get all agents
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    // Get latest status for each agent
    const agentMetrics = await Promise.all(
      agents.map(async (agent) => {
        // Get latest status log
        const latestStatus = await prisma.agentStatusLog.findFirst({
          where: { agentId: agent.id },
          orderBy: { timestamp: 'desc' },
        })

        // Get metrics from last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const recentMetrics = await prisma.agentMetrics.findMany({
          where: {
            agentId: agent.id,
            timestamp: { gte: oneDayAgo },
          },
          orderBy: { timestamp: 'desc' },
        })

        // Calculate aggregated metrics
        const totalExecutions = recentMetrics.reduce(
          (sum, m) => sum + m.totalExecutions,
          0
        )
        const successfulExecs = recentMetrics.reduce(
          (sum, m) => sum + m.successfulExecs,
          0
        )
        const failedExecs = recentMetrics.reduce(
          (sum, m) => sum + m.failedExecs,
          0
        )
        const avgResponseTime =
          recentMetrics.length > 0
            ? Math.round(
                recentMetrics.reduce((sum, m) => sum + (m.responseTimeMs || 0), 0) /
                  recentMetrics.length
              )
            : 0

        // Get error count from last 24 hours
        const errorCount = await prisma.errorLog.count({
          where: {
            agentId: agent.id,
            timestamp: { gte: oneDayAgo },
            resolved: false,
          },
        })

        // Get last activity timestamp
        const lastMessage = await prisma.message.findFirst({
          where: { agentId: agent.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })

        const successRate =
          totalExecutions > 0
            ? Math.round((successfulExecs / totalExecutions) * 100)
            : 100

        return {
          agentId: agent.id,
          agentName: agent.name,
          currentStatus: (latestStatus?.status || 'idle') as
            | 'idle'
            | 'thinking'
            | 'communicating'
            | 'error',
          averageResponseTime: avgResponseTime,
          successRate,
          totalExecutions,
          errorCount,
          lastActivity: lastMessage?.createdAt || agent.createdAt,
          role: agent.role,
        }
      })
    )

    // Calculate overall stats
    const totalAgents = agents.length
    const activeAgents = agentMetrics.filter(
      (m) => m.currentStatus === 'thinking' || m.currentStatus === 'communicating'
    ).length
    const idleAgents = agentMetrics.filter((m) => m.currentStatus === 'idle').length
    const errorAgents = agentMetrics.filter((m) => m.currentStatus === 'error').length

    const totalExecutionsToday = agentMetrics.reduce(
      (sum, m) => sum + m.totalExecutions,
      0
    )
    const averageResponseTime =
      agentMetrics.length > 0
        ? Math.round(
            agentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) /
              agentMetrics.length
          )
        : 0
    const overallSuccessRate =
      agentMetrics.length > 0
        ? Math.round(
            agentMetrics.reduce((sum, m) => sum + m.successRate, 0) / agentMetrics.length
          )
        : 100

    const dashboardStats = {
      totalAgents,
      activeAgents,
      idleAgents,
      errorAgents,
      totalExecutionsToday,
      averageResponseTime,
      overallSuccessRate,
    }

    return NextResponse.json({
      stats: dashboardStats,
      agents: agentMetrics,
    })
  } catch (error) {
    return handleApiError(error, 'DASHBOARD_METRICS')
  }
}
