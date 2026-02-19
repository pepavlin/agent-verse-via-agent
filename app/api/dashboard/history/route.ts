import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/dashboard/history
 * Get historical performance data for charts
 * Query params: agentId, period (hourly, daily, weekly), hours (default 24)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const agentId = searchParams.get('agentId')
    const period = searchParams.get('period') || 'hourly'
    const hours = parseInt(searchParams.get('hours') || '24', 10)

    // Calculate time range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000)

    // Build where clause
    const where: any = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      periodType: period,
    }
    
    if (agentId) {
      where.agentId = agentId
    }

    // Fetch metrics
    const metrics = await prisma.agentMetrics.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    })

    // Transform data for charting
    const performanceData = metrics.map(m => ({
      timestamp: m.timestamp,
      agentId: m.agentId,
      responseTime: m.responseTimeMs || 0,
      totalExecutions: m.totalExecutions,
      successfulExecs: m.successfulExecs,
      failedExecs: m.failedExecs,
      successRate: m.totalExecutions > 0 
        ? Math.round((m.successfulExecs / m.totalExecutions) * 100)
        : 100,
      tasksCompleted: m.tasksCompleted,
      messagesProcessed: m.messagesProcessed,
    }))

    // If specific agent requested, include additional context
    if (agentId) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { name: true, role: true },
      })

      return NextResponse.json({
        agent,
        data: performanceData,
        period,
        timeRange: { start: startDate, end: endDate },
      })
    }

    // Group by agent for multi-agent view
    const groupedData = metrics.reduce((acc, m) => {
      if (!acc[m.agentId]) {
        acc[m.agentId] = []
      }
      acc[m.agentId].push({
        timestamp: m.timestamp,
        responseTime: m.responseTimeMs || 0,
        totalExecutions: m.totalExecutions,
        successRate: m.totalExecutions > 0 
          ? Math.round((m.successfulExecs / m.totalExecutions) * 100)
          : 100,
      })
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      data: groupedData,
      period,
      timeRange: { start: startDate, end: endDate },
    })
  } catch (error) {
    return handleApiError(error, 'DASHBOARD_HISTORY')
  }
}
