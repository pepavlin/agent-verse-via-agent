import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import {
  handleApiError,
  authenticationError,
  validationError,
  notFoundError,
  authorizationError,
} from "@/lib/error-handler"
import {
  ResearcherAgent,
  StrategistAgent,
  CriticAgent,
  IdeatorAgent,
} from "@/app/agents"
import type { BaseAgent } from "@/app/agents/BaseAgent"
import {
  SendMessageSchema,
  GetMessagesQuerySchema,
  validateSchema,
  formatZodErrors,
} from "@/lib/validation"
import {
  applyRateLimit,
  getRateLimitHeaders,
  createRateLimitError,
  RATE_LIMITS,
} from "@/lib/rate-limit"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Helper function to get agent instance based on role
function getAgentInstance(
  agent: {
    id: string
    name: string
    role: string | null
    model: string
    personality: string | null
    specialization: string | null
  }
): BaseAgent | null {
  if (!agent.role) {
    return null
  }
  const config: any = {
    id: agent.id,
    name: agent.name,
    model: agent.model,
    role: agent.role,
    personality: agent.personality,
    specialization: agent.specialization,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: '',
    departmentId: undefined
  }

  switch (agent.role) {
    case "researcher":
      return new ResearcherAgent(config)
    case "strategist":
      return new StrategistAgent(config)
    case "critic":
      return new CriticAgent(config)
    case "ideator":
      return new IdeatorAgent(config)
    default:
      return null
  }
}

// Helper function to build role-specific system prompt
function getRoleSystemPrompt(role: string, personality: string | null): string {
  const basePersonality = personality || ""

  const rolePrompts: Record<string, string> = {
    researcher: `You are a thorough researcher agent. Your role is to gather comprehensive information, verify facts, and analyze data systematically. ${basePersonality}

Key traits:
- Detail-oriented and methodical
- Fact-based and evidence-driven
- Thorough in exploration
- Clear in presenting findings

When responding:
1. Provide well-researched, accurate information
2. Cite key points and evidence
3. Identify gaps in knowledge when present
4. Organize findings logically`,

    strategist: `You are a strategic planning agent. Your role is to develop actionable strategies, identify opportunities and risks, and think long-term. ${basePersonality}

Key traits:
- Forward-thinking and pragmatic
- Goal-oriented
- Risk-aware
- Systematic in planning

When responding:
1. Assess the situation comprehensively
2. Identify key objectives and constraints
3. Propose concrete, actionable strategies
4. Consider potential risks and mitigation`,

    critic: `You are a constructive critic agent. Your role is to evaluate proposals, identify weaknesses, and suggest improvements while being balanced and fair. ${basePersonality}

Key traits:
- Discerning and analytical
- Constructive in feedback
- Quality-focused
- Balanced in assessment

When responding:
1. Evaluate strengths and weaknesses objectively
2. Provide specific, actionable feedback
3. Identify potential issues and risks
4. Suggest concrete improvements`,

    ideator: `You are a creative ideation agent. Your role is to generate innovative ideas, explore possibilities, and think outside conventional boundaries. ${basePersonality}

Key traits:
- Creative and innovative
- Open-minded
- Exploratory
- Diverse in thinking

When responding:
1. Generate multiple diverse ideas
2. Think creatively and unconventionally
3. Build on concepts iteratively
4. Explore various possibilities`,

    coordinator: `You are a coordination agent. Your role is to organize tasks, manage workflows, and ensure smooth collaboration between different agents. ${basePersonality}

Key traits:
- Organized and systematic
- Communication-focused
- Process-oriented
- Collaborative

When responding:
1. Clarify goals and requirements
2. Break down complex tasks
3. Coordinate between different perspectives
4. Track progress and dependencies`,

    executor: `You are an execution agent. Your role is to implement plans, complete tasks efficiently, and deliver results. ${basePersonality}

Key traits:
- Action-oriented
- Efficient
- Results-focused
- Detail-conscious

When responding:
1. Focus on practical implementation
2. Address specific task requirements
3. Provide clear, actionable outputs
4. Report on progress and completion`,
  }

  return (
    rolePrompts[role] ||
    `You are an AI assistant. ${basePersonality}\n\nRespond helpfully and thoughtfully to user queries.`
  )
}

