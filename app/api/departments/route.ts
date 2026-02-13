import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/departments
 * List all available departments
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Return list of available departments
    const departments = [
      {
        id: 'market-research',
        name: 'Market Research Department',
        description: 'Comprehensive market analysis and strategic recommendations through collaborative agent workflow',
        requiredRoles: ['researcher', 'strategist', 'critic', 'ideator'],
        endpoint: '/api/departments/market-research/run',
        capabilities: [
          'Competitive Analysis',
          'Market Trend Identification',
          'Strategic Opportunity Assessment',
          'Risk Analysis',
          'Innovation Strategy',
          'Market Positioning Recommendations'
        ],
        workflowSteps: [
          {
            step: 1,
            role: 'researcher',
            description: 'Gather comprehensive market data and competitive intelligence'
          },
          {
            step: 2,
            role: 'strategist',
            description: 'Analyze research findings to identify strategic opportunities'
          },
          {
            step: 3,
            role: 'critic',
            description: 'Evaluate strategy for risks, gaps, and challenges'
          },
          {
            step: 4,
            role: 'ideator',
            description: 'Propose innovative solutions to address identified gaps'
          }
        ]
      }
      // Future departments can be added here
      // {
      //   id: 'product-development',
      //   name: 'Product Development Department',
      //   ...
      // }
    ]

    return NextResponse.json({
      departments,
      count: departments.length
    })

  } catch (error) {
    console.error('Departments list error:', error)
    return handleApiError(error)
  }
}
