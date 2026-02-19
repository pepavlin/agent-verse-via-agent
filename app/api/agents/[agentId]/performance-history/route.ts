import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError, authenticationError, notFoundError } from '@/lib/error-handler'
import { AgentStatusTracker } from '@/lib/agent-status-tracker'

/**
 * GET /api/agents/[agentId]/performance-history
 * Get historical performance data for an agent
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
        'Unauthorized',
        'You must be logged in to view performance history'
      )
    }

    // Verify agent belongs to user
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: session.user.id,
      },
    })

    if (!agent) {
      return notFoundError('Agent', `No agent found with ID: ${agentId} for this user`)
    }

    // Get performance history from tracker
    const history = AgentStatusTracker.getPerformanceHistory(agentId)

    console.log('[PERFORMANCE_HISTORY_SUCCESS]', {
      userId: session.user.id,
      agentId: agent.id,
      dataPoints: history.length,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      agentId: agent.id,
      agentName: agent.name,
      history,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error, 'PERFORMANCE_HISTORY')
  }
}
