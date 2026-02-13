import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError, authenticationError, notFoundError } from "@/lib/error-handler"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params
    const fakeUserId = "fake-user"

    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: fakeUserId
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
      return notFoundError(
        "Agent",
        `No agent found with ID: ${agentId} for this user`
      )
    }

    console.log('[AGENT_GET_SUCCESS]', {
      userId: fakeUserId,
      agentId: agent.id,
      messageCount: agent.messages.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(agent)
  } catch (error) {
    return handleApiError(error, "AGENT_GET")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params
    const fakeUserId = "fake-user"

    // Delete will throw P2025 error if agent not found or doesn't belong to user
    await prisma.agent.delete({
      where: {
        id: agentId,
        userId: fakeUserId
      }
    })

    console.log('[AGENT_DELETE_SUCCESS]', {
      userId: fakeUserId,
      agentId,
      timestamp: new Date().toISOString()
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error, "AGENT_DELETE")
  }
}
