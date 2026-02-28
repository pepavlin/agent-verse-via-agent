import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { validateApiKey } from '@/lib/llm'

const TestKeySchema = z.object({
  apiKey: z.string().min(10),
})

/** POST /api/user/api-key/test — validates an API key without saving it */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = TestKeySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ valid: false, message: 'Neplatný klíč' }, { status: 400 })
    }

    const result = await validateApiKey(parsed.data.apiKey)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ valid: false, message: 'Chyba při testování klíče' }, { status: 500 })
  }
}
