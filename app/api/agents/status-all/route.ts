import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError, authenticationError } from '@/lib/error-handler'
import { AgentStatusTracker } from '@/lib/agent-status-tracker'

/**
 * GET /api/agents/status-all
 * Get real-time status of all agents with metrics
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authenticationError(
        'Unauthorized',
        'You must be logged in to view agent status'
      )
    }

    // Fetch all agents for this user from database
    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        messages: {
          where: {
            role: 'assistant',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                role: 'assistant',
              },
            },
          },
        },
      },
    })

    // Merge database data with in-memory status tracking
    const agentStatusList = agents.map((agent) => {
      const trackedStatus = AgentStatusTracker.getAgentStatus(agent.id)
      const lastActivity =
        agent.messages.length > 0 ? agent.messages[0].createdAt : agent.updatedAt

      return {
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        state: trackedStatus?.state || 'idle',
        currentTask: trackedStatus?.currentTask,
        lastActivity: trackedStatus?.lastActivity || lastActivity,
        metrics: trackedStatus?.metrics || {
          totalTasks: agent._count.messages,
          completedTasks: agent._count.messages,
          failedTasks: 0,
          averageResponseTime: 0,
          errorRate: 0,
        },
        errors: trackedStatus?.errors || [],
        color: agent.color || '#a855f7',
        size: agent.size || 20,
      }
    })

    // Get system-wide metrics
    const systemMetrics = AgentStatusTracker.getSystemMetrics()

    console.log('[AGENT_STATUS_ALL_SUCCESS]', {
      userId: session.user.id,
      agentCount: agentStatusList.length,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      agents: agentStatusList,
      systemMetrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error, 'AGENT_STATUS_ALL')
  }
}
