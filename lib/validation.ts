import { z } from "zod"

/**
 * Validation schemas for API endpoints
 * Using Zod for runtime type checking and validation
 */

// Agent role enum
export const AgentRoleSchema = z.enum([
  "researcher",
  "strategist",
  "critic",
  "ideator",
  "coordinator",
  "executor",
])

// Message role enum
export const MessageRoleSchema = z.enum(["user", "assistant", "system"])

// Message priority enum
export const MessagePrioritySchema = z.enum(["low", "medium", "high", "urgent"])

// Message type enum
export const MessageTypeSchema = z.enum([
  "query",
  "response",
  "notification",
  "task",
])

// Task status enum
export const TaskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "blocked",
  "completed",
  "failed",
])

// Agent model enum
export const AgentModelSchema = z.enum([
  "claude-3-5-sonnet-20241022",
  "claude-3-opus-20240229",
  "claude-3-haiku-20240307",
])

// Create agent schema
export const CreateAgentSchema = z.object({
  name: z
    .string()
    .min(1, "Agent name is required")
    .max(100, "Agent name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  role: AgentRoleSchema,
  model: AgentModelSchema.optional(),
  personality: z
    .string()
    .max(1000, "Personality must be less than 1000 characters")
    .optional(),
  specialization: z
    .string()
    .max(200, "Specialization must be less than 200 characters")
    .optional(),
  departmentId: z.string().optional(),
})

// Send message schema
export const SendMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(10000, "Message cannot exceed 10,000 characters")
    .refine((val) => val.trim().length > 0, {
      message: "Message cannot be only whitespace",
    }),
})

// Get messages query schema
export const GetMessagesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().min(0)),
})

// User registration schema
export const UserRegistrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be less than 72 characters"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
})

// User login schema
export const UserLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// Create task schema
export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title must be less than 200 characters"),
  description: z
    .string()
    .min(1, "Task description is required")
    .max(2000, "Task description must be less than 2000 characters"),
  priority: MessagePrioritySchema.optional(),
  assignedTo: z.string().optional(),
  departmentId: z.string().optional(),
})

// Update task schema
export const UpdateTaskSchema = z.object({
  title: z
    .string()
    .max(200, "Task title must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .max(2000, "Task description must be less than 2000 characters")
    .optional(),
  status: TaskStatusSchema.optional(),
  priority: MessagePrioritySchema.optional(),
  assignedTo: z.string().nullable().optional(),
  result: z.string().optional(),
})

// Inter-agent message schema
export const InterAgentMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(10000, "Message cannot exceed 10,000 characters"),
  fromAgent: z.string(),
  toAgent: z.string(),
  taskId: z.string().optional(),
  priority: MessagePrioritySchema.optional(),
  type: MessageTypeSchema.optional(),
})

// Agent execution schema
export const AgentExecutionSchema = z.object({
  input: z
    .string()
    .min(1, "Input is required")
    .max(10000, "Input cannot exceed 10,000 characters"),
  context: z.record(z.string(), z.any()).optional(),
})

// Department creation schema
export const CreateDepartmentSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required")
    .max(100, "Department name must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Department description is required")
    .max(500, "Department description must be less than 500 characters"),
})

/**
 * Type exports for TypeScript usage
 */
export type AgentRole = z.infer<typeof AgentRoleSchema>
export type MessageRole = z.infer<typeof MessageRoleSchema>
export type MessagePriority = z.infer<typeof MessagePrioritySchema>
export type MessageType = z.infer<typeof MessageTypeSchema>
export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type AgentModel = z.infer<typeof AgentModelSchema>
export type CreateAgentInput = z.infer<typeof CreateAgentSchema>
export type SendMessageInput = z.infer<typeof SendMessageSchema>
export type GetMessagesQuery = z.infer<typeof GetMessagesQuerySchema>
export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>
export type UserLoginInput = z.infer<typeof UserLoginSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
export type InterAgentMessageInput = z.infer<typeof InterAgentMessageSchema>
export type AgentExecutionInput = z.infer<typeof AgentExecutionSchema>
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>

/**
 * Helper function to validate data and return errors in a consistent format
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: result.error }
}

/**
 * Helper to format Zod errors for API responses
 */
export function formatZodErrors(error: z.ZodError): {
  message: string
  fields: Record<string, string[]>
} {
  const fields: Record<string, string[]> = {}

  // Zod error structure has an 'issues' property
  const issues = error.issues || []

  issues.forEach((err) => {
    const field = err.path.join(".") || "general"
    if (!fields[field]) {
      fields[field] = []
    }
    fields[field].push(err.message)
  })

  return {
    message: "Validation failed",
    fields,
  }
}
