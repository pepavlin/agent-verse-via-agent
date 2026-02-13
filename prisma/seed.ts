import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Create adapter with config
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db'
})

const prisma = new PrismaClient({ adapter })

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
