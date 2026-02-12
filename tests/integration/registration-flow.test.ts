import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// This is an integration test that tests the full registration flow
// without mocking database calls

describe('Registration Flow Integration Tests', () => {
  const testEmail = `test-${Date.now()}@example.com`
  let createdUserId: string | null = null

  afterEach(async () => {
    // Cleanup: Delete test user if created
    if (createdUserId) {
      try {
        await prisma.user.delete({
          where: { id: createdUserId },
        })
      } catch (error) {
        // User might not exist, ignore error
      }
      createdUserId = null
    }
  })

  it('should complete full registration workflow', async () => {
    const userData = {
      email: testEmail,
      name: 'Integration Test User',
      password: 'test-password-123',
    }

    // Step 1: Check user doesn't exist
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })
    expect(existingUser).toBeNull()

    // Step 2: Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    expect(hashedPassword).toBeTruthy()
    expect(hashedPassword).not.toBe(userData.password)

    // Step 3: Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
      },
    })

    createdUserId = user.id

    expect(user).toBeTruthy()
    expect(user.id).toBeTruthy()
    expect(user.email).toBe(userData.email)
    expect(user.name).toBe(userData.name)
    expect(user.password).toBe(hashedPassword)
    expect(user.createdAt).toBeInstanceOf(Date)
    expect(user.updatedAt).toBeInstanceOf(Date)

    // Step 4: Verify user can be found
    const foundUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })
    expect(foundUser).toBeTruthy()
    expect(foundUser?.id).toBe(user.id)

    // Step 5: Verify password can be compared
    const isPasswordValid = await bcrypt.compare(
      userData.password,
      foundUser!.password
    )
    expect(isPasswordValid).toBe(true)
  })

  it('should prevent duplicate email registration', async () => {
    const userData = {
      email: testEmail,
      name: 'Test User',
      password: 'password123',
    }

    // Create first user
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
      },
    })

    createdUserId = user.id

    // Try to create duplicate user
    await expect(
      prisma.user.create({
        data: {
          email: userData.email,
          name: 'Another User',
          password: hashedPassword,
        },
      })
    ).rejects.toThrow()
  })

  it('should allow registration without name', async () => {
    const userData = {
      email: testEmail,
      password: 'password123',
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12)
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
      },
    })

    createdUserId = user.id

    expect(user).toBeTruthy()
    expect(user.email).toBe(userData.email)
    expect(user.name).toBeNull()
  })

  it('should create user with proper timestamps', async () => {
    const before = new Date()

    const hashedPassword = await bcrypt.hash('password123', 12)
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
      },
    })

    const after = new Date()
    createdUserId = user.id

    expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(user.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('should generate unique user IDs', async () => {
    const email1 = `test1-${Date.now()}@example.com`
    const email2 = `test2-${Date.now()}@example.com`

    const hashedPassword = await bcrypt.hash('password123', 12)

    const user1 = await prisma.user.create({
      data: {
        email: email1,
        password: hashedPassword,
      },
    })

    const user2 = await prisma.user.create({
      data: {
        email: email2,
        password: hashedPassword,
      },
    })

    expect(user1.id).toBeTruthy()
    expect(user2.id).toBeTruthy()
    expect(user1.id).not.toBe(user2.id)

    // Cleanup
    await prisma.user.delete({ where: { id: user1.id } })
    await prisma.user.delete({ where: { id: user2.id } })
  })
})
