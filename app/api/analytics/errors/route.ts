import { NextRequest, NextResponse } from 'next/server'
import { MetricsService } from '@/lib/metrics-service'
import { auth } from '@/lib/auth'

/**
 * GET /api/analytics/errors
 * Get error analysis for the authenticated user
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

    // Get error analysis
    const errorAnalysis = await MetricsService.getErrorAnalysis(userId, startDate, endDate)

    return NextResponse.json(errorAnalysis)
  } catch (error) {
    console.error('Error fetching error analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error analysis' },
      { status: 500 }
    )
  }
}
