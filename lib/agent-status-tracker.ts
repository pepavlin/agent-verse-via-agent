/**
 * Agent Status Tracker
 * In-memory tracking of agent states and metrics for the status dashboard
 */

export type AgentState = 'idle' | 'thinking' | 'communicating' | 'error'

export interface AgentStatusMetrics {
  agentId: string
  agentName: string
  state: AgentState
  currentTask?: string
  lastActivity: Date
  metrics: {
    totalTasks: number
    completedTasks: number
    failedTasks: number
    averageResponseTime: number // in milliseconds
    lastResponseTime?: number
    errorRate: number // percentage
  }
  errors: ErrorLog[]
}

export interface ErrorLog {
  id: string
  timestamp: Date
  message: string
  details?: string
  taskId?: string
}

export interface PerformanceDataPoint {
  timestamp: Date
  responseTime: number
  success: boolean
}

class AgentStatusTrackerClass {
  private agentStates: Map<string, AgentState> = new Map()
  private agentMetrics: Map<string, AgentStatusMetrics> = new Map()
  private performanceHistory: Map<string, PerformanceDataPoint[]> = new Map()
  private readonly MAX_HISTORY_POINTS = 100
  private readonly MAX_ERROR_LOGS = 50

  /**
   * Update agent state
   */
  updateState(agentId: string, agentName: string, state: AgentState, currentTask?: string): void {
    this.agentStates.set(agentId, state)
    
    const existing = this.agentMetrics.get(agentId)
    if (existing) {
      existing.state = state
      existing.currentTask = currentTask
      existing.lastActivity = new Date()
    } else {
      this.agentMetrics.set(agentId, {
        agentId,
        agentName,
        state,
        currentTask,
        lastActivity: new Date(),
        metrics: {
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          averageResponseTime: 0,
          errorRate: 0,
        },
        errors: [],
      })
    }
  }

  /**
   * Record task execution
   */
  recordTaskExecution(
    agentId: string,
    agentName: string,
    success: boolean,
    executionTime: number,
    error?: { message: string; details?: string; taskId?: string }
  ): void {
    let metrics = this.agentMetrics.get(agentId)
    if (!metrics) {
      metrics = {
        agentId,
        agentName,
        state: 'idle',
        lastActivity: new Date(),
        metrics: {
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          averageResponseTime: 0,
          errorRate: 0,
        },
        errors: [],
      }
      this.agentMetrics.set(agentId, metrics)
    }

    // Update task counters
    metrics.metrics.totalTasks++
    if (success) {
      metrics.metrics.completedTasks++
    } else {
      metrics.metrics.failedTasks++
    }

    // Update average response time
    const totalCompletedTasks = metrics.metrics.completedTasks
    if (totalCompletedTasks > 0) {
      metrics.metrics.averageResponseTime =
        (metrics.metrics.averageResponseTime * (totalCompletedTasks - 1) + executionTime) /
        totalCompletedTasks
    }
    metrics.metrics.lastResponseTime = executionTime

    // Update error rate
    metrics.metrics.errorRate =
      metrics.metrics.totalTasks > 0
        ? (metrics.metrics.failedTasks / metrics.metrics.totalTasks) * 100
        : 0

    // Record error if failed
    if (!success && error) {
      const errorLog: ErrorLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        message: error.message,
        details: error.details,
        taskId: error.taskId,
      }
      metrics.errors.unshift(errorLog)
      
      // Keep only last MAX_ERROR_LOGS errors
      if (metrics.errors.length > this.MAX_ERROR_LOGS) {
        metrics.errors = metrics.errors.slice(0, this.MAX_ERROR_LOGS)
      }
    }

    // Update performance history
    const history = this.performanceHistory.get(agentId) || []
    history.push({
      timestamp: new Date(),
      responseTime: executionTime,
      success,
    })
    
    // Keep only last MAX_HISTORY_POINTS
    if (history.length > this.MAX_HISTORY_POINTS) {
      history.shift()
    }
    this.performanceHistory.set(agentId, history)

    // Update state back to idle after task
    this.agentStates.set(agentId, success ? 'idle' : 'error')
    metrics.state = success ? 'idle' : 'error'
    metrics.lastActivity = new Date()
  }

  /**
   * Get status for a specific agent
   */
  getAgentStatus(agentId: string): AgentStatusMetrics | undefined {
    return this.agentMetrics.get(agentId)
  }

  /**
   * Get status for all agents
   */
  getAllAgentStatus(): AgentStatusMetrics[] {
    return Array.from(this.agentMetrics.values())
  }

  /**
   * Get performance history for an agent
   */
  getPerformanceHistory(agentId: string): PerformanceDataPoint[] {
    return this.performanceHistory.get(agentId) || []
  }

  /**
   * Get aggregated system metrics
   */
  getSystemMetrics() {
    const allAgents = this.getAllAgentStatus()
    
    const totalTasks = allAgents.reduce((sum, agent) => sum + agent.metrics.totalTasks, 0)
    const totalCompleted = allAgents.reduce((sum, agent) => sum + agent.metrics.completedTasks, 0)
    const totalFailed = allAgents.reduce((sum, agent) => sum + agent.metrics.failedTasks, 0)
    
    const avgResponseTime =
      allAgents.length > 0
        ? allAgents.reduce((sum, agent) => sum + agent.metrics.averageResponseTime, 0) / allAgents.length
        : 0

    const activeAgents = allAgents.filter(
      (agent) => agent.state === 'thinking' || agent.state === 'communicating'
    ).length

    const erroredAgents = allAgents.filter((agent) => agent.state === 'error').length

    return {
      totalAgents: allAgents.length,
      activeAgents,
      idleAgents: allAgents.length - activeAgents - erroredAgents,
      erroredAgents,
      totalTasks,
      completedTasks: totalCompleted,
      failedTasks: totalFailed,
      averageResponseTime: avgResponseTime,
      systemErrorRate: totalTasks > 0 ? (totalFailed / totalTasks) * 100 : 0,
    }
  }

  /**
   * Clear all tracking data
   */
  clear(): void {
    this.agentStates.clear()
    this.agentMetrics.clear()
    this.performanceHistory.clear()
  }

  /**
   * Clear data for a specific agent
   */
  clearAgent(agentId: string): void {
    this.agentStates.delete(agentId)
    this.agentMetrics.delete(agentId)
    this.performanceHistory.delete(agentId)
  }
}

// Export singleton instance
export const AgentStatusTracker = new AgentStatusTrackerClass()
