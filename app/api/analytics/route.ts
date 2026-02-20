import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const FAKE_USER_ID = "fake-user"

// Estimated token cost per 1000 tokens (claude-3-5-sonnet)
const COST_PER_1K_INPUT_TOKENS = 0.003
const COST_PER_1K_OUTPUT_TOKENS = 0.015
// Average characters per token approximation
const CHARS_PER_TOKEN = 4

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1000) * COST_PER_1K_INPUT_TOKENS +
    (outputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30", 10)
    const since = new Date()
    since.setDate(since.getDate() - days)

    // Fetch agents for this user
    const agents = await prisma.agent.findMany({
      where: { userId: FAKE_USER_ID },
      include: {
        _count: { select: { messages: true, tasksAssigned: true } },
      },
    })

    // Fetch messages in time range with agent info
    const messages = await prisma.message.findMany({
      where: {
        agent: { userId: FAKE_USER_ID },
        createdAt: { gte: since },
      },
      select: {
        id: true,
        content: true,
        role: true,
        agentId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where: {
        assignedAgent: { userId: FAKE_USER_ID },
        createdAt: { gte: since },
      },
      select: {
        id: true,
        status: true,
        priority: true,
        assignedTo: true,
        createdAt: true,
        completedAt: true,
      },
    })

    // Fetch workflow executions
    const workflows = await prisma.workflowExecution.findMany({
      where: {
        userId: FAKE_USER_ID,
        createdAt: { gte: since },
      },
      select: {
        id: true,
        status: true,
        executionTime: true,
        createdAt: true,
        completedAt: true,
      },
    })

    // --- Per-agent metrics ---
    const agentMetrics = agents.map((agent) => {
      const agentMessages = messages.filter((m) => m.agentId === agent.id)
      const userMessages = agentMessages.filter((m) => m.role === "user")
      const assistantMessages = agentMessages.filter(
        (m) => m.role === "assistant"
      )
      const agentTasks = tasks.filter((t) => t.assignedTo === agent.id)
      const completedTasks = agentTasks.filter((t) => t.status === "completed")
      const failedTasks = agentTasks.filter((t) => t.status === "failed")

      const inputTokens = userMessages.reduce(
        (sum, m) => sum + estimateTokens(m.content),
        0
      )
      const outputTokens = assistantMessages.reduce(
        (sum, m) => sum + estimateTokens(m.content),
        0
      )
      const cost = estimateCost(inputTokens, outputTokens)
      const successRate =
        agentTasks.length > 0
          ? (completedTasks.length / agentTasks.length) * 100
          : null

      // Average latency from task completion times (ms)
      const completedWithTime = agentTasks.filter(
        (t) => t.completedAt && t.createdAt
      )
      const avgLatencyMs =
        completedWithTime.length > 0
          ? completedWithTime.reduce((sum, t) => {
              return (
                sum +
                (new Date(t.completedAt!).getTime() -
                  new Date(t.createdAt).getTime())
              )
            }, 0) / completedWithTime.length
          : null

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        model: agent.model,
        messageCount: agentMessages.length,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCost: cost,
        taskCount: agentTasks.length,
        completedTasks: completedTasks.length,
        failedTasks: failedTasks.length,
        successRate,
        avgLatencyMs,
      }
    })

    // --- Overall summary ---
    const totalMessages = messages.length
    const totalInputTokens = agentMetrics.reduce(
      (s, a) => s + a.inputTokens,
      0
    )
    const totalOutputTokens = agentMetrics.reduce(
      (s, a) => s + a.outputTokens,
      0
    )
    const totalCost = agentMetrics.reduce((s, a) => s + a.estimatedCost, 0)
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === "completed").length
    const failedTasks = tasks.filter((t) => t.status === "failed").length
    const overallSuccessRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : null

    const workflowSuccessRate =
      workflows.length > 0
        ? (workflows.filter((w) => w.status === "completed").length /
            workflows.length) *
          100
        : null
    const avgWorkflowTime =
      workflows.filter((w) => w.executionTime != null).length > 0
        ? workflows
            .filter((w) => w.executionTime != null)
            .reduce((s, w) => s + w.executionTime!, 0) /
          workflows.filter((w) => w.executionTime != null).length
        : null

    // --- Daily message trend ---
    const dailyMap: Record<string, { date: string; messages: number; cost: number }> =
      {}
    for (let i = 0; i < days; i++) {
      const d = new Date(since)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      dailyMap[key] = { date: key, messages: 0, cost: 0 }
    }
    messages.forEach((m) => {
      const key = new Date(m.createdAt).toISOString().slice(0, 10)
      if (dailyMap[key]) {
        dailyMap[key].messages += 1
        if (m.role === "user") {
          dailyMap[key].cost += estimateCost(estimateTokens(m.content), 0)
        } else if (m.role === "assistant") {
          dailyMap[key].cost += estimateCost(0, estimateTokens(m.content))
        }
      }
    })
    const dailyTrend = Object.values(dailyMap)

    return NextResponse.json({
      summary: {
        totalAgents: agents.length,
        totalMessages,
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        estimatedCost: totalCost,
        totalTasks,
        completedTasks,
        failedTasks,
        overallSuccessRate,
        totalWorkflows: workflows.length,
        workflowSuccessRate,
        avgWorkflowTimeMs: avgWorkflowTime,
        periodDays: days,
      },
      agentMetrics,
      dailyTrend,
    })
  } catch (error) {
    console.error("[ANALYTICS_GET_ERROR]", error)
    // Return mock data when database is unavailable
    return NextResponse.json(getMockAnalytics())
  }
}

