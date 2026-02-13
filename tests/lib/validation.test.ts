import { describe, it, expect } from "vitest"
import {
  CreateAgentSchema,
  SendMessageSchema,
  GetMessagesQuerySchema,
  validateSchema,
  formatZodErrors,
} from "@/lib/validation"

/**
 * Unit tests for validation schemas
 */

describe("Validation Schemas", () => {
  describe("CreateAgentSchema", () => {
    it("should validate valid agent creation data", () => {
      const validData = {
        name: "Test Agent",
        description: "A test agent",
        role: "researcher",
        model: "claude-3-5-sonnet-20241022",
      }

      const result = validateSchema(CreateAgentSchema, validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Test Agent")
        expect(result.data.role).toBe("researcher")
      }
    })

    it("should reject empty name", () => {
      const invalidData = {
        name: "",
        role: "researcher",
      }

      const result = validateSchema(CreateAgentSchema, invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject invalid role", () => {
      const invalidData = {
        name: "Test Agent",
        role: "invalid_role",
      }

      const result = validateSchema(CreateAgentSchema, invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject name longer than 100 characters", () => {
      const invalidData = {
        name: "A".repeat(101),
        role: "researcher",
      }

      const result = validateSchema(CreateAgentSchema, invalidData)
      expect(result.success).toBe(false)
    })

    it("should accept valid roles", () => {
      const roles = [
        "researcher",
        "strategist",
        "critic",
        "ideator",
        "coordinator",
        "executor",
      ]

      roles.forEach((role) => {
        const data = { name: "Test", role }
        const result = validateSchema(CreateAgentSchema, data)
        expect(result.success).toBe(true)
      })
    })

    it("should accept optional fields", () => {
      const minimalData = {
        name: "Test Agent",
        role: "researcher",
      }

      const result = validateSchema(CreateAgentSchema, minimalData)
      expect(result.success).toBe(true)
    })
  })

  describe("SendMessageSchema", () => {
    it("should validate valid message", () => {
      const validData = {
        message: "Hello, how are you?",
      }

      const result = validateSchema(SendMessageSchema, validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message).toBe("Hello, how are you?")
      }
    })

    it("should reject empty message", () => {
      const invalidData = {
        message: "",
      }

      const result = validateSchema(SendMessageSchema, invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject whitespace-only message", () => {
      const invalidData = {
        message: "   ",
      }

      const result = validateSchema(SendMessageSchema, invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject message exceeding 10,000 characters", () => {
      const invalidData = {
        message: "A".repeat(10001),
      }

      const result = validateSchema(SendMessageSchema, invalidData)
      expect(result.success).toBe(false)
    })

    it("should accept message with exactly 10,000 characters", () => {
      const validData = {
        message: "A".repeat(10000),
      }

      const result = validateSchema(SendMessageSchema, validData)
      expect(result.success).toBe(true)
    })
  })

  describe("GetMessagesQuerySchema", () => {
    it("should use default values when not provided", () => {
      const data = {}

      const result = validateSchema(GetMessagesQuerySchema, data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(50)
        expect(result.data.offset).toBe(0)
      }
    })

    it("should parse string values to numbers", () => {
      const data = {
        limit: "25",
        offset: "10",
      }

      const result = validateSchema(GetMessagesQuerySchema, data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(25)
        expect(result.data.offset).toBe(10)
      }
    })

    it("should reject limit greater than 100", () => {
      const data = {
        limit: "101",
      }

      const result = validateSchema(GetMessagesQuerySchema, data)
      expect(result.success).toBe(false)
    })

    it("should reject limit less than 1", () => {
      const data = {
        limit: "0",
      }

      const result = validateSchema(GetMessagesQuerySchema, data)
      expect(result.success).toBe(false)
    })

    it("should reject negative offset", () => {
      const data = {
        offset: "-1",
      }

      const result = validateSchema(GetMessagesQuerySchema, data)
      expect(result.success).toBe(false)
    })

    it("should accept boundary values", () => {
      const data = {
        limit: "1",
        offset: "0",
      }

      const result = validateSchema(GetMessagesQuerySchema, data)
      expect(result.success).toBe(true)

      const data2 = {
        limit: "100",
        offset: "1000",
      }

      const result2 = validateSchema(GetMessagesQuerySchema, data2)
      expect(result2.success).toBe(true)
    })
  })

  describe("formatZodErrors", () => {
    it("should format validation errors correctly", () => {
      const data = {
        name: "",
        role: "invalid",
      }

      const result = validateSchema(CreateAgentSchema, data)
      expect(result.success).toBe(false)

      if (!result.success) {
        const formatted = formatZodErrors(result.errors)

        expect(formatted.message).toBe("Validation failed")
        expect(formatted.fields).toBeDefined()
        expect(Object.keys(formatted.fields).length).toBeGreaterThan(0)
      } else {
        // This should not happen - fail the test
        throw new Error("Validation should have failed")
      }
    })

    it("should group errors by field", () => {
      const data = {
        message: "", // Should fail validation
      }

      const result = validateSchema(SendMessageSchema, data)
      expect(result.success).toBe(false)

      if (!result.success) {
        const formatted = formatZodErrors(result.errors)

        expect(formatted.fields.message).toBeDefined()
        expect(Array.isArray(formatted.fields.message)).toBe(true)
        expect(formatted.fields.message.length).toBeGreaterThan(0)
      } else {
        // This should not happen - fail the test
        throw new Error("Validation should have failed")
      }
    })
  })
})
