import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { MarketResearchDepartment } from '@/lib/MarketResearchDepartment'
import { MarketResearchExecutionSchema, validateSchema, formatZodErrors } from '@/lib/validation'
import { handleApiError } from '@/lib/error-handler'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { Agent } from '@/types'

/**
 * POST /api/departments/market-research/run
 * Execute market research workflow with all 4 agents
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimitResult = applyRateLimit(session.user.id, RATE_LIMITS.CHAT)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
          },
        }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = validateSchema(MarketResearchExecutionSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodErrors(validation.errors) },
        { status: 400 }
      )
    }

    const { query, options } = validation.data

    // Fetch user's agents for market research roles
    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id,
        role: {
          in: ['researcher', 'strategist', 'critic', 'ideator']
        }
      }
    })

    // Check if we have all required roles
    const requiredRoles = ['researcher', 'strategist', 'critic', 'ideator']
    const availableRoles = new Set(agents.map((a: Prisma.AgentGetPayload<object>) => a.role))
    const missingRoles = requiredRoles.filter(role => !availableRoles.has(role))

    if (missingRoles.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required agents',
          message: `You need to create agents with the following roles: ${missingRoles.join(', ')}`,
          missingRoles,
          availableAgents: agents.map((a: Prisma.AgentGetPayload<object>) => ({ id: a.id, name: a.name, role: a.role }))
        },
        { status: 400 }
      )
    }

    // Create department instance
    const department = new MarketResearchDepartment()

    // Register agents with department
    for (const agent of agents) {
      if (agent.role && requiredRoles.includes(agent.role)) {
        department.registerAgent(agent as Agent)
      }
    }

    // Execute market research workflow
    const result = await department.conductMarketResearch(query, options || {})

    // Save workflow execution to database (optional - for history)
    // You could create a WorkflowExecution model to track this

    return NextResponse.json(
      {
        success: result.success,
        workflowId: result.workflowId,
        departmentId: result.departmentId,
        result: result.result,
        error: result.error,
        steps: result.steps,
        executionTime: result.executionTime,
        timestamp: result.timestamp,
        agentsUsed: agents.map((a: Prisma.AgentGetPayload<object>) => ({
          id: a.id,
          name: a.name,
          role: a.role
        }))
      },
      {
        status: result.success ? 200 : 500
      }
    )

  } catch (error) {
    console.error('Market research execution error:', error)
    return handleApiError(error)
  }
}

/**
 * GET /api/departments/market-research/run
 * Get information about the market research department
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Fetch user's agents for market research roles
    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id,
        role: {
          in: ['researcher', 'strategist', 'critic', 'ideator']
        }
      }
    })

    const requiredRoles = ['researcher', 'strategist', 'critic', 'ideator']
    const availableRoles = new Set(agents.map((a: Prisma.AgentGetPayload<object>) => a.role))
    const missingRoles = requiredRoles.filter(role => !availableRoles.has(role))

    // Create temporary department to get info
    const department = new MarketResearchDepartment()
    for (const agent of agents) {
      if (agent.role && requiredRoles.includes(agent.role)) {
        department.registerAgent(agent as Agent)
      }
    }

    const departmentInfo = department.getResearchStatus()

    return NextResponse.json({
      ...departmentInfo,
      availableAgents: agents.map((a: Prisma.AgentGetPayload<object>) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        model: a.model
      })),
      missingRoles,
      isReady: missingRoles.length === 0
    })

  } catch (error) {
    console.error('Market research info error:', error)
    return handleApiError(error)
  }
}
