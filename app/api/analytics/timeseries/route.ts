import { NextRequest, NextResponse } from 'next/server'
import { MetricsService } from '@/lib/metrics-service'
import { auth } from '@/lib/auth'

/**
 * GET /api/analytics/timeseries
 * Get time-series metrics data for charts
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
    
    // Parse parameters
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const interval = (searchParams.get('interval') as 'hour' | 'day' | 'week') || 'day'
    
    // Default to last 30 days if no dates provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Get time-series data
    const timeSeriesData = await MetricsService.getTimeSeriesData(
      userId,
      startDate,
      endDate,
      interval
    )

    return NextResponse.json(timeSeriesData)
  } catch (error) {
    console.error('Error fetching time-series data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time-series data' },
      { status: 500 }
    )
  }
}
