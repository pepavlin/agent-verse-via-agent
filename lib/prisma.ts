import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { Pool } from 'pg'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For SQLite, convert relative path to absolute path
const getSqliteUrl = (url: string) => {
  if (url.startsWith('file:')) {
    const relativePath = url.replace('file:', '')
    const absolutePath = path.resolve(process.cwd(), relativePath)
    return `file:${absolutePath}`
  }
  return url
}

// Factory function to create Prisma client
function createPrismaClient() {
  // Determine database type from DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
  const isPostgreSQL = databaseUrl.startsWith('postgresql://')
  const isSQLite = databaseUrl.startsWith('file:')

  if (isPostgreSQL) {
    // PostgreSQL - use PrismaPg adapter with pg Pool
    return new PrismaClient({
      adapter: new PrismaPg(new Pool({ connectionString: databaseUrl })),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })
  } else if (isSQLite) {
    // SQLite - use PrismaLibSql adapter
    const sqliteUrl = getSqliteUrl(databaseUrl)
    console.log('[Prisma] Creating SQLite client with URL:', sqliteUrl)
    return new PrismaClient({
      adapter: new PrismaLibSql({ url: sqliteUrl }),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })
  } else {
    // Fallback
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })
  }
}

// Create appropriate Prisma client based on database type
const baseClient = globalForPrisma.prisma ?? createPrismaClient()

// Create a wrapper with validation for messages
class ValidatingPrismaClient {
  private client: any

  constructor(client: any) {
    this.client = client
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
      create: async (args: any) => {
        // Validate message content
        if (args.data?.content === '') {
          throw new Error('Message content cannot be empty')
        }
        return originalMessage.create(args)
      },
      findUnique: (args: any) => originalMessage.findUnique(args),
      findMany: (args: any) => originalMessage.findMany(args),
      update: (args: any) => originalMessage.update(args),
      delete: (args: any) => originalMessage.delete(args),
      deleteMany: (args: any) => originalMessage.deleteMany(args),
      count: (args: any) => originalMessage.count(args),
    }
  }

  get $disconnect() {
    return this.client.$disconnect.bind(this.client)
  }

  get $transaction() {
    return this.client.$transaction.bind(this.client)
  }
}

export const prisma = new ValidatingPrismaClient(baseClient) as any

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = baseClient
