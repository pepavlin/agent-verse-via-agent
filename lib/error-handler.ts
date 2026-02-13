import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === "development"

// Error types enum for better error categorization
export enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  DATABASE = "DATABASE_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR",
  EXTERNAL_API = "EXTERNAL_API_ERROR",
  INTERNAL = "INTERNAL_ERROR",
}

// Structured error response interface
export interface ErrorResponse {
  error: {
    type: ErrorType
    message: string
    details?: string
    field?: string
    stack?: string
    timestamp: string
  }
}

// Helper to create structured error response
function createErrorResponse(
  type: ErrorType,
  message: string,
  statusCode: number,
  details?: string,
  field?: string,
  stack?: string
): NextResponse<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    error: {
      type,
      message,
      timestamp: new Date().toISOString(),
    },
  }

  // Add optional fields
  if (details) errorResponse.error.details = details
  if (field) errorResponse.error.field = field

  // Only include stack trace in development mode
  if (isDevelopment && stack) {
    errorResponse.error.stack = stack
  }

  return NextResponse.json(errorResponse, { status: statusCode })
}

// Main error handler function
export function handleApiError(error: unknown, context?: string): NextResponse<ErrorResponse> {
  const contextPrefix = context ? `[${context}]` : "[API_ERROR]"

  // Log the full error for debugging
  console.error(contextPrefix, {
    error,
    type: typeof error,
    timestamp: new Date().toISOString(),
  })

  // Handle Error instances
  if (error instanceof Error) {
    // Log detailed error information
    console.error(`${contextPrefix}_DETAILS`, {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })

    // Handle Prisma errors (both instanceof checks and duck-typing for mocked errors)
    if (error instanceof Prisma.PrismaClientKnownRequestError || (error as any).code) {
      return handlePrismaError(error as any, contextPrefix)
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error(`${contextPrefix}_PRISMA_VALIDATION`, error.message)
      return createErrorResponse(
        ErrorType.VALIDATION,
        "Invalid data format",
        400,
        isDevelopment ? error.message : undefined,
        undefined,
        error.stack
      )
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error(`${contextPrefix}_PRISMA_INIT`, error.message)
      return createErrorResponse(
        ErrorType.DATABASE,
        "Database connection error",
        503,
        isDevelopment ? error.message : "Unable to connect to database",
        undefined,
        error.stack
      )
    }

    // Handle bcrypt errors (from password hashing)
    if (error.message.includes("bcrypt") || error.message.includes("hash")) {
      console.error(`${contextPrefix}_BCRYPT`, error.message)
      return createErrorResponse(
        ErrorType.INTERNAL,
        "Password processing error",
        500,
        isDevelopment ? error.message : undefined,
        undefined,
        error.stack
      )
    }

    // Handle Anthropic API errors
    if (error.name === "APIError" || error.message.includes("Anthropic")) {
      console.error(`${contextPrefix}_ANTHROPIC_API`, error.message)
      return createErrorResponse(
        ErrorType.EXTERNAL_API,
        "AI service error",
        502,
        isDevelopment ? error.message : "Failed to communicate with AI service",
        undefined,
        error.stack
      )
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      console.error(`${contextPrefix}_JSON_PARSE`, error.message)
      return createErrorResponse(
        ErrorType.VALIDATION,
        "Invalid JSON format",
        400,
        isDevelopment ? error.message : "Request body must be valid JSON",
        undefined,
        error.stack
      )
    }

    // Generic error with message
    console.error(`${contextPrefix}_GENERIC`, error.message)
    return createErrorResponse(
      ErrorType.INTERNAL,
      "Internal server error",
      500,
      isDevelopment ? error.message : undefined,
      undefined,
      error.stack
    )
  }

  // Handle non-Error objects
  console.error(`${contextPrefix}_UNKNOWN`, {
    type: typeof error,
    value: error,
    timestamp: new Date().toISOString(),
  })

  return createErrorResponse(
    ErrorType.INTERNAL,
    "Internal server error",
    500,
    isDevelopment ? String(error) : undefined
  )
}

// Handle Prisma-specific errors
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError | (Error & { code?: string; meta?: any }),
  contextPrefix: string
): NextResponse<ErrorResponse> {
  const code = (error as any).code
  const meta = (error as any).meta

  console.error(`${contextPrefix}_PRISMA`, {
    code,
    meta,
    message: error.message,
  })

  switch (code) {
    case "P2002":
      // Unique constraint violation
      const field = meta?.target as string[] | undefined
      const fieldName = field?.[0] || "field"
      return createErrorResponse(
        ErrorType.VALIDATION,
        `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} already exists`,
        400,
        isDevelopment ? `Unique constraint failed on ${fieldName}` : undefined,
        fieldName,
        error.stack
      )

    case "P2025":
      // Record not found
      return createErrorResponse(
        ErrorType.NOT_FOUND,
        "Record not found",
        404,
        isDevelopment ? error.message : undefined,
        undefined,
        error.stack
      )

    case "P2003":
      // Foreign key constraint failed
      return createErrorResponse(
        ErrorType.VALIDATION,
        "Invalid reference",
        400,
        isDevelopment ? "Foreign key constraint failed" : undefined,
        undefined,
        error.stack
      )

    case "P2014":
      // Required relation violation
      return createErrorResponse(
        ErrorType.VALIDATION,
        "Missing required relation",
        400,
        isDevelopment ? error.message : undefined,
        undefined,
        error.stack
      )

    case "P1001":
    case "P1002":
    case "P1008":
      // Database connection errors
      return createErrorResponse(
        ErrorType.DATABASE,
        "Database connection error",
        503,
        isDevelopment ? error.message : "Unable to connect to database",
        undefined,
        error.stack
      )

    default:
      // Other Prisma errors
      return createErrorResponse(
        ErrorType.DATABASE,
        "Database error",
        500,
        isDevelopment ? error.message : undefined,
        undefined,
        error.stack
      )
  }
}

// Helper function for validation errors
export function validationError(
  message: string,
  field?: string,
  details?: string
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    ErrorType.VALIDATION,
    message,
    400,
    details,
    field
  )
}

// Helper function for authentication errors
export function authenticationError(
  message: string = "Unauthorized",
  details?: string
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    ErrorType.AUTHENTICATION,
    message,
    401,
    details
  )
}

// Helper function for authorization errors
export function authorizationError(
  message: string = "Forbidden",
  details?: string
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    ErrorType.AUTHORIZATION,
    message,
    403,
    details
  )
}

// Helper function for not found errors
export function notFoundError(
  resource: string = "Resource",
  details?: string
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    ErrorType.NOT_FOUND,
    `${resource} not found`,
    404,
    details
  )
}
