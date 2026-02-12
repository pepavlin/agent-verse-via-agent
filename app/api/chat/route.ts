import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { agentId, message } = body

    if (!agentId || !message) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: session.user.id
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
      return new NextResponse("Agent not found", { status: 404 })
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
    const conversationHistory = agent.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    conversationHistory.push({
      role: 'user',
      content: message
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

    return NextResponse.json({
      message: savedMessage,
      response: assistantMessage
    })
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
