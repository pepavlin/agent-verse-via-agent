import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/error-handler"

// Cost per token estimates for Claude models (USD)
const MODEL_COST_PER_TOKEN: Record<string, number> = {
  "claude-3-5-sonnet-20241022": 0.000009, // avg of $3/M input + $15/M output
  "claude-3-opus-20240229": 0.0000375,    // avg of $15/M input + $75/M output
  "claude-3-haiku-20240307": 0.000000875, // avg of $0.25/M input + $1.25/M output
}

function getModelCostPerToken(model: string): number {
  for (const [key, cost] of Object.entries(MODEL_COST_PER_TOKEN)) {
    if (model.includes(key) || key.includes(model)) return cost
  }
  if (model.includes("opus")) return MODEL_COST_PER_TOKEN["claude-3-opus-20240229"]
  if (model.includes("haiku")) return MODEL_COST_PER_TOKEN["claude-3-haiku-20240307"]
  return MODEL_COST_PER_TOKEN["claude-3-5-sonnet-20241022"]
}

export async function GET() {
  try {
    const fakeUserId = "fake-user"

    // Fetch all agents with message counts and task stats
    const agents = await prisma.agent.findMany({
      where: { userId: fakeUserId },
      include: {
        _count: { select: { messages: true, tasksAssigned: true } },
        messages: { select: { content: true, role: true } },
        tasksAssigned: { select: { status: true } },
      },
    })

    // Fetch task status breakdown
    const taskStatusGroups = await prisma.task.groupBy({
      by: ["status"],
      _count: { status: true },
    })

    // Fetch workflow execution stats
    const workflows = await prisma.workflowExecution.findMany({
      where: { userId: fakeUserId },
      select: { status: true, executionTime: true, createdAt: true },
    })

    // Fetch message counts per day for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentMessages = await prisma.message.findMany({
      where: {
        agent: { userId: fakeUserId },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    // Build per-agent analytics
    const agentStats = agents.map((agent) => {
      const totalChars = agent.messages.reduce((sum, m) => sum + m.content.length, 0)
      const estimatedTokens = Math.round(totalChars / 4)
      const costPerToken = getModelCostPerToken(agent.model)
      const estimatedCostUSD = estimatedTokens * costPerToken
      const completedTasks = agent.tasksAssigned.filter((t) => t.status === "completed").length
      const failedTasks = agent.tasksAssigned.filter((t) => t.status === "failed").length

      return {
        id: agent.id,
        name: agent.name,
        model: agent.model,
        role: agent.role,
        messageCount: agent._count.messages,
        tasksAssigned: agent._count.tasksAssigned,
        tasksCompleted: completedTasks,
        tasksFailed: failedTasks,
        estimatedTokens,
        estimatedCostUSD: Math.round(estimatedCostUSD * 10000) / 10000,
      }
    })

    // Build task status map
    const tasksByStatus: Record<string, number> = {}
    for (const group of taskStatusGroups) {
      tasksByStatus[group.status] = group._count.status
    }

    // Workflow summary
    const totalWorkflows = workflows.length
    const completedWorkflows = workflows.filter((w) => w.status === "completed").length
    const failedWorkflows = workflows.filter((w) => w.status === "failed").length
    const workflowsWithTime = workflows.filter((w) => w.executionTime != null)
    const avgExecutionTimeMs =
      workflowsWithTime.length > 0
        ? Math.round(
            workflowsWithTime.reduce((sum, w) => sum + (w.executionTime ?? 0), 0) /
              workflowsWithTime.length
          )
        : 0

    // Build daily message activity (last 7 days)
    const dailyActivity: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dailyActivity[d.toISOString().slice(0, 10)] = 0
    }
    for (const msg of recentMessages) {
      const day = msg.createdAt.toISOString().slice(0, 10)
      if (day in dailyActivity) {
        dailyActivity[day]++
      }
    }

    // Overall summary
    const totalMessages = agentStats.reduce((sum, a) => sum + a.messageCount, 0)
    const totalTasks = Object.values(tasksByStatus).reduce((sum, v) => sum + v, 0)
    const completedTasks = tasksByStatus["completed"] ?? 0
    const failedTasks = tasksByStatus["failed"] ?? 0
    const totalEstimatedCostUSD =
      Math.round(agentStats.reduce((sum, a) => sum + a.estimatedCostUSD, 0) * 10000) / 10000

    return NextResponse.json({
      summary: {
        totalAgents: agents.length,
        totalMessages,
        totalTasks,
        totalWorkflows,
        completedTasks,
        failedTasks,
        taskSuccessRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalEstimatedCostUSD,
      },
      agents: agentStats,
      tasksByStatus,
      workflows: {
        total: totalWorkflows,
        completed: completedWorkflows,
        failed: failedWorkflows,
        avgExecutionTimeMs,
        successRate:
          totalWorkflows > 0 ? Math.round((completedWorkflows / totalWorkflows) * 100) : 0,
      },
      dailyActivity: Object.entries(dailyActivity).map(([date, count]) => ({ date, count })),
    })
  } catch (error) {
    return handleApiError(error, "ANALYTICS_GET")
  }
}
