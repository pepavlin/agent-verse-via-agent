import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { handleApiError, validationError } from "@/lib/error-handler"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, password } = body

    // Log registration attempt (without sensitive data)
    console.log('[REGISTER_ATTEMPT]', {
      email,
      hasName: !!name,
      passwordLength: password?.length || 0,
      timestamp: new Date().toISOString()
    })

    // Validation: Required fields
    if (!email || !password) {
      return validationError(
        "Missing required fields",
        !email ? "email" : "password",
        "Both email and password are required"
      )
    }

    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return validationError(
        "Invalid email format",
        "email",
        "Please provide a valid email address"
      )
    }

    // Validation: Password length (minimum)
    if (password.length < 6) {
      return validationError(
        "Password must be at least 6 characters",
        "password",
        `Current password length: ${password.length}`
      )
    }

    // Validation: Password length (maximum)
    // Bcrypt has a maximum password length of 72 bytes
    // Passwords longer than this are silently truncated, which is a security issue
    if (password.length > 72) {
      return validationError(
        "Password must not exceed 72 characters",
        "password",
        "Bcrypt has a maximum password length of 72 characters"
      )
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (existingUser) {
      return validationError(
        "Email already exists",
        "email",
        "An account with this email address already exists"
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      }
    })

    console.log('[REGISTER_SUCCESS]', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    return handleApiError(error, "REGISTER")
  }
}
