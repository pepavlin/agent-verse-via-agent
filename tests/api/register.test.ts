import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/register/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}))

describe('POST /api/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register a new user successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    })
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
      },
    })
  })

  it('should return 400 if email is missing', async () => {
    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.message).toBe('Missing required fields')
    expect(json.error.type).toBe('VALIDATION_ERROR')
    expect(json.error.field).toBe('email')
  })

  it('should return 400 if password is missing', async () => {
    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.message).toBe('Missing required fields')
    expect(json.error.type).toBe('VALIDATION_ERROR')
    expect(json.error.field).toBe('password')
  })

  it('should return 400 for invalid email format', async () => {
    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.message).toBe('Invalid email format')
    expect(json.error.type).toBe('VALIDATION_ERROR')
    expect(json.error.field).toBe('email')
  })

  it('should return 400 if password is too short', async () => {
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
    expect(json.error.type).toBe('VALIDATION_ERROR')
    expect(json.error.field).toBe('password')
  })

  it('should return 400 if email already exists', async () => {
    const existingUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Existing User',
      password: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser)

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
    expect(json.error.message).toBe('Email already exists')
    expect(json.error.type).toBe('VALIDATION_ERROR')
    expect(json.error.field).toBe('email')
  })

  it('should hash password with bcrypt before storing', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password-12-rounds',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password-12-rounds' as never)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'plaintext-password',
      }),
    })

    await POST(request)

    expect(bcrypt.hash).toHaveBeenCalledWith('plaintext-password', 12)
  })

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(
      new Error('Database connection error')
    )

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
    expect(json.error.type).toBe('INTERNAL_ERROR')
  })

  it('should handle unique constraint violations', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never)

    // Create a proper Prisma error for unique constraint violation
    const prismaError = new Error('Unique constraint failed on the fields: (`email`)')
    Object.assign(prismaError, {
      code: 'P2002',
      meta: { target: ['email'] }
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
    expect(json.error.message).toBe('Email already exists')
    expect(json.error.type).toBe('VALIDATION_ERROR')
    expect(json.error.field).toBe('email')
  })

  it('should register user without name (optional field)', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: null,
      password: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: null,
    })
  })
})
