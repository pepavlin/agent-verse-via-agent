import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/analytics/route'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      findMany: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
    workflowExecution: {
      findMany: vi.fn(),
    },
  },
}))

const mockAgents = [
  {
    id: 'agent-1',
    name: 'Research Agent',
    role: 'researcher',
    model: 'claude-3-5-sonnet-20241022',
    userId: 'fake-user',
    _count: { messages: 3, tasksAssigned: 2 },
  },
]

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hello, can you research this topic?',
    role: 'user',
    agentId: 'agent-1',
    createdAt: new Date('2026-02-15T10:00:00Z'),
  },
  {
    id: 'msg-2',
    content: 'Sure, I found the following information about the topic.',
    role: 'assistant',
    agentId: 'agent-1',
    createdAt: new Date('2026-02-15T10:01:00Z'),
  },
]

const mockTasks = [
  {
    id: 'task-1',
    status: 'completed',
    priority: 'high',
    assignedTo: 'agent-1',
    createdAt: new Date('2026-02-15T09:00:00Z'),
    completedAt: new Date('2026-02-15T09:05:00Z'),
  },
  {
    id: 'task-2',
    status: 'failed',
    priority: 'medium',
    assignedTo: 'agent-1',
    createdAt: new Date('2026-02-15T09:10:00Z'),
    completedAt: null,
  },
]

const mockWorkflows = [
  {
    id: 'wf-1',
    status: 'completed',
    executionTime: 8000,
    createdAt: new Date('2026-02-15T08:00:00Z'),
    completedAt: new Date('2026-02-15T08:00:08Z'),
  },
]

describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.agent.findMany).mockResolvedValue(mockAgents as never)
    vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages as never)
    vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never)
    vi.mocked(prisma.workflowExecution.findMany).mockResolvedValue(mockWorkflows as never)
  })

  it('returns analytics data with correct structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics?days=30')
    const response = await GET(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('summary')
    expect(data).toHaveProperty('agentMetrics')
    expect(data).toHaveProperty('dailyTrend')
  })

  it('summary contains expected fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics?days=30')
    const response = await GET(request)
    const data = await response.json()

    const { summary } = data
    expect(summary.totalAgents).toBe(1)
    expect(summary.totalMessages).toBe(2)
    expect(summary.totalTasks).toBe(2)
    expect(summary.completedTasks).toBe(1)
    expect(summary.failedTasks).toBe(1)
    expect(summary.totalWorkflows).toBe(1)
    expect(summary.periodDays).toBe(30)
  })

  it('calculates per-agent metrics correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics?days=30')
    const response = await GET(request)
    const data = await response.json()

    expect(data.agentMetrics).toHaveLength(1)
    const agent = data.agentMetrics[0]
    expect(agent.id).toBe('agent-1')
    expect(agent.name).toBe('Research Agent')
    expect(agent.messageCount).toBe(2)
    expect(agent.taskCount).toBe(2)
    expect(agent.completedTasks).toBe(1)
    expect(agent.failedTasks).toBe(1)
    expect(agent.successRate).toBeCloseTo(50)
    expect(agent.estimatedCost).toBeGreaterThan(0)
    expect(agent.totalTokens).toBeGreaterThan(0)
  })

  it('daily trend has one entry per day', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics?days=7')
    const response = await GET(request)
    const data = await response.json()

    expect(data.dailyTrend).toHaveLength(7)
    data.dailyTrend.forEach((entry: { date: string; messages: number; cost: number }) => {
      expect(entry).toHaveProperty('date')
      expect(entry).toHaveProperty('messages')
      expect(entry).toHaveProperty('cost')
    })
  })

  it('uses default 30 days when no days param provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics')
    const response = await GET(request)
    const data = await response.json()

    expect(data.summary.periodDays).toBe(30)
  })

  it('falls back to mock data when database throws', async () => {
    vi.mocked(prisma.agent.findMany).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost:3000/api/analytics?days=30')
    const response = await GET(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('summary')
    expect(data).toHaveProperty('agentMetrics')
    expect(data.summary.totalAgents).toBeGreaterThan(0)
  })

  it('overall success rate is null when no tasks exist', async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValue([])
    const request = new NextRequest('http://localhost:3000/api/analytics?days=30')
    const response = await GET(request)
    const data = await response.json()

    expect(data.summary.overallSuccessRate).toBeNull()
  })

  it('workflow success rate is null when no workflows exist', async () => {
    vi.mocked(prisma.workflowExecution.findMany).mockResolvedValue([])
    const request = new NextRequest('http://localhost:3000/api/analytics?days=30')
    const response = await GET(request)
    const data = await response.json()

    expect(data.summary.workflowSuccessRate).toBeNull()
    expect(data.summary.avgWorkflowTimeMs).toBeNull()
  })
})
