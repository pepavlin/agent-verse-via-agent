import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/analytics/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      findMany: vi.fn(),
    },
    task: {
      groupBy: vi.fn(),
    },
    workflowExecution: {
      findMany: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
  },
}))

describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return analytics data with correct summary', async () => {
    vi.mocked(prisma.agent.findMany).mockResolvedValue([
      {
        id: 'agent-1',
        name: 'Research Agent',
        model: 'claude-3-5-sonnet-20241022',
        role: 'researcher',
        userId: 'fake-user',
        description: null,
        personality: null,
        specialization: null,
        departmentId: null,
        color: '#a855f7',
        size: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { messages: 5, tasksAssigned: 2 },
        messages: [
          { content: 'hello world', role: 'user' },
          { content: 'response text here', role: 'assistant' },
        ],
        tasksAssigned: [{ status: 'completed' }, { status: 'pending' }],
      },
    ] as never)

    vi.mocked(prisma.task.groupBy).mockResolvedValue([
      { status: 'completed', _count: { status: 2 } },
      { status: 'pending', _count: { status: 1 } },
    ] as never)

    vi.mocked(prisma.workflowExecution.findMany).mockResolvedValue([
      { status: 'completed', executionTime: 2000, createdAt: new Date() },
      { status: 'failed', executionTime: null, createdAt: new Date() },
    ] as never)

    vi.mocked(prisma.message.findMany).mockResolvedValue([
      { createdAt: new Date() },
      { createdAt: new Date() },
    ] as never)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.summary.totalAgents).toBe(1)
    expect(data.summary.totalMessages).toBe(5)
    expect(data.summary.totalTasks).toBe(3)
    expect(data.summary.completedTasks).toBe(2)
    expect(data.summary.taskSuccessRate).toBe(67)
  })

  it('should calculate estimated cost for agents', async () => {
    vi.mocked(prisma.agent.findMany).mockResolvedValue([
      {
        id: 'agent-1',
        name: 'Test Agent',
        model: 'claude-3-5-sonnet-20241022',
        role: null,
        userId: 'fake-user',
        description: null,
        personality: null,
        specialization: null,
        departmentId: null,
        color: '#a855f7',
        size: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { messages: 1, tasksAssigned: 0 },
        // 4000 chars = 1000 tokens, cost = 1000 * 0.000009 = $0.009
        messages: [{ content: 'a'.repeat(4000), role: 'assistant' }],
        tasksAssigned: [],
      },
    ] as never)

    vi.mocked(prisma.task.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.workflowExecution.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.message.findMany).mockResolvedValue([] as never)

    const response = await GET()
    const data = await response.json()

    expect(data.agents[0].estimatedTokens).toBe(1000)
    expect(data.agents[0].estimatedCostUSD).toBeCloseTo(0.009, 4)
    expect(data.summary.totalEstimatedCostUSD).toBeCloseTo(0.009, 4)
  })

  it('should return workflow statistics', async () => {
    vi.mocked(prisma.agent.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.task.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.workflowExecution.findMany).mockResolvedValue([
      { status: 'completed', executionTime: 1000, createdAt: new Date() },
      { status: 'completed', executionTime: 3000, createdAt: new Date() },
      { status: 'failed', executionTime: null, createdAt: new Date() },
    ] as never)
    vi.mocked(prisma.message.findMany).mockResolvedValue([] as never)

    const response = await GET()
    const data = await response.json()

    expect(data.workflows.total).toBe(3)
    expect(data.workflows.completed).toBe(2)
    expect(data.workflows.failed).toBe(1)
    expect(data.workflows.avgExecutionTimeMs).toBe(2000)
    expect(data.workflows.successRate).toBe(67)
  })

  it('should return 7 days of daily activity', async () => {
    vi.mocked(prisma.agent.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.task.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.workflowExecution.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.message.findMany).mockResolvedValue([] as never)

    const response = await GET()
    const data = await response.json()

    expect(data.dailyActivity).toHaveLength(7)
    expect(data.dailyActivity[0]).toHaveProperty('date')
    expect(data.dailyActivity[0]).toHaveProperty('count')
  })

  it('should handle empty data gracefully', async () => {
    vi.mocked(prisma.agent.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.task.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.workflowExecution.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.message.findMany).mockResolvedValue([] as never)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.summary.totalAgents).toBe(0)
    expect(data.summary.totalMessages).toBe(0)
    expect(data.summary.taskSuccessRate).toBe(0)
    expect(data.summary.totalEstimatedCostUSD).toBe(0)
    expect(data.agents).toHaveLength(0)
    expect(data.workflows.successRate).toBe(0)
  })

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.agent.findMany).mockRejectedValue(new Error('DB connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error.type).toBe('INTERNAL_ERROR')
  })
})
