import { NextRequest, NextResponse } from 'next/server'
import { MetricsService } from '@/lib/metrics-service'
import { auth } from '@/lib/auth'

/**
 * GET /api/analytics/agents
 * Get agent comparison metrics for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    
    // Parse date filters
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    // Get agent comparison metrics
    const agentMetrics = await MetricsService.getAgentComparison(userId, startDate, endDate)

    return NextResponse.json(agentMetrics)
  } catch (error) {
    console.error('Error fetching agent metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent metrics' },
      { status: 500 }
    )
  }
}