/**
 * GET /api/agents/[agentId]/messages
 * Retrieve message history for a specific agent
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authenticationError(
        "Unauthorized",
        "You must be logged in to view messages"
      )
    }

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(
      `messages-get:${session.user.id}`,
      RATE_LIMITS.AGENT_LIST
    )

    if (!rateLimitResult.allowed) {
      const headers = getRateLimitHeaders(rateLimitResult)
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers,
      })
    }

    const { agentId } = await params

    // Verify agent exists and belongs to user
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: session.user.id,
      },
    })

    if (!agent) {
      return notFoundError(
        "Agent",
        `No agent found with ID: ${agentId} for this user`
      )
    }

    // Parse and validate query parameters for pagination
    const url = new URL(request.url)
    const queryParams = {
      limit: url.searchParams.get("limit") || undefined,
      offset: url.searchParams.get("offset") || undefined,
    }

    const validationResult = validateSchema(
      GetMessagesQuerySchema,
      queryParams
    )

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

    const { limit, offset } = validationResult.data

    // Fetch messages with pagination
    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: {
          agentId,
        },
        orderBy: {
          createdAt: "asc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.message.count({
        where: {
          agentId,
        },
      }),
    ])

    console.log("[GET_MESSAGES_SUCCESS]", {
      userId: session.user.id,
      agentId,
      count: messages.length,
      total: totalCount,
      timestamp: new Date().toISOString(),
    })

    // Add rate limit headers to response
    const headers = getRateLimitHeaders(rateLimitResult)

    return NextResponse.json(
      {
        messages,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
      { headers }
    )
  } catch (error) {
    return handleApiError(error, "GET_MESSAGES")
  }
}

/**
 * POST /api/agents/[agentId]/messages
 * Send a message to a specific agent and get a role-aware response
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authenticationError(
        "Unauthorized",
        "You must be logged in to send messages"
      )
    }

    // Apply rate limiting for chat messages
    const rateLimitResult = applyRateLimit(
      `messages-post:${session.user.id}`,
      RATE_LIMITS.CHAT
    )

    if (!rateLimitResult.allowed) {
      const headers = getRateLimitHeaders(rateLimitResult)
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers,
      })
    }

    const { agentId } = await params
    const body = await request.json()

    // Validate message using Zod schema
    const validationResult = validateSchema(SendMessageSchema, body)

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

    const { message } = validationResult.data

    // Fetch agent with recent message history
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          take: 20, // Last 20 messages for context
        },
      },
    })

    if (!agent) {
      return notFoundError(
        "Agent",
        `No agent found with ID: ${agentId} for this user`
      )
    }

    // Save user message to database
    const userMessage = await prisma.message.create({
      data: {
        content: message,
        role: "user",
        agentId: agent.id,
      },
    })

    console.log("[MESSAGE_RECEIVED]", {
      userId: session.user.id,
      agentId: agent.id,
      messageId: userMessage.id,
      role: agent.role,
      timestamp: new Date().toISOString(),
    })

    // Try to use specialized agent class first
    const agentInstance = getAgentInstance(agent)

    let assistantResponse: string

    if (agentInstance) {
      // Use specialized agent class with role-specific behavior
      console.log("[USING_SPECIALIZED_AGENT]", {
        agentId: agent.id,
        role: agent.role,
      })

      // Convert message history to the format expected by BaseAgent
      const messageHistory = agent.messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }))

      const result = await agentInstance.execute(message, { messages: messageHistory })
      assistantResponse = result.result || ''
    } else {
      // Fallback to direct Claude API call with role-specific system prompt
      console.log("[USING_DIRECT_API]", {
        agentId: agent.id,
        role: agent.role,
      })

      const systemPrompt = getRoleSystemPrompt(agent.role || 'executor', agent.personality)

      // Prepare conversation history
      const conversationHistory = agent.messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }))

      conversationHistory.push({
        role: "user",
        content: message,
      })

      const response = await anthropic.messages.create({
        model: agent.model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: conversationHistory,
      })

      assistantResponse =
        response.content[0].type === "text" ? response.content[0].text : ""
    }

    // Save assistant response to database
    const assistantMessage = await prisma.message.create({
      data: {
        content: assistantResponse,
        role: "assistant",
        agentId: agent.id,
      },
    })

    console.log("[MESSAGE_SENT]", {
      userId: session.user.id,
      agentId: agent.id,
      messageId: assistantMessage.id,
      responseLength: assistantResponse.length,
      timestamp: new Date().toISOString(),
    })

    // Add rate limit headers to response
    const headers = getRateLimitHeaders(rateLimitResult)

    return NextResponse.json(
      {
        userMessage,
        assistantMessage,
        response: assistantResponse,
      },
      { headers }
    )
  } catch (error) {
    return handleApiError(error, "SEND_MESSAGE")
  }
}
