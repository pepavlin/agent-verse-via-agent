import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const RegisterSchema = z.object({
  email: z.string().email('Neplatný email'),
  password: z.string().min(8, 'Heslo musí mít alespoň 8 znaků'),
  name: z.string().min(1, 'Jméno je povinné').optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Neplatné údaje' },
        { status: 400 },
      )
    }

    const { email, password, name } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'Účet s tímto emailem již existuje' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name ?? normalizedEmail.split('@')[0],
        passwordHash,
      },
    })

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ error: 'Nastala chyba při registraci' }, { status: 500 })
  }
}
