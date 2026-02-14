import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Determine database type from DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 'postgresql://agentverse:agentverse_password@localhost:5432/agentverse?schema=public'
const isPostgreSQL = databaseUrl.startsWith('postgresql://')

// Create appropriate Prisma client based on database type
export const prisma =
  globalForPrisma.prisma ??
  (isPostgreSQL
    ? // PostgreSQL - use PrismaPg adapter with pg Pool
      new PrismaClient({
        adapter: new PrismaPg(new Pool({ connectionString: databaseUrl })),
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
      })
    : // Fallback to standard Prisma client without adapter for non-PostgreSQL
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
      }))

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
