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
    compare: vi.fn(),
  },
}))

describe('Password Length Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject password shorter than 6 characters', async () => {
    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: '12345', // 5 characters
      }),
    })

    const response = await POST(request)
    const text = await response.text()

    expect(response.status).toBe(400)
    expect(text).toBe('Password must be at least 6 characters')
  })

  it('should accept password with exactly 6 characters', async () => {
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
        password: '123456', // 6 characters
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('should accept password with 72 characters (bcrypt maximum)', async () => {
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
        password: 'a'.repeat(72), // 72 characters
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('should reject password with 73 characters (over bcrypt limit)', async () => {
    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'a'.repeat(73), // 73 characters
      }),
    })

    const response = await POST(request)
    const text = await response.text()

    expect(response.status).toBe(400)
    expect(text).toBe('Password must not exceed 72 characters')
  })

  it('should reject password with 100 characters', async () => {
    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'a'.repeat(100), // 100 characters
      }),
    })

    const response = await POST(request)
    const text = await response.text()

    expect(response.status).toBe(400)
    expect(text).toBe('Password must not exceed 72 characters')
  })

  it('should reject password with 1000 characters', async () => {
    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'a'.repeat(1000), // 1000 characters
      }),
    })

    const response = await POST(request)
    const text = await response.text()

    expect(response.status).toBe(400)
    expect(text).toBe('Password must not exceed 72 characters')
  })

  it('should accept password in valid range (between 6 and 72 characters)', async () => {
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
        password: 'ThisIsASecurePassword123!', // 25 characters
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
  })
})
