/**
 * Simple in-memory rate limiting implementation
 * For production use, consider Redis-based rate limiting for distributed systems
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (e.g., user ID, IP address)
   * @param maxRequests - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and remaining count
   */
  check(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    // No entry or expired window - create new entry and check against limit
    if (!entry || now > entry.resetTime) {
      const resetTime = now + windowMs

      // Check if maxRequests is 0 (no requests allowed)
      if (maxRequests === 0) {
        this.requests.set(identifier, {
          count: 1,
          resetTime,
        })
        return {
          allowed: false,
          remaining: 0,
          resetTime,
        }
      }

      this.requests.set(identifier, {
        count: 1,
        resetTime,
      })

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime,
      }
    }

    // Within window - check if limit exceeded
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    // Increment count and allow
    entry.count++
    this.requests.set(identifier, entry)

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key)
      }
    }
  }

  /**
   * Clear all rate limit entries (useful for testing)
   */
  clear() {
    this.requests.clear()
  }

  /**
   * Destroy the rate limiter and clear interval
   */
  destroy() {
    clearInterval(this.cleanupInterval)
    this.requests.clear()
  }
}

// Singleton instance
let rateLimiter: RateLimiter | null = null

/**
 * Get the rate limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiter) {
    rateLimiter = new RateLimiter()
  }
  return rateLimiter
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Chat/message endpoints - 30 requests per minute
  CHAT: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  // Agent creation - 10 requests per hour
  AGENT_CREATE: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Agent listing - 60 requests per minute
  AGENT_LIST: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  },
  // User registration - 5 requests per hour per IP
  REGISTER: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Login attempts - 10 per 15 minutes
  LOGIN: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // General API - 100 requests per minute
  GENERAL: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
}

/**
 * Apply rate limiting to a request
 * Returns true if allowed, throws error if rate limited
 */
export function applyRateLimit(
  identifier: string,
  config: { maxRequests: number; windowMs: number }
): {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
} {
  const limiter = getRateLimiter()
  const result = limiter.check(identifier, config.maxRequests, config.windowMs)

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
    return {
      ...result,
      retryAfter,
    }
  }

  return result
}

/**
 * Format rate limit headers for response
 */
export function getRateLimitHeaders(
  result: ReturnType<typeof applyRateLimit>
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
  }

  if (result.retryAfter !== undefined) {
    headers["Retry-After"] = result.retryAfter.toString()
  }

  return headers
}

/**
 * Create a rate limit error response
 */
export function createRateLimitError(result: ReturnType<typeof applyRateLimit>) {
  const retryAfter = result.retryAfter || 60
  return {
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later.",
    retryAfter,
    resetTime: new Date(result.resetTime).toISOString(),
  }
}