function getMockAnalytics() {
  const days = 30
  const now = new Date()
  const dailyTrend = Array.from({ length: days }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (days - 1 - i))
    const messages = Math.floor(Math.random() * 20) + 2
    return {
      date: d.toISOString().slice(0, 10),
      messages,
      cost: parseFloat((messages * 0.002).toFixed(4)),
    }
  })

  return {
    summary: {
      totalAgents: 3,
      totalMessages: 142,
      totalInputTokens: 18500,
      totalOutputTokens: 42300,
      totalTokens: 60800,
      estimatedCost: 0.69,
      totalTasks: 24,
      completedTasks: 18,
      failedTasks: 2,
      overallSuccessRate: 75,
      totalWorkflows: 8,
      workflowSuccessRate: 87.5,
      avgWorkflowTimeMs: 12400,
      periodDays: days,
    },
    agentMetrics: [
      {
        id: "agent-1",
        name: "Research Agent",
        role: "researcher",
        model: "claude-3-5-sonnet-20241022",
        messageCount: 56,
        inputTokens: 7200,
        outputTokens: 18000,
        totalTokens: 25200,
        estimatedCost: 0.292,
        taskCount: 10,
        completedTasks: 8,
        failedTasks: 1,
        successRate: 80,
        avgLatencyMs: 8500,
      },
      {
        id: "agent-2",
        name: "Strategic Planner",
        role: "strategist",
        model: "claude-3-5-sonnet-20241022",
        messageCount: 48,
        inputTokens: 6100,
        outputTokens: 14300,
        totalTokens: 20400,
        estimatedCost: 0.233,
        taskCount: 8,
        completedTasks: 7,
        failedTasks: 0,
        successRate: 87.5,
        avgLatencyMs: 6200,
      },
      {
        id: "agent-3",
        name: "Idea Generator",
        role: "ideator",
        model: "claude-3-5-sonnet-20241022",
        messageCount: 38,
        inputTokens: 5200,
        outputTokens: 10000,
        totalTokens: 15200,
        estimatedCost: 0.166,
        taskCount: 6,
        completedTasks: 3,
        failedTasks: 1,
        successRate: 50,
        avgLatencyMs: 14200,
      },
    ],
    dailyTrend,
  }
}
