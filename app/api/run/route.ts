import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { runAgentTask } from '@/lib/llm'
import { getUserApiKey } from '@/app/api/user/api-key/route'

const RunSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  agentRole: z.string(),
  agentGoal: z.string().optional(),
  agentPersona: z.string().optional(),
  taskDescription: z.string().min(1, 'Popis úkolu nesmí být prázdný'),
  /** Agent's previous clarifying question (present only on resumed runs). */
  previousQuestion: z.string().optional(),
  /** User's answer to the clarifying question (present only on resumed runs). */
  userAnswer: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = RunSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Neplatné parametry' },
        { status: 400 },
      )
    }

    const apiKey = await getUserApiKey(session.user.id)
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'no_api_key',
          userMessage:
            'Pro použití agentů je potřeba nastavit API klíč. Otevři nastavení účtu a vlož svůj Anthropic API klíč.',
        },
        { status: 402 },
      )
    }

    const result = await runAgentTask({
      ...parsed.data,
      apiKey,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, userMessage: result.userMessage },
        { status: 422 },
      )
    }

    return NextResponse.json({ result: result.result })
  } catch {
    return NextResponse.json(
      { error: 'server_error', userMessage: 'Nastala neočekávaná chyba. Zkus to znovu.' },
      { status: 500 },
    )
  }
}
