import { describe, it, expect, beforeEach } from "vitest"
import { getRateLimiter, RATE_LIMITS } from "@/lib/rate-limit"

/**
 * Unit tests for rate limiting functionality
 */

describe("Rate Limiting", () => {
  const limiter = getRateLimiter()

  beforeEach(() => {
    // Clear rate limits before each test
    limiter.clear()
  })

  describe("Basic Rate Limiting", () => {
    it("should allow requests within limit", () => {
      const identifier = "user:123"
      const maxRequests = 5
      const windowMs = 60000

      for (let i = 0; i < maxRequests; i++) {
        const result = limiter.check(identifier, maxRequests, windowMs)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(maxRequests - i - 1)
      }
    })

    it("should block requests exceeding limit", () => {
      const identifier = "user:456"
      const maxRequests = 3
      const windowMs = 60000

      // Make 3 allowed requests
      for (let i = 0; i < maxRequests; i++) {
        limiter.check(identifier, maxRequests, windowMs)
      }

      // 4th request should be blocked
      const result = limiter.check(identifier, maxRequests, windowMs)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("should track remaining requests correctly", () => {
      const identifier = "user:789"
      const maxRequests = 10
      const windowMs = 60000

      const result1 = limiter.check(identifier, maxRequests, windowMs)
      expect(result1.remaining).toBe(9)

      const result2 = limiter.check(identifier, maxRequests, windowMs)
      expect(result2.remaining).toBe(8)

      const result3 = limiter.check(identifier, maxRequests, windowMs)
      expect(result3.remaining).toBe(7)
    })
  })

  describe("Window Expiration", () => {
    it("should reset after window expires", async () => {
      const identifier = "user:reset"
      const maxRequests = 2
      const windowMs = 100 // 100ms window

      // Use up the limit
      limiter.check(identifier, maxRequests, windowMs)
      limiter.check(identifier, maxRequests, windowMs)

      const blockedResult = limiter.check(identifier, maxRequests, windowMs)
      expect(blockedResult.allowed).toBe(false)

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Should be allowed again
      const allowedResult = limiter.check(identifier, maxRequests, windowMs)
      expect(allowedResult.allowed).toBe(true)
      expect(allowedResult.remaining).toBe(maxRequests - 1)
    })
  })

  describe("Multiple Identifiers", () => {
    it("should track different identifiers independently", () => {
      const maxRequests = 3
      const windowMs = 60000

      const result1 = limiter.check("user:1", maxRequests, windowMs)
      const result2 = limiter.check("user:2", maxRequests, windowMs)
      const result3 = limiter.check("user:1", maxRequests, windowMs)

      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(2)

      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(2)

      expect(result3.allowed).toBe(true)
      expect(result3.remaining).toBe(1)
    })

    it("should not affect other users when one is rate limited", () => {
      const maxRequests = 2
      const windowMs = 60000

      // Block user 1
      limiter.check("user:1", maxRequests, windowMs)
      limiter.check("user:1", maxRequests, windowMs)
      const blocked = limiter.check("user:1", maxRequests, windowMs)
      expect(blocked.allowed).toBe(false)

      // User 2 should still be allowed
      const allowed = limiter.check("user:2", maxRequests, windowMs)
      expect(allowed.allowed).toBe(true)
    })
  })

  describe("Reset Time", () => {
    it("should provide correct reset time", () => {
      const identifier = "user:time"
      const windowMs = 60000
      const before = Date.now()

      const result = limiter.check(identifier, 5, windowMs)

      expect(result.resetTime).toBeGreaterThanOrEqual(before + windowMs)
      expect(result.resetTime).toBeLessThanOrEqual(Date.now() + windowMs + 10)
    })
  })

  describe("RATE_LIMITS Configuration", () => {
    it("should have chat rate limit configured", () => {
      expect(RATE_LIMITS.CHAT).toBeDefined()
      expect(RATE_LIMITS.CHAT.maxRequests).toBe(30)
      expect(RATE_LIMITS.CHAT.windowMs).toBe(60000)
    })

    it("should have agent creation rate limit configured", () => {
      expect(RATE_LIMITS.AGENT_CREATE).toBeDefined()
      expect(RATE_LIMITS.AGENT_CREATE.maxRequests).toBe(10)
      expect(RATE_LIMITS.AGENT_CREATE.windowMs).toBe(3600000)
    })

    it("should have agent list rate limit configured", () => {
      expect(RATE_LIMITS.AGENT_LIST).toBeDefined()
      expect(RATE_LIMITS.AGENT_LIST.maxRequests).toBe(60)
      expect(RATE_LIMITS.AGENT_LIST.windowMs).toBe(60000)
    })

    it("should have registration rate limit configured", () => {
      expect(RATE_LIMITS.REGISTER).toBeDefined()
      expect(RATE_LIMITS.REGISTER.maxRequests).toBe(5)
      expect(RATE_LIMITS.REGISTER.windowMs).toBe(3600000)
    })

    it("should have login rate limit configured", () => {
      expect(RATE_LIMITS.LOGIN).toBeDefined()
      expect(RATE_LIMITS.LOGIN.maxRequests).toBe(10)
      expect(RATE_LIMITS.LOGIN.windowMs).toBe(900000)
    })
  })

  describe("Edge Cases", () => {
    it("should handle zero max requests", () => {
      const result = limiter.check("user:zero", 0, 60000)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("should handle very large windows", () => {
      const result = limiter.check("user:large", 100, 24 * 60 * 60 * 1000)
      expect(result.allowed).toBe(true)
    })

    it("should handle rapid sequential requests", () => {
      const identifier = "user:rapid"
      const maxRequests = 10
      const windowMs = 60000

      const results = []
      for (let i = 0; i < 15; i++) {
        results.push(limiter.check(identifier, maxRequests, windowMs))
      }

      const allowedCount = results.filter((r) => r.allowed).length
      const blockedCount = results.filter((r) => !r.allowed).length

      expect(allowedCount).toBe(10)
      expect(blockedCount).toBe(5)
    })
  })
})
