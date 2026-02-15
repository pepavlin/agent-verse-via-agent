import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Factory function to create Prisma client with PostgreSQL adapter
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  const pool = new Pool({ connectionString: databaseUrl })
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })
}

// Lazy getter — only creates the client when first accessed at runtime
function getBaseClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Create a wrapper with validation for messages (uses lazy initialization)
class ValidatingPrismaClient {
  private get client(): PrismaClient {
    return getBaseClient()
  }

  get user() {
    return this.client.user
  }

  get account() {
    return this.client.account
  }

  get session() {
    return this.client.session
  }

  get agent() {
    return this.client.agent
  }

  get department() {
    return this.client.department
  }

  get task() {
    return this.client.task
  }

  get workflowExecution() {
    return this.client.workflowExecution
  }

  get workflowStep() {
    return this.client.workflowStep
  }

  get userQuery() {
    return this.client.userQuery
  }

  get verificationToken() {
    return this.client.verificationToken
  }

  get message() {
    const originalMessage = this.client.message
    return {
      create: async (args: Prisma.MessageCreateArgs) => {
        // Validate message content
        if (args.data?.content === '') {
          throw new Error('Message content cannot be empty')
        }
        return originalMessage.create(args)
      },
      findUnique: (args: Prisma.MessageFindUniqueArgs) => originalMessage.findUnique(args),
      findMany: (args: Prisma.MessageFindManyArgs) => originalMessage.findMany(args),
      update: (args: Prisma.MessageUpdateArgs) => originalMessage.update(args),
      delete: (args: Prisma.MessageDeleteArgs) => originalMessage.delete(args),
      deleteMany: (args: Prisma.MessageDeleteManyArgs) => originalMessage.deleteMany(args),
      count: (args: Prisma.MessageCountArgs) => originalMessage.count(args),
    }
  }

  get $disconnect() {
    return this.client.$disconnect.bind(this.client)
  }

  get $transaction() {
    return this.client.$transaction.bind(this.client)
  }
}

export const prisma = new ValidatingPrismaClient() as ValidatingPrismaClient & {
  $disconnect: () => Promise<void>
  $transaction: PrismaClient['$transaction']
}
