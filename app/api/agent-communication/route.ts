import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/error-handler"

/**
 * GET /api/agent-communication
 * Retrieve agent-to-agent communication messages
 */
export async function GET() {
  try {
    const fakeUserId = "fake-user"

    // Fetch recent agent-to-agent communications
    // Messages with fromAgent and toAgent fields are inter-agent communications
    const messages = await prisma.message.findMany({
      where: {
        agent: {
          userId: fakeUserId,
        },
        OR: [
          { fromAgent: { not: null } },
          { toAgent: { not: null } }
        ]
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to most recent 100 messages
    })

    // Also fetch regular agent messages for demo purposes (since inter-agent comm may not exist yet)
    const regularMessages = await prisma.message.findMany({
      where: {
        agent: {
          userId: fakeUserId,
        },
        role: 'assistant',
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    // Transform messages to communication log format
    const communicationMessages = [...messages, ...regularMessages]
      .map((msg) => {
        // Determine message type
        const type = msg.type || 'response'

        // Build communication message
        return {
          id: msg.id,
          fromAgentId: msg.fromAgent || msg.agent.id,
          fromAgentName: msg.fromAgent ? 'Agent' : msg.agent.name,
          toAgentId: msg.toAgent || 'user',
          toAgentName: msg.toAgent ? 'Agent' : 'User',
          content: msg.content.length > 200 
            ? msg.content.substring(0, 200) + '...' 
            : msg.content,
          type: type as 'query' | 'response' | 'notification' | 'task',
          timestamp: msg.createdAt,
          metadata: {
            priority: msg.priority,
            taskId: msg.taskId,
          },
        }
      })
      // Remove duplicates by id
      .filter((msg, index, self) => 
        index === self.findIndex((m) => m.id === msg.id)
      )
      // Sort by timestamp descending
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    console.log('[GET_AGENT_COMMUNICATION]', {
      userId: fakeUserId,
      count: communicationMessages.length,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      messages: communicationMessages,
      count: communicationMessages.length,
    })
  } catch (error) {
    return handleApiError(error, "GET_AGENT_COMMUNICATION")
  }
}

/**
 * POST /api/agent-communication
 * Log a new agent-to-agent communication event
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fromAgentId, toAgentId, content, type, metadata } = body

    // Validate required fields
    if (!fromAgentId || !toAgentId || !content) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "fromAgentId, toAgentId, and content are required",
        },
        { status: 400 }
      )
    }

    const communicationLog = {
      id: `comm-${Date.now()}-${Math.random()}`,
      fromAgentId,
      toAgentId,
      content,
      type: type || 'notification',
      metadata: metadata || {},
      timestamp: new Date(),
    }

    console.log('[AGENT_COMMUNICATION_LOGGED]', communicationLog)

    // Store as a message with fromAgent and toAgent fields
    await prisma.message.create({
      data: {
        content,
        role: 'system',
        agentId: toAgentId,
        fromAgent: fromAgentId,
        toAgent: toAgentId,
        type: type || 'notification',
        priority: metadata?.priority as string || undefined,
        taskId: metadata?.taskId as string || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      communication: communicationLog,
    })
  } catch (error) {
    return handleApiError(error, "POST_AGENT_COMMUNICATION")
  }
}
