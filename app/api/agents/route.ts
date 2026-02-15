import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/error-handler"
import { CreateAgentSchema, validateSchema, formatZodErrors } from "@/lib/validation"

export async function GET() {
  try {
    // Fake user ID - no authentication required
    const fakeUserId = "fake-user"

    const agents = await prisma.agent.findMany({
      where: {
        userId: fakeUserId
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
      userId: fakeUserId,
      agentCount: agents.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(agents)
  } catch (error) {
    return handleApiError(error, "AGENTS_GET")
  }
}

export async function POST(request: Request) {
  try {
    // Fake user ID - no authentication required
    const fakeUserId = "fake-user"

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

    const { name, description, model, role, personality, specialization, departmentId, color, size } = validationResult.data

    // Check for maximum agent limit (20 agents per user)
    const agentCount = await prisma.agent.count({
      where: { userId: fakeUserId }
    })

    if (agentCount >= 20) {
      return NextResponse.json(
        {
          error: "AGENT_LIMIT_EXCEEDED",
          message: "You have reached the maximum limit of 20 agents. Please delete some agents before creating new ones.",
        },
        { status: 400 }
      )
    }

    // Check for duplicate agent name
    const existingAgent = await prisma.agent.findFirst({
      where: {
        userId: fakeUserId,
        name: name
      }
    })

    if (existingAgent) {
      return NextResponse.json(
        {
          error: "DUPLICATE_AGENT_NAME",
          message: "An agent with this name already exists. Please choose a different name.",
        },
        { status: 400 }
      )
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description: description || null,
        model: model || "claude-3-5-sonnet-20241022",
        role,
        personality: personality || null,
        specialization: specialization || null,
        departmentId: departmentId || null,
        color: color || "#a855f7",
        size: size || 20,
        userId: fakeUserId
      }
    })

    console.log('[AGENTS_POST_SUCCESS]', {
      userId: fakeUserId,
      agentId: agent.id,
      agentName: agent.name,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(agent)
  } catch (error) {
    return handleApiError(error, "AGENTS_POST")
  }
}
