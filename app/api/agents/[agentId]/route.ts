import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const session = await auth()
    const { agentId } = await params

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: session.user.id
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!agent) {
      return new NextResponse("Agent not found", { status: 404 })
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const session = await auth()
    const { agentId } = await params

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.agent.delete({
      where: {
        id: agentId,
        userId: session.user.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
