import { NextResponse } from "next/server"
import { orchestrator } from "@/lib/orchestrator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const agentId = searchParams.get('agentId')
    
    let events
    
    if (agentId) {
      // Filter by specific agent
      events = orchestrator.getCommunicationEventsByAgent(
        agentId,
        limit ? parseInt(limit) : undefined
      )
    } else {
      // Get all events
      events = orchestrator.getCommunicationEvents(
        limit ? parseInt(limit) : undefined
      )
    }
    
    return NextResponse.json(events)
  } catch (error) {
    console.error('[COMMUNICATION_EVENTS_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch communication events' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    orchestrator.clearCommunicationEvents()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[COMMUNICATION_EVENTS_DELETE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to clear communication events' },
      { status: 500 }
    )
  }
}
