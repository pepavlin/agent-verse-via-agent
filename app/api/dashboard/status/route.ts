import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/dashboard/status
 * Get current status of all agents with recent activity
 */
export async function GET() {
  try {
    // Get all agents
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        color: true,
        createdAt: true,
      },
    })

    // Get status for each agent
    const agentStatuses = await Promise.all(
      agents.map(async (agent) => {
        // Get latest status log
        const latestStatus = await prisma.agentStatusLog.findFirst({
          where: { agentId: agent.id },
          orderBy: { timestamp: 'desc' },
        })

        // Get recent status history (last 10 status changes)
        const statusHistory = await prisma.agentStatusLog.findMany({
          where: { agentId: agent.id },
          orderBy: { timestamp: 'desc' },
          take: 10,
        })

        // Get current task/workflow if any
        const currentTask = latestStatus?.taskId
          ? await prisma.task.findUnique({
              where: { id: latestStatus.taskId },
              select: { title: true, status: true },
            })
          : null

        return {
          agentId: agent.id,
          agentName: agent.name,
          role: agent.role,
          color: agent.color,
          currentStatus: latestStatus?.status || 'idle',
          statusDetails: latestStatus?.details,
          currentTask: currentTask?.title,
          taskStatus: currentTask?.status,
          lastUpdated: latestStatus?.timestamp || agent.createdAt,
          statusHistory: statusHistory.map(s => ({
            status: s.status,
            timestamp: s.timestamp,
            duration: s.duration,
          })),
        }
      })
    )

    return NextResponse.json({
      agents: agentStatuses,
      timestamp: new Date(),
    })
  } catch (error) {
    return handleApiError(error, 'DASHBOARD_STATUS')
  }
}
