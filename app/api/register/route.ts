import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, password } = body

    if (!email || !password) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new NextResponse("Invalid email format", { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return new NextResponse("Password must be at least 6 characters", { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (existingUser) {
      return new NextResponse("Email already exists", { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      }
    })

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error("[REGISTER_ERROR]", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      // Prisma errors
      if (error.message.includes("Unique constraint")) {
        return new NextResponse("Email already exists", { status: 400 })
      }
      if (error.message.includes("database")) {
        return new NextResponse("Database connection error", { status: 503 })
      }
      // Log detailed error for debugging
      console.error("[REGISTER_ERROR_DETAILS]", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }

    return new NextResponse("Internal server error", { status: 500 })
  }
}
