import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, decrypt, createFingerprint } from '@/lib/encryption'

const SaveKeySchema = z.object({
  apiKey: z.string().min(10, 'API klíč je příliš krátký'),
})

/** GET /api/user/api-key — returns fingerprint only, never the actual key */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  const record = await prisma.apiKey.findUnique({ where: { userId: session.user.id } })
  if (!record) {
    return NextResponse.json({ hasKey: false })
  }

  return NextResponse.json({
    hasKey: true,
    fingerprint: record.fingerprint,
    provider: record.provider,
  })
}

/** POST /api/user/api-key — saves (or replaces) the API key */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = SaveKeySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Neplatný klíč' },
        { status: 400 },
      )
    }

    const { apiKey } = parsed.data
    const encryptedKey = encrypt(apiKey)
    const fingerprint = createFingerprint(apiKey)

    await prisma.apiKey.upsert({
      where: { userId: session.user.id },
      update: { encryptedKey, fingerprint, updatedAt: new Date() },
      create: { userId: session.user.id, encryptedKey, fingerprint },
    })

    return NextResponse.json({ hasKey: true, fingerprint })
  } catch {
    return NextResponse.json({ error: 'Chyba při ukládání klíče' }, { status: 500 })
  }
}

/** DELETE /api/user/api-key — removes the API key */
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  try {
    await prisma.apiKey.deleteMany({ where: { userId: session.user.id } })
    return NextResponse.json({ hasKey: false })
  } catch {
    return NextResponse.json({ error: 'Chyba při mazání klíče' }, { status: 500 })
  }
}

/** Internal helper: load and decrypt the user's API key (server-side only) */
export async function getUserApiKey(userId: string): Promise<string | null> {
  const record = await prisma.apiKey.findUnique({ where: { userId } })
  if (!record) return null
  try {
    return decrypt(record.encryptedKey)
  } catch {
    return null
  }
}
