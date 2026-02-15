import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
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
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
