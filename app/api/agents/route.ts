import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError, authenticationError, validationError } from "@/lib/error-handler"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authenticationError(
        "Unauthorized",
        "You must be logged in to view agents"
      )
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

    return NextResponse.json(agents)
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

    const body = await request.json()
    const { name, description, model, role, personality } = body

    if (!name) {
      return validationError(
        "Name is required",
        "name",
        "Agent name cannot be empty"
      )
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        model: model || "claude-3-5-sonnet-20241022",
        role: role || null,
        personality: personality || null,
        userId: session.user.id
      }
    })

    console.log('[AGENTS_POST_SUCCESS]', {
      userId: session.user.id,
      agentId: agent.id,
      agentName: agent.name,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(agent)
  } catch (error) {
    return handleApiError(error, "AGENTS_POST")
  }
}
