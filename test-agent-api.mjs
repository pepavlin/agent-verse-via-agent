import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Create adapter with config
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db'
})

const prisma = new PrismaClient({ adapter })

async function testAgentAPI() {
  console.log('🧪 Testing Agent API operations...\n')

  try {
    // 1. Create a test agent
    console.log('1️⃣ Creating a test agent...')
    const agent = await prisma.agent.create({
      data: {
        name: 'TestBot',
        description: 'A test agent for API validation',
        model: 'claude-3-5-sonnet-20241022',
        role: 'researcher',
        personality: 'curious and analytical',
        specialization: 'data analysis',
        color: '#3b82f6',
        size: 25,
        userId: 'fake-user'
      }
    })
    console.log('✅ Agent created successfully:', {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      color: agent.color
    })

    // 2. Fetch all agents
    console.log('\n2️⃣ Fetching all agents...')
    const agents = await prisma.agent.findMany({
      where: { userId: 'fake-user' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    })
    console.log(`✅ Found ${agents.length} agent(s)`)
    agents.forEach(a => {
      console.log(`  - ${a.name} (${a.role}) - ${a._count.messages} messages`)
    })

    // 3. Update the agent
    console.log('\n3️⃣ Updating agent...')
    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        description: 'Updated description for test agent'
      }
    })
    console.log('✅ Agent updated:', updatedAgent.description)

    // 4. Delete the agent
    console.log('\n4️⃣ Deleting test agent...')
    await prisma.agent.delete({
      where: { id: agent.id }
    })
    console.log('✅ Agent deleted successfully')

    // 5. Verify deletion
    console.log('\n5️⃣ Verifying deletion...')
    const remainingAgents = await prisma.agent.findMany({
      where: { userId: 'fake-user' }
    })
    console.log(`✅ Remaining agents: ${remainingAgents.length}`)

    console.log('\n✅ All API tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testAgentAPI()
