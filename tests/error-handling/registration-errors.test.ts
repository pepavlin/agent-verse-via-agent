import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/register/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}))

describe('Registration Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Validation Errors', () => {
    it('should handle missing email', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          password: 'password123',
          name: 'Test User',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Missing required fields')
    })

    it('should handle missing password', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Missing required fields')
    })

    it('should handle empty email', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: '',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Missing required fields')
    })

    it('should handle empty password', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: '',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Missing required fields')
    })

    it('should handle invalid email format - no @', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'notanemail',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Invalid email format')
    })

    it('should handle invalid email format - no domain', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Invalid email format')
    })

    it('should handle invalid email format - no TLD', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@domain',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Invalid email format')
    })

    it('should handle password too short', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: '12345',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Password must be at least 6 characters')
    })

    it('should handle 1 character password', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'a',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Password must be at least 6 characters')
    })
  })

  describe('Database Errors', () => {
    it('should handle database connection failure', async () => {
      // Create a proper Prisma initialization error
      const prismaError = new Error('Failed to connect to database')
      Object.assign(prismaError, {
        code: 'P1001',
        clientVersion: '5.0.0'
      })
      vi.mocked(prisma.user.findUnique).mockRejectedValue(prismaError)

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(503)
      expect(json.error.type).toBe('DATABASE_ERROR')
      expect(json.error.message).toBe('Database connection error')
    })

    it('should handle database timeout', async () => {
      // Create a proper Prisma timeout error
      const prismaError = new Error('Database query timeout')
      Object.assign(prismaError, {
        code: 'P1008',
        clientVersion: '5.0.0'
      })
      vi.mocked(prisma.user.findUnique).mockRejectedValue(prismaError)

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(503)
      expect(json.error.type).toBe('DATABASE_ERROR')
      expect(json.error.message).toBe('Database connection error')
    })

    it('should handle unique constraint violation during create', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never)

      // Create a proper Prisma P2002 error
      const prismaError = new Error('Unique constraint failed on the fields: (`email`)')
      Object.assign(prismaError, {
        code: 'P2002',
        meta: { target: ['email'] },
        clientVersion: '5.0.0'
      })
      vi.mocked(prisma.user.create).mockRejectedValue(prismaError)

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.type).toBe('VALIDATION_ERROR')
      expect(json.error.message).toBe('Email already exists')
      expect(json.error.field).toBe('email')
    })

    it('should handle race condition with duplicate email', async () => {
      // Simulates a race condition where two requests check for existing user
      // at the same time, both find null, then both try to create
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never)

      // Create a proper Prisma P2002 error
      const prismaError = new Error('Unique constraint failed')
      Object.assign(prismaError, {
        code: 'P2002',
        meta: { target: ['email'] },
        clientVersion: '5.0.0'
      })
      vi.mocked(prisma.user.create).mockRejectedValue(prismaError)

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.type).toBe('VALIDATION_ERROR')
      expect(json.error.message).toBe('Email already exists')
      expect(json.error.field).toBe('email')
    })
  })

  describe('Bcrypt Errors', () => {
    it('should handle bcrypt hashing failure', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(bcrypt.hash).mockRejectedValue(new Error('Hashing failed'))

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error.message).toBe('Internal server error')
    })
  })

  describe('Malformed Request Errors', () => {
    it('should handle invalid JSON in request body', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'not-json',
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.type).toBe('VALIDATION_ERROR')
      expect(json.error.message).toBe('Invalid JSON format')
    })

    it('should handle null email explicitly', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: null,
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Missing required fields')
    })

    it('should handle null password explicitly', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: null,
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Missing required fields')
    })

    it('should handle undefined email', async () => {
      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: undefined,
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.message).toBe('Missing required fields')
    })
  })

  describe('Edge Cases', () => {
    it('should handle extremely long email', async () => {
      const longEmail = 'a'.repeat(1000) + '@example.com'

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: longEmail,
          password: 'password123',
        }),
      })

      const response = await POST(request)

      // Should either validate successfully or fail appropriately
      expect([200, 400, 500, 503]).toContain(response.status)
    })

    it('should handle extremely long password', async () => {
      const longPassword = 'a'.repeat(10000)

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never)
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: longPassword,
        }),
      })

      const response = await POST(request)

      expect([200, 400, 500]).toContain(response.status)
    })

    it('should handle special characters in email', async () => {
      const specialEmail = 'test+special.name@sub-domain.example.com'

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never)
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: specialEmail,
        name: null,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: specialEmail,
          password: 'password123',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle Unicode characters in name', async () => {
      const unicodeName = '测试用户 👤'

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never)
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: unicodeName,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: unicodeName,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.name).toBe(unicodeName)
    })
  })

  describe('Generic Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Unexpected error occurred')
      )

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(request)

      // Should return 500 or 503 for unexpected errors
      expect([500, 503]).toContain(response.status)
    })

    it('should handle non-Error exceptions', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue('String error')

      const request = new Request('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
