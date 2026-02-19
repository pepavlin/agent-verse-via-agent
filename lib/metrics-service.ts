import { prisma } from '@/lib/prisma'

/**
 * Cost estimation based on Claude model pricing (per 1M tokens)
 * Prices in USD cents per 1K tokens
 * Source: https://www.anthropic.com/pricing (as of 2024)
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Claude 3.5 Sonnet
  'claude-3-5-sonnet-20241022': {
    input: 0.3, // $3 per 1M tokens = $0.003 per 1K = 0.3 cents per 1K
    output: 1.5, // $15 per 1M tokens = $0.015 per 1K = 1.5 cents per 1K
  },
  'claude-3-5-sonnet-20240620': {
    input: 0.3,
    output: 1.5,
  },
  // Claude 3 Opus
  'claude-3-opus-20240229': {
    input: 1.5, // $15 per 1M tokens
    output: 7.5, // $75 per 1M tokens
  },
  // Claude 3 Haiku
  'claude-3-haiku-20240307': {
    input: 0.025, // $0.25 per 1M tokens
    output: 0.125, // $1.25 per 1M tokens
  },
}

/**
 * Estimate cost based on token usage and model
 * @returns Cost in cents
 */
function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-3-5-sonnet-20241022']
  
  // Calculate cost per 1K tokens, then convert to cents
  const inputCost = (inputTokens / 1000) * pricing.input
  const outputCost = (outputTokens / 1000) * pricing.output
  
  return Math.round((inputCost + outputCost) * 100) / 100 // Round to 2 decimal places
}

export interface MetricData {
  agentId: string
  agentName: string
  agentRole?: string | null
  userId: string
  operationType: 'execute' | 'pipeline' | 'parallel' | 'workflow'
  taskId?: string
  workflowId?: string
  success: boolean
  executionTime: number
  inputTokens?: number
  outputTokens?: number
  model: string
  errorType?: string
  errorMessage?: string
  createdAt?: Date
  completedAt?: Date
}

/**
 * MetricsService - Centralized service for tracking agent performance metrics
 */
export class MetricsService {
  /**
   * Record a metric for an agent execution
   */
  static async recordMetric(data: MetricData): Promise<void> {
    try {
      const totalTokens = (data.inputTokens || 0) + (data.outputTokens || 0)
      const estimatedCost = data.inputTokens && data.outputTokens
        ? estimateCost(data.model, data.inputTokens, data.outputTokens)
        : null

      await prisma.agentMetric.create({
        data: {
          agentId: data.agentId,
          agentName: data.agentName,
          agentRole: data.agentRole,
          userId: data.userId,
          operationType: data.operationType,
          taskId: data.taskId,
          workflowId: data.workflowId,
          success: data.success,
          executionTime: data.executionTime,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalTokens: totalTokens || null,
          estimatedCost: estimatedCost,
          model: data.model,
          errorType: data.errorType,
          errorMessage: data.errorMessage,
          createdAt: data.createdAt || new Date(),
          completedAt: data.completedAt || new Date(),
        },
      })
    } catch (error) {
      // Log error but don't throw to avoid breaking agent execution
      console.error('Failed to record metric:', error)
    }
  }

  /**
   * Get metrics summary for an agent
   */
  static async getAgentMetrics(
    agentId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: {
      agentId: string
      createdAt?: { gte?: Date; lte?: Date }
    } = { agentId }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const metrics = await prisma.agentMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return this.calculateMetricsSummary(metrics)
  }

