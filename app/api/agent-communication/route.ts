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

    // Fetch recent agent communications
    // We'll use the Message table and filter for messages with metadata indicating inter-agent communication
    const messages = await prisma.message.findMany({
      where: {
        agent: {
          userId: fakeUserId,
        },
        // Filter for messages that have inter-agent metadata
        role: {
          in: ['assistant', 'system']
        }
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

    // Transform messages to communication log format
    const communicationMessages = messages
      .filter(msg => {
        // For now, we'll create synthetic inter-agent messages
        // In a real implementation, these would come from actual agent-to-agent communications
        return msg.role === 'assistant'
      })
      .map((msg, index) => {
        // Parse metadata if it exists
        let metadata: Record<string, unknown> = {}
        try {
          if (typeof msg.metadata === 'string') {
            metadata = JSON.parse(msg.metadata)
          } else if (msg.metadata && typeof msg.metadata === 'object') {
            metadata = msg.metadata as Record<string, unknown>
          }
        } catch {
          // If parsing fails, use empty metadata
        }

        // Determine message type from metadata or infer
        const type = (metadata.type as string) || 'response'

        // For demo purposes, we'll show agent responses as communications
        // In production, this would track actual agent-to-agent messages
        return {
          id: msg.id,
          fromAgentId: msg.agent.id,
          fromAgentName: msg.agent.name,
          toAgentId: 'user',
          toAgentName: 'User',
          content: msg.content.length > 200 
            ? msg.content.substring(0, 200) + '...' 
            : msg.content,
          type: type as 'query' | 'response' | 'notification' | 'task',
          timestamp: msg.createdAt,
          metadata: metadata,
        }
      })

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

    // In a production implementation, we would store this in a dedicated
    // agent_communications table. For now, we'll log it to console
    // and store it in the message table with appropriate metadata
    
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

    // Store as a system message for the target agent
    await prisma.message.create({
      data: {
        content,
        role: 'system',
        agentId: toAgentId,
        metadata: JSON.stringify({
          ...metadata,
          type: type || 'notification',
          fromAgentId,
          communicationType: 'agent-to-agent',
        }),
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
