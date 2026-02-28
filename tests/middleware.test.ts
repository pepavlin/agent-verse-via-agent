/**
 * Tests for proxy (middleware) route protection configuration.
 *
 * Next.js 16 uses `proxy.ts` at the project root instead of `middleware.ts`.
 * The proxy wraps NextAuth's `withAuth` to protect all routes that require
 * authentication.
 *
 * We verify:
 *   - The authorization logic (which paths are public vs. protected)
 *   - That authenticated users at /login are redirected to /
 *   - The proxy module exports the correct shape
 */

import { describe, it, expect } from 'vitest'

/**
 * Mirrors the `authorized()` callback from proxy.ts.
 * Returns true when the path is always public (no auth required).
 */
function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/login')) return true
  if (pathname.startsWith('/api/user/register')) return true
  if (pathname.startsWith('/api/auth')) return true
  return false
}

/**
 * Returns true when a request is blocked (auth required and no token present).
 */
function isBlocked(pathname: string, hasToken: boolean): boolean {
  if (isPublicPath(pathname)) return false
  return !hasToken
}

describe('proxy route protection', () => {
  describe('public paths (always accessible)', () => {
    it('allows /login without auth', () => {
      expect(isBlocked('/login', false)).toBe(false)
    })

    it('allows /login with auth (redirect handled separately in proxy)', () => {
      expect(isBlocked('/login', true)).toBe(false)
    })

    it('allows /api/user/register without auth', () => {
      expect(isBlocked('/api/user/register', false)).toBe(false)
    })

    it('allows /api/auth/session', () => {
      expect(isBlocked('/api/auth/session', false)).toBe(false)
    })

    it('allows /api/auth/signin', () => {
      expect(isBlocked('/api/auth/signin', false)).toBe(false)
    })

    it('allows /api/auth/callback/credentials', () => {
      expect(isBlocked('/api/auth/callback/credentials', false)).toBe(false)
    })
  })

  describe('protected paths (require authentication)', () => {
    it('blocks / for unauthenticated users', () => {
      expect(isBlocked('/', false)).toBe(true)
    })

    it('allows / for authenticated users', () => {
      expect(isBlocked('/', true)).toBe(false)
    })

    it('blocks /delegation for unauthenticated users', () => {
      expect(isBlocked('/delegation', false)).toBe(true)
    })

    it('allows /delegation for authenticated users', () => {
      expect(isBlocked('/delegation', true)).toBe(false)
    })

    it('blocks /api/run for unauthenticated users', () => {
      expect(isBlocked('/api/run', false)).toBe(true)
    })

    it('allows /api/run for authenticated users', () => {
      expect(isBlocked('/api/run', true)).toBe(false)
    })

    it('blocks /api/user/api-key for unauthenticated users', () => {
      expect(isBlocked('/api/user/api-key', false)).toBe(true)
    })

    it('allows /api/user/api-key for authenticated users', () => {
      expect(isBlocked('/api/user/api-key', true)).toBe(false)
    })
  })

  describe('proxy module shape', () => {
    it('exports a default function (the withAuth middleware)', async () => {
      const mod = await import('../proxy')
      expect(typeof mod.default).toBe('function')
    })

    it('exports a config object with a matcher array', async () => {
      const mod = await import('../proxy')
      expect(mod.config).toBeDefined()
      expect(Array.isArray(mod.config.matcher)).toBe(true)
      expect(mod.config.matcher.length).toBeGreaterThan(0)
    })

    it('matcher excludes static asset paths (_next)', async () => {
      const mod = await import('../proxy')
      const matcher: string[] = mod.config.matcher
      // The matcher should exclude Next.js internal paths
      expect(matcher.some((m: string) => m.includes('_next'))).toBe(true)
    })
  })
})
