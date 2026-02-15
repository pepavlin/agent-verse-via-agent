import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
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
    await pool.end()
  })
