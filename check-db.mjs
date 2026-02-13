import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db'
})

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

try {
  const agents = await prisma.agent.findMany({ take: 5 })
  const agentCount = await prisma.agent.count()
  const userCount = await prisma.user.count()
  const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`
  console.log('=== DATABASE STATUS ===')
  console.log('Total users:', userCount)
  console.log('Total agents:', agentCount)
  console.log('\nSample agents:')
  agents.forEach(a => console.log(`  - ${a.name} (${a.role}) - color: ${a.color}, size: ${a.size}`))
  console.log('\nAll tables:', tables.map(t => t.name).join(', '))
  console.log('\n✅ Database is functional')
} catch (error) {
  console.error('❌ Database error:', error.message)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
