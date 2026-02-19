/**
 * Utility functions for tracking agent metrics and status
 */

import { prisma } from './prisma'

export type AgentStatusType = 'idle' | 'thinking' | 'communicating' | 'error'
export type ErrorType = 'execution_error' | 'timeout' | 'api_error' | 'validation_error'

/**
 * Log a status change for an agent
 */
export async function logAgentStatus(
  agentId: string,
  status: AgentStatusType,
  details?: string,
  taskId?: string,
  workflowId?: string
) {
  try {
    await prisma.agentStatusLog.create({
      data: {
        agentId,
        status,
        details,
        taskId,
        workflowId,
        timestamp: new Date(),
      },
    })
  } catch (error) {
    console.error('[METRICS_TRACKER] Failed to log agent status:', error)
  }
}

/**
 * Update status log with end time and duration
 */
export async function updateStatusLogEnd(logId: string, endTime: Date) {
  try {
    const log = await prisma.agentStatusLog.findUnique({
      where: { id: logId },
    })

    if (log) {
      const duration = endTime.getTime() - log.timestamp.getTime()
      await prisma.agentStatusLog.update({
        where: { id: logId },
        data: {
          endTime,
          duration,
        },
      })
    }
  } catch (error) {
    console.error('[METRICS_TRACKER] Failed to update status log:', error)
  }
}

/**
 * Log an error
 */
export async function logError(
  agentId: string,
  agentName: string,
  errorType: ErrorType,
  errorMessage: string,
  options?: {
    stackTrace?: string
    context?: Record<string, unknown>
    taskId?: string
    workflowId?: string
  }
) {
  try {
    await prisma.errorLog.create({
      data: {
        agentId,
        agentName,
        errorType,
        errorMessage,
        stackTrace: options?.stackTrace,
        context: options?.context ? JSON.stringify(options.context) : null,
        taskId: options?.taskId,
        workflowId: options?.workflowId,
        timestamp: new Date(),
      },
    })
  } catch (error) {
    console.error('[METRICS_TRACKER] Failed to log error:', error)
  }
}

/**
 * Record agent execution metrics
 */
export async function recordExecution(
  agentId: string,
  success: boolean,
  responseTimeMs: number
) {
  try {
    // Get current hour period
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
    const periodEnd = new Date(periodStart.getTime() + 60 * 60 * 1000)

    // Try to find existing metrics for this period
    const existingMetrics = await prisma.agentMetrics.findFirst({
      where: {
        agentId,
        periodType: 'hourly',
        periodStart,
      },
    })

    if (existingMetrics) {
      // Update existing metrics
      await prisma.agentMetrics.update({
        where: { id: existingMetrics.id },
        data: {
          totalExecutions: existingMetrics.totalExecutions + 1,
          successfulExecs: existingMetrics.successfulExecs + (success ? 1 : 0),
          failedExecs: existingMetrics.failedExecs + (success ? 0 : 1),
          // Calculate running average response time
          responseTimeMs: Math.round(
            (existingMetrics.responseTimeMs || 0) * existingMetrics.totalExecutions + responseTimeMs
          ) / (existingMetrics.totalExecutions + 1),
          timestamp: new Date(),
        },
      })
    } else {
      // Create new metrics
      await prisma.agentMetrics.create({
        data: {
          agentId,
          responseTimeMs,
          totalExecutions: 1,
          successfulExecs: success ? 1 : 0,
          failedExecs: success ? 0 : 1,
          periodType: 'hourly',
          periodStart,
          periodEnd,
          timestamp: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('[METRICS_TRACKER] Failed to record execution:', error)
  }
}

/**
 * Increment task completed count
 */
export async function incrementTaskCompleted(agentId: string) {
  try {
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

    const existingMetrics = await prisma.agentMetrics.findFirst({
      where: {
        agentId,
        periodType: 'hourly',
        periodStart,
      },
    })

    if (existingMetrics) {
      await prisma.agentMetrics.update({
        where: { id: existingMetrics.id },
        data: {
          tasksCompleted: existingMetrics.tasksCompleted + 1,
          timestamp: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('[METRICS_TRACKER] Failed to increment task count:', error)
  }
}

/**
 * Increment messages processed count
 */
export async function incrementMessagesProcessed(agentId: string, count: number = 1) {
  try {
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

    const existingMetrics = await prisma.agentMetrics.findFirst({
      where: {
        agentId,
        periodType: 'hourly',
        periodStart,
      },
    })

    if (existingMetrics) {
      await prisma.agentMetrics.update({
        where: { id: existingMetrics.id },
        data: {
          messagesProcessed: existingMetrics.messagesProcessed + count,
          timestamp: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('[METRICS_TRACKER] Failed to increment message count:', error)
  }
}

/**
 * Mark an error as resolved
 */
export async function resolveError(errorId: string) {
  try {
    await prisma.errorLog.update({
      where: { id: errorId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('[METRICS_TRACKER] Failed to resolve error:', error)
  }
}
