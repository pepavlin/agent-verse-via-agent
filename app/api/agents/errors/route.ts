import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError, authenticationError } from "@/lib/error-handler"

/**
 * GET /api/agents/errors
 * Get error logs for all user's agents with optional filtering
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authenticationError(
        "Unauthorized",
        "You must be logged in to view error logs"
      )
    }

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's agent IDs for filtering
    const userAgents = await prisma.agent.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        name: true,
        role: true
      }
    })

    const agentMap = new Map(userAgents.map(a => [a.id, a]))

    // Build filter
    const whereClause: any = {
      success: false,
      agentId: {
        in: userAgents.map(a => a.id)
      }
    }

    if (agentId) {
      whereClause.agentId = agentId
    }

    // Get error logs
    const errors = await prisma.agentMetrics.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count
    const totalCount = await prisma.agentMetrics.count({
      where: whereClause
    })

    // Format response
    const formattedErrors = errors.map(error => {
      const agent = agentMap.get(error.agentId)
      return {
        id: error.id,
        agentId: error.agentId,
        agentName: agent?.name || 'Unknown',
        agentRole: agent?.role || 'unknown',
        errorMessage: error.errorMessage,
        timestamp: error.createdAt,
        executionTime: error.executionTime
      }
    })

    return NextResponse.json({
      errors: formattedErrors,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    return handleApiError(error, "AGENT_ERRORS")
  }
}
