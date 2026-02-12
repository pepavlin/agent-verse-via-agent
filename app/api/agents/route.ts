import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { name, description, model } = body

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        model: model || "claude-3-5-sonnet-20241022",
        userId: session.user.id
      }
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
