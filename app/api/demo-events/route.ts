import { NextResponse } from "next/server"
import { generateDemoEvents } from "@/lib/demo-events"

export async function POST() {
  try {
    const result = await generateDemoEvents()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[DEMO_EVENTS_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to generate demo events' },
      { status: 500 }
    )
  }
}
