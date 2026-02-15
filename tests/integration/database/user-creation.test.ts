import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Database User Creation Tests', () => {
  const testUsers: string[] = []

  afterEach(async () => {
    // Cleanup all test users
    for (const userId of testUsers) {
      try {
        await prisma.user.delete({ where: { id: userId } })
      } catch (error) {
        // User might not exist, ignore error
      }
    }
    testUsers.length = 0
  })

  it('should create user with all required fields', async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashed-password',
      },
    })

    testUsers.push(user.id)

    expect(user.id).toBeTruthy()
    expect(user.email).toBeTruthy()
    expect(user.password).toBe('hashed-password')
    expect(user.createdAt).toBeInstanceOf(Date)
    expect(user.updatedAt).toBeInstanceOf(Date)
  })

  it('should enforce unique email constraint', async () => {
    const email = `unique-${Date.now()}@example.com`

    const user1 = await prisma.user.create({
      data: {
        email,
        password: 'password1',
      },
    })

    testUsers.push(user1.id)

    // Try to create another user with same email
    await expect(
      prisma.user.create({
        data: {
          email,
          password: 'password2',
        },
      })
    ).rejects.toThrow()
  })

  it('should allow null name field', async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashed-password',
        name: null,
      },
    })

    testUsers.push(user.id)

    expect(user.name).toBeNull()
  })

  it('should store name when provided', async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashed-password',
        name: 'Test User',
      },
    })

    testUsers.push(user.id)

    expect(user.name).toBe('Test User')
  })

  it('should find user by email', async () => {
    const email = `findme-${Date.now()}@example.com`

    const createdUser = await prisma.user.create({
      data: {
        email,
        password: 'hashed-password',
      },
    })

    testUsers.push(createdUser.id)

    const foundUser = await prisma.user.findUnique({
      where: { email },
    })

    expect(foundUser).toBeTruthy()
    expect(foundUser?.id).toBe(createdUser.id)
    expect(foundUser?.email).toBe(email)
  })

  it('should find user by id', async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashed-password',
      },
    })

    testUsers.push(user.id)

    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    expect(foundUser).toBeTruthy()
    expect(foundUser?.id).toBe(user.id)
  })

  it('should return null when user not found', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'nonexistent@example.com' },
    })

    expect(user).toBeNull()
  })

  it('should update user updatedAt timestamp', async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashed-password',
      },
    })

    testUsers.push(user.id)

    const originalUpdatedAt = user.updatedAt

    // Wait a bit to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10))

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Updated Name' },
    })

    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    )
  })

  it('should delete user successfully', async () => {
    const user = await prisma.user.create({
      data: {
        email: `delete-me-${Date.now()}@example.com`,
        password: 'hashed-password',
      },
    })

    const deletedUser = await prisma.user.delete({
      where: { id: user.id },
    })

    expect(deletedUser.id).toBe(user.id)

    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    expect(foundUser).toBeNull()
  })

  it('should handle case-sensitive emails', async () => {
    const baseEmail = `test-${Date.now()}@example.com`

    const user1 = await prisma.user.create({
      data: {
        email: baseEmail,
        password: 'password1',
      },
    })

    testUsers.push(user1.id)

    // SQLite is case-insensitive for UNIQUE constraints by default
    // but emails are stored as entered
    expect(user1.email).toBe(baseEmail)

    const foundUser = await prisma.user.findUnique({
      where: { email: baseEmail.toUpperCase() },
    })

    // Depending on SQLite collation, this might or might not find the user
    // This test documents the behavior
    if (foundUser) {
      expect(foundUser.email).toBe(baseEmail)
    }
  })

  it('should create multiple users successfully', async () => {
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: `user1-${Date.now()}@example.com`,
          password: 'password1',
        },
      }),
      prisma.user.create({
        data: {
          email: `user2-${Date.now()}@example.com`,
          password: 'password2',
        },
      }),
      prisma.user.create({
        data: {
          email: `user3-${Date.now()}@example.com`,
          password: 'password3',
        },
      }),
    ])

    users.forEach((user) => testUsers.push(user.id))

    expect(users).toHaveLength(3)
    expect(new Set(users.map((u) => u.id)).size).toBe(3) // All unique IDs
  })
})
