import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/dashboard/errors
 * Get error logs with filtering
 * Query params: agentId, errorType, resolved, startDate, endDate, limit
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const agentId = searchParams.get('agentId')
    const errorType = searchParams.get('errorType')
    const resolved = searchParams.get('resolved')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Build where clause
    const where: any = {}
    
    if (agentId) {
      where.agentId = agentId
    }
    
    if (errorType) {
      where.errorType = errorType
    }
    
    if (resolved !== null && resolved !== undefined) {
      where.resolved = resolved === 'true'
    }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }

    // Fetch errors
    const errors = await prisma.errorLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 100), // Max 100 errors
    })

    // Get error statistics
    const errorStats = {
      total: errors.length,
      resolved: errors.filter(e => e.resolved).length,
      unresolved: errors.filter(e => !e.resolved).length,
      byType: errors.reduce((acc, e) => {
        acc[e.errorType] = (acc[e.errorType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byAgent: errors.reduce((acc, e) => {
        acc[e.agentName] = (acc[e.agentName] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    return NextResponse.json({
      errors,
      stats: errorStats,
    })
  } catch (error) {
    return handleApiError(error, 'DASHBOARD_ERRORS')
  }
}
