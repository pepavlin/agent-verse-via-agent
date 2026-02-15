import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/types"
import Anthropic from "@anthropic-ai/sdk"
import { handleApiError, validationError, notFoundError } from "@/lib/error-handler"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const fakeUserId = "fake-user"

    const body = await request.json()
    const { agentId, message } = body

    // Validate required fields
    if (!agentId) {
      return validationError(
        "Missing required field",
        "agentId",
        "Agent ID is required to send a message"
      )
    }

    if (!message) {
      return validationError(
        "Missing required field",
        "message",
        "Message content cannot be empty"
      )
    }

    // Validate message is a string
    if (typeof message !== 'string') {
      return validationError(
        "Invalid message format",
        "message",
        "Message must be a string"
      )
    }

    // Validate message length
    if (message.trim().length === 0) {
      return validationError(
        "Empty message",
        "message",
        "Message cannot be empty or contain only whitespace"
      )
    }

    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: fakeUserId
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 20
        }
      }
    })

    if (!agent) {
      return notFoundError(
        "Agent",
        `No agent found with ID: ${agentId} for this user`
      )
    }

    // Save user message
    await prisma.message.create({
      data: {
        content: message,
        role: 'user',
        agentId: agent.id
      }
    })

    // Prepare conversation history for Claude
    const conversationHistory = agent.messages.map((msg: Prisma.MessageGetPayload<object>) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    conversationHistory.push({
      role: 'user',
      content: message
    })

    console.log('[CHAT_API_CALL]', {
      userId: fakeUserId,
      agentId: agent.id,
      model: agent.model,
      messageCount: conversationHistory.length,
      timestamp: new Date().toISOString()
    })

    // Call Claude API
    const response = await anthropic.messages.create({
      model: agent.model,
      max_tokens: 1024,
      messages: conversationHistory,
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // Save assistant message
    const savedMessage = await prisma.message.create({
      data: {
        content: assistantMessage,
        role: 'assistant',
        agentId: agent.id
      }
    })

    console.log('[CHAT_SUCCESS]', {
      userId: fakeUserId,
      agentId: agent.id,
      messageId: savedMessage.id,
      responseLength: assistantMessage.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      message: savedMessage,
      response: assistantMessage
    })
  } catch (error) {
    return handleApiError(error, "CHAT")
  }
}
