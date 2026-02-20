import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError, authenticationError } from "@/lib/error-handler"

/**
 * GET /api/dashboard/errors
 * Get error logs for all agents with optional filtering
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

    // Build where clause
    const where: any = {
      success: false,
      agent: {
        userId: session.user.id
      }
    }

    if (agentId) {
      where.agentId = agentId
    }

    // Fetch error executions
    const errorExecutions = await prisma.agentExecution.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            role: true,
            color: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.agentExecution.count({
      where
    })

    const errors = errorExecutions.map(exec => ({
      id: exec.id,
      agentId: exec.agentId,
      agentName: exec.agent?.name,
      agentRole: exec.agent?.role,
      agentColor: exec.agent?.color,
      status: exec.status,
      errorMessage: exec.errorMessage,
      input: exec.input,
      createdAt: exec.createdAt,
      responseTime: exec.responseTime
    }))

    console.log('[DASHBOARD_ERRORS_SUCCESS]', {
      userId: session.user.id,
      errorCount: errors.length,
      totalCount,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      errors,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    return handleApiError(error, "DASHBOARD_ERRORS")
  }
}
