import { describe, it, expect } from "vitest"
import { MetricsService } from "@/lib/metrics-service"

/**
 * Unit tests for MetricsService
 * Tests metric calculations and aggregations
 */

describe("MetricsService", () => {
  describe("calculateMetricsSummary", () => {
    it("should calculate summary for empty metrics", () => {
      // Using private method through type casting for testing
      const summary = (MetricsService as any).calculateMetricsSummary([])
      
      expect(summary.totalExecutions).toBe(0)
      expect(summary.successfulExecutions).toBe(0)
      expect(summary.failedExecutions).toBe(0)
      expect(summary.successRate).toBe(0)
      expect(summary.averageLatency).toBe(0)
      expect(summary.totalCost).toBe(0)
    })

    it("should calculate summary for successful executions", () => {
      const metrics = [
        { success: true, executionTime: 1000, estimatedCost: 10, totalTokens: 100 },
        { success: true, executionTime: 2000, estimatedCost: 20, totalTokens: 200 },
        { success: true, executionTime: 3000, estimatedCost: 30, totalTokens: 300 },
      ]
      
      const summary = (MetricsService as any).calculateMetricsSummary(metrics)
      
      expect(summary.totalExecutions).toBe(3)
      expect(summary.successfulExecutions).toBe(3)
      expect(summary.failedExecutions).toBe(0)
      expect(summary.successRate).toBe(100)
      expect(summary.averageLatency).toBe(2000)
      expect(summary.totalCost).toBe(60)
      expect(summary.totalTokens).toBe(600)
      expect(summary.averageTokensPerExecution).toBe(200)
    })

    it("should calculate summary with mixed success/failure", () => {
      const metrics = [
        { success: true, executionTime: 1000, estimatedCost: 10, totalTokens: 100 },
        { success: false, executionTime: 500, estimatedCost: 5, totalTokens: 50 },
        { success: true, executionTime: 1500, estimatedCost: 15, totalTokens: 150 },
        { success: false, executionTime: 300, estimatedCost: 3, totalTokens: 30 },
      ]
      
      const summary = (MetricsService as any).calculateMetricsSummary(metrics)
      
      expect(summary.totalExecutions).toBe(4)
      expect(summary.successfulExecutions).toBe(2)
      expect(summary.failedExecutions).toBe(2)
      expect(summary.successRate).toBe(50)
      expect(summary.averageLatency).toBe(825)
      expect(summary.totalCost).toBe(33)
      expect(summary.totalTokens).toBe(330)
    })

    it("should handle null costs and tokens", () => {
      const metrics = [
        { success: true, executionTime: 1000, estimatedCost: null, totalTokens: null },
        { success: true, executionTime: 2000, estimatedCost: 10, totalTokens: 100 },
      ]
      
      const summary = (MetricsService as any).calculateMetricsSummary(metrics)
      
      expect(summary.totalExecutions).toBe(2)
      expect(summary.totalCost).toBe(10)
      expect(summary.totalTokens).toBe(100)
    })

    it("should calculate correct success rate percentages", () => {
      // Test 75% success rate
      const metrics = [
        { success: true, executionTime: 1000, estimatedCost: 10, totalTokens: 100 },
        { success: true, executionTime: 1000, estimatedCost: 10, totalTokens: 100 },
        { success: true, executionTime: 1000, estimatedCost: 10, totalTokens: 100 },
        { success: false, executionTime: 1000, estimatedCost: 10, totalTokens: 100 },
      ]
      
      const summary = (MetricsService as any).calculateMetricsSummary(metrics)
      
      expect(summary.successRate).toBe(75)
    })
  })

  describe("groupByTimeInterval", () => {
    it("should group metrics by day", () => {
      const metrics = [
        { 
          createdAt: new Date('2026-02-15T10:00:00Z'),
          success: true,
          executionTime: 1000,
          estimatedCost: 10,
          totalTokens: 100
        },
        { 
          createdAt: new Date('2026-02-15T15:00:00Z'),
          success: true,
          executionTime: 2000,
          estimatedCost: 20,
          totalTokens: 200
        },
        { 
          createdAt: new Date('2026-02-16T10:00:00Z'),
          success: false,
          executionTime: 500,
          estimatedCost: 5,
          totalTokens: 50
        },
      ]
      
      const grouped = (MetricsService as any).groupByTimeInterval(metrics, 'day')
      
      expect(grouped.length).toBe(2)
      expect(grouped[0].totalExecutions).toBe(2)
      expect(grouped[1].totalExecutions).toBe(1)
    })

    it("should properly format dates with leading zeros", () => {
      const metrics = [
        { 
          createdAt: new Date('2026-01-05T10:00:00Z'),
          success: true,
          executionTime: 1000,
          estimatedCost: 10,
          totalTokens: 100
        },
      ]
      
      const grouped = (MetricsService as any).groupByTimeInterval(metrics, 'day')
      
      // Verify date format has leading zeros
      expect(grouped[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(grouped[0].timestamp).toBe('2026-01-05')
    })

    it("should sort time-series data chronologically", () => {
      const metrics = [
        { 
          createdAt: new Date('2026-02-16T10:00:00Z'),
          success: true,
          executionTime: 1000,
          estimatedCost: 10,
          totalTokens: 100
        },
        { 
          createdAt: new Date('2026-02-15T10:00:00Z'),
          success: true,
          executionTime: 1000,
          estimatedCost: 10,
          totalTokens: 100
        },
        { 
          createdAt: new Date('2026-02-17T10:00:00Z'),
          success: true,
          executionTime: 1000,
          estimatedCost: 10,
          totalTokens: 100
        },
      ]
      
      const grouped = (MetricsService as any).groupByTimeInterval(metrics, 'day')
      
      // Check that timestamps are in ascending order
      for (let i = 1; i < grouped.length; i++) {
        expect(grouped[i].timestamp >= grouped[i-1].timestamp).toBe(true)
      }
    })
  })
})
