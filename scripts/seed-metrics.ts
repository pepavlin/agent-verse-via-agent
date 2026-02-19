/**
 * Mock Data Seeder for Agent Status Dashboard
 * 
 * This script generates sample agent metrics data for testing the dashboard.
 * Run with: tsx scripts/seed-metrics.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding agent metrics...')

  // Get all agents
  const agents = await prisma.agent.findMany()

  if (agents.length === 0) {
    console.log('⚠️  No agents found. Create some agents first!')
    return
  }

  console.log(`Found ${agents.length} agents`)

  // Generate metrics for each agent
  for (const agent of agents) {
    const statuses = ['idle', 'thinking', 'communicating', 'error']
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    
    // Generate 20 historical metrics for each agent
    for (let i = 0; i < 20; i++) {
      const isError = Math.random() < 0.1 // 10% error rate
      const executionTime = Math.floor(Math.random() * 5000) + 500 // 500-5500ms
      
      const createdAt = new Date()
      createdAt.setHours(createdAt.getHours() - i) // Spread over last 20 hours
      
      await prisma.agentMetrics.create({
        data: {
          agentId: agent.id,
          status: isError ? 'error' : randomStatus,
          executionTime,
          success: !isError,
          errorMessage: isError ? `Sample error message for ${agent.name}` : null,
          tasksCompleted: isError ? 0 : 1,
          createdAt
        }
      })
    }
    
    console.log(`✅ Generated metrics for ${agent.name}`)
  }

  console.log('✨ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding metrics:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
