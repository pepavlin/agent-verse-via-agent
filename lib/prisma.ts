import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Determine database type from DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
const isPostgreSQL = databaseUrl.startsWith('postgresql://')

// Create appropriate Prisma client based on database type
export const prisma =
  globalForPrisma.prisma ??
  (isPostgreSQL
    ? // PostgreSQL - use default client without adapter
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
      })
    : // SQLite - use LibSQL adapter
      new PrismaClient({
        adapter: new PrismaLibSql({ url: databaseUrl }),
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
      }))

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