  /**
   * Get metrics summary for a user (all their agents)
   */
  static async getUserMetrics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: {
      userId: string
      createdAt?: { gte?: Date; lte?: Date }
    } = { userId }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const metrics = await prisma.agentMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return this.calculateMetricsSummary(metrics)
  }

  /**
   * Get metrics grouped by agent for comparison
   */
  static async getAgentComparison(userId: string, startDate?: Date, endDate?: Date) {
    const where: {
      userId: string
      createdAt?: { gte?: Date; lte?: Date }
    } = { userId }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const metrics = await prisma.agentMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Group by agent
    const agentGroups = metrics.reduce((acc, metric) => {
      if (!acc[metric.agentId]) {
        acc[metric.agentId] = []
      }
      acc[metric.agentId].push(metric)
      return acc
    }, {} as Record<string, typeof metrics>)

    // Calculate summary for each agent
    return Object.entries(agentGroups).map(([agentId, agentMetrics]) => ({
      agentId,
      agentName: agentMetrics[0].agentName,
      agentRole: agentMetrics[0].agentRole,
      ...this.calculateMetricsSummary(agentMetrics),
    }))
  }

  /**
   * Get time-series data for charts
   */
  static async getTimeSeriesData(
    userId: string,
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' | 'week' = 'day'
  ) {
    const metrics = await prisma.agentMetric.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by time interval
    return this.groupByTimeInterval(metrics, interval)
  }

  /**
   * Calculate summary statistics from metrics
   */
  private static calculateMetricsSummary(metrics: Array<{
    success: boolean
    executionTime: number
    estimatedCost?: number | null
    totalTokens?: number | null
  }>) {
    if (metrics.length === 0) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        averageLatency: 0,
        totalCost: 0,
        totalTokens: 0,
        averageTokensPerExecution: 0,
      }
    }

    const successfulExecutions = metrics.filter(m => m.success).length
    const failedExecutions = metrics.length - successfulExecutions
    const successRate = (successfulExecutions / metrics.length) * 100

    const totalLatency = metrics.reduce((sum, m) => sum + m.executionTime, 0)
    const averageLatency = totalLatency / metrics.length

    const totalCost = metrics.reduce((sum, m) => sum + (m.estimatedCost || 0), 0)
    const totalTokens = metrics.reduce((sum, m) => sum + (m.totalTokens || 0), 0)
    const averageTokensPerExecution = totalTokens / metrics.length

    return {
      totalExecutions: metrics.length,
      successfulExecutions,
      failedExecutions,
      successRate: Math.round(successRate * 100) / 100,
      averageLatency: Math.round(averageLatency),
      totalCost: Math.round(totalCost * 100) / 100,
      totalTokens,
      averageTokensPerExecution: Math.round(averageTokensPerExecution),
    }
  }

  /**
   * Group metrics by time interval for time-series charts
   */
  private static groupByTimeInterval(
    metrics: Array<{
      createdAt: Date
      success: boolean
      executionTime: number
      estimatedCost?: number | null
      totalTokens?: number | null
    }>,
    interval: 'hour' | 'day' | 'week'
  ) {
    const grouped: Record<string, typeof metrics> = {}

    metrics.forEach(metric => {
      const date = new Date(metric.createdAt)
      let key: string

      switch (interval) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:00`
          break
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`
          break
      }

      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(metric)
    })

    // Calculate summary for each interval
    return Object.entries(grouped)
      .map(([timestamp, intervalMetrics]) => ({
        timestamp,
        ...this.calculateMetricsSummary(intervalMetrics),
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  /**
   * Get error frequency by type
   */
  static async getErrorAnalysis(userId: string, startDate?: Date, endDate?: Date) {
    const where: {
      userId: string
      success: boolean
      createdAt?: { gte?: Date; lte?: Date }
    } = {
      userId,
      success: false,
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const errorMetrics = await prisma.agentMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Group by error type
    const errorGroups = errorMetrics.reduce((acc, metric) => {
      const errorType = metric.errorType || 'Unknown'
      if (!acc[errorType]) {
        acc[errorType] = {
          count: 0,
          examples: [] as Array<{
            message: string | null
            timestamp: Date
            agentName: string
          }>,
        }
      }
      acc[errorType].count++
      if (acc[errorType].examples.length < 3) {
        acc[errorType].examples.push({
          message: metric.errorMessage,
          timestamp: metric.createdAt,
          agentName: metric.agentName,
        })
      }
      return acc
    }, {} as Record<string, { count: number; examples: Array<{
      message: string | null
      timestamp: Date
      agentName: string
    }> }>)

    return Object.entries(errorGroups).map(([errorType, data]) => ({
      errorType,
      ...data,
    }))
  }
}
