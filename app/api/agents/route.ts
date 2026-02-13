import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError, authenticationError, validationError } from "@/lib/error-handler"
import { CreateAgentSchema, validateSchema, formatZodErrors } from "@/lib/validation"
import {
  applyRateLimit,
  getRateLimitHeaders,
  createRateLimitError,
  RATE_LIMITS,
} from "@/lib/rate-limit"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authenticationError(
        "Unauthorized",
        "You must be logged in to view agents"
      )
    }

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(
      `agents-get:${session.user.id}`,
      RATE_LIMITS.AGENT_LIST
    )

    if (!rateLimitResult.allowed) {
      const headers = getRateLimitHeaders(rateLimitResult)
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers,
      })
    }

    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('[AGENTS_GET_SUCCESS]', {
      userId: session.user.id,
      agentCount: agents.length,
      timestamp: new Date().toISOString()
    })

    // Add rate limit headers to response
    const headers = getRateLimitHeaders(rateLimitResult)

    return NextResponse.json(agents, { headers })
  } catch (error) {
    return handleApiError(error, "AGENTS_GET")
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authenticationError(
        "Unauthorized",
        "You must be logged in to create agents"
      )
    }

    // Apply rate limiting for agent creation
    const rateLimitResult = applyRateLimit(
      `agents-post:${session.user.id}`,
      RATE_LIMITS.AGENT_CREATE
    )

    if (!rateLimitResult.allowed) {
      const headers = getRateLimitHeaders(rateLimitResult)
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers,
      })
    }

    const body = await request.json()

    // Validate input using Zod schema
    const validationResult = validateSchema(CreateAgentSchema, body)

    if (!validationResult.success) {
      const formattedErrors = formatZodErrors(validationResult.errors)
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: formattedErrors.message,
          fields: formattedErrors.fields,
        },
        { status: 400 }
      )
    }

    const { name, description, model, role, personality, specialization, departmentId } = validationResult.data

    const agent = await prisma.agent.create({
      data: {
        name,
        description: description || null,
        model: model || "claude-3-5-sonnet-20241022",
        role,
        personality: personality || null,
        specialization: specialization || null,
        departmentId: departmentId || null,
        userId: session.user.id
      }
    })

    console.log('[AGENTS_POST_SUCCESS]', {
      userId: session.user.id,
      agentId: agent.id,
      agentName: agent.name,
      timestamp: new Date().toISOString()
    })

    // Add rate limit headers to response
    const headers = getRateLimitHeaders(rateLimitResult)

    return NextResponse.json(agent, { headers })
  } catch (error) {
    return handleApiError(error, "AGENTS_POST")
  }
}
