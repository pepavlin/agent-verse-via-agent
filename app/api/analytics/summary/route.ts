import { NextRequest, NextResponse } from 'next/server'
import { MetricsService } from '@/lib/metrics-service'
import { auth } from '@/lib/auth'

/**
 * GET /api/analytics/summary
 * Get overall metrics summary for the authenticated user
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

    // Get metrics summary
    const metrics = await MetricsService.getUserMetrics(userId, startDate, endDate)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching analytics summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics summary' },
      { status: 500 }
    )
  }
}
