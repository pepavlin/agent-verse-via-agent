import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasources: { db: { url: 'file:./dev.db' } } })
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
} catch (error) {
  console.error('Error:', error.message)
} finally {
  await prisma.$disconnect()
}
