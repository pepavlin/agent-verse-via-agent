import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')

let prisma: PrismaClient

if (isPostgres) {
  const dbPool = new Pool({ connectionString: databaseUrl })
  const adapter = new PrismaPg(dbPool)
  prisma = new PrismaClient({ adapter })
} else {
  prisma = new PrismaClient()
}

async function main() {
  console.log('Seeding database...')

  // Create the fake user for the fake auth system
  const fakeUser = await prisma.user.upsert({
    where: { id: 'fake-user' },
    update: {},
    create: {
      id: 'fake-user',
      email: 'fake@example.com',
      name: 'Fake User',
      password: 'not-used', // Password not used in fake auth
    },
  })

  console.log('Fake user created:', fakeUser)
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
