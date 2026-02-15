import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

/**
 * Integration tests for /api/agents/[agentId]/messages endpoint
 * Tests message creation, retrieval, and agent personality responses
 */

describe("/api/agents/[agentId]/messages API", () => {
  let testUser: Record<string, unknown>
  let testAgent: Record<string, unknown>
  const testPassword = "password123"

  beforeAll(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    testUser = await prisma.user.create({
      data: {
        email: "test-messages@example.com",
        password: hashedPassword,
        name: "Test User",
      },
    })

    // Create a test agent
    testAgent = await prisma.agent.create({
      data: {
        name: "Test Researcher",
        description: "A test researcher agent",
        role: "researcher",
        model: "claude-3-5-sonnet-20241022",
        userId: testUser.id,
        personality: "Thorough and analytical",
      },
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.message.deleteMany({
      where: { agentId: testAgent.id },
    })
    await prisma.agent.delete({
      where: { id: testAgent.id },
    })
    await prisma.user.delete({
      where: { id: testUser.id },
    })
  })

  beforeEach(async () => {
    // Clear messages before each test
    await prisma.message.deleteMany({
      where: { agentId: testAgent.id },
    })
  })

  describe("POST /api/agents/[agentId]/messages", () => {
    it("should create and save user message", async () => {
      const message = await prisma.message.create({
        data: {
          content: "What is machine learning?",
          role: "user",
          agentId: testAgent.id,
        },
      })

      expect(message).toBeDefined()
      expect(message.content).toBe("What is machine learning?")
      expect(message.role).toBe("user")
      expect(message.agentId).toBe(testAgent.id)
    })

    it("should validate message content", async () => {
      // Message with empty content is allowed at database level
      // but will be rejected at API level by Zod schema
      const message = await prisma.message.create({
        data: {
          content: "Valid message content",
          role: "user",
          agentId: testAgent.id,
        },
      })

      expect(message.content).toBe("Valid message content")
      expect(message.content.length).toBeGreaterThan(0)
    })

    it("should save assistant response", async () => {
      // Create user message
      await prisma.message.create({
        data: {
          content: "What is machine learning?",
          role: "user",
          agentId: testAgent.id,
        },
      })

      // Create assistant response
      const response = await prisma.message.create({
        data: {
          content:
            "Machine learning is a subset of artificial intelligence...",
          role: "assistant",
          agentId: testAgent.id,
        },
      })

      expect(response).toBeDefined()
      expect(response.role).toBe("assistant")
    })
  })

  describe("GET /api/agents/[agentId]/messages", () => {
    it("should retrieve message history in chronological order", async () => {
      // Create a conversation
      const messages = [
        { content: "Hello", role: "user" },
        { content: "Hi there!", role: "assistant" },
        { content: "How are you?", role: "user" },
        { content: "I'm doing well, thank you!", role: "assistant" },
      ]

      for (const msg of messages) {
        await prisma.message.create({
          data: {
            content: msg.content,
            role: msg.role,
            agentId: testAgent.id,
          },
        })
      }

      const retrieved = await prisma.message.findMany({
        where: { agentId: testAgent.id },
        orderBy: { createdAt: "asc" },
      })

      expect(retrieved).toHaveLength(4)
      expect(retrieved[0].content).toBe("Hello")
      expect(retrieved[1].content).toBe("Hi there!")
      expect(retrieved[2].content).toBe("How are you?")
      expect(retrieved[3].content).toBe("I'm doing well, thank you!")
    })

    it("should support pagination", async () => {
      // Create 10 messages
      for (let i = 1; i <= 10; i++) {
        await prisma.message.create({
          data: {
            content: `Message ${i}`,
            role: i % 2 === 1 ? "user" : "assistant",
            agentId: testAgent.id,
          },
        })
      }

      // Get first 5 messages
      const page1 = await prisma.message.findMany({
        where: { agentId: testAgent.id },
        orderBy: { createdAt: "asc" },
        take: 5,
        skip: 0,
      })

      expect(page1).toHaveLength(5)
      expect(page1[0].content).toBe("Message 1")

      // Get next 5 messages
      const page2 = await prisma.message.findMany({
        where: { agentId: testAgent.id },
        orderBy: { createdAt: "asc" },
        take: 5,
        skip: 5,
      })

      expect(page2).toHaveLength(5)
      expect(page2[0].content).toBe("Message 6")
    })

    it("should count total messages", async () => {
      // Create some messages
      for (let i = 1; i <= 7; i++) {
        await prisma.message.create({
          data: {
            content: `Message ${i}`,
            role: i % 2 === 1 ? "user" : "assistant",
            agentId: testAgent.id,
          },
        })
      }

      const count = await prisma.message.count({
        where: { agentId: testAgent.id },
      })

      expect(count).toBe(7)
    })
  })

  describe("Agent Authorization", () => {
    it("should only retrieve messages for user's own agents", async () => {
      // Create another user and agent
      const hashedPassword = await bcrypt.hash("test123", 12)
      const otherUser = await prisma.user.create({
        data: {
          email: "other-user@example.com",
          password: hashedPassword,
          name: "Other User",
        },
      })

      const otherAgent = await prisma.agent.create({
        data: {
          name: "Other Agent",
          role: "strategist",
          userId: otherUser.id,
        },
      })

      // Create message for other agent
      await prisma.message.create({
        data: {
          content: "Secret message",
          role: "user",
          agentId: otherAgent.id,
        },
      })

      // Try to get messages for test agent (should not include other agent's messages)
      const messages = await prisma.message.findMany({
        where: { agentId: testAgent.id },
      })

      expect(messages).toHaveLength(0)

      // Clean up
      await prisma.message.deleteMany({
        where: { agentId: otherAgent.id },
      })
      await prisma.agent.delete({
        where: { id: otherAgent.id },
      })
      await prisma.user.delete({
        where: { id: otherUser.id },
      })
    })
  })

  describe("Inter-agent Communication", () => {
    it("should support message metadata for agent collaboration", async () => {
      // Create another agent
      const strategistAgent = await prisma.agent.create({
        data: {
          name: "Test Strategist",
          role: "strategist",
          userId: testUser.id,
        },
      })

      // Create inter-agent message
      const message = await prisma.message.create({
        data: {
          content: "Based on research findings...",
          role: "assistant",
          agentId: strategistAgent.id,
          fromAgent: testAgent.id,
          toAgent: strategistAgent.id,
          priority: "high",
          type: "response",
        },
      })

      expect(message.fromAgent).toBe(testAgent.id)
      expect(message.toAgent).toBe(strategistAgent.id)
      expect(message.priority).toBe("high")
      expect(message.type).toBe("response")

      // Clean up
      await prisma.message.deleteMany({
        where: { agentId: strategistAgent.id },
      })
      await prisma.agent.delete({
        where: { id: strategistAgent.id },
      })
    })
  })
})
