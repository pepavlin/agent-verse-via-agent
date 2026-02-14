#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'dev.db')

console.log('🔧 Initializing database...')
console.log('Database path:', DB_PATH)

try {
  // Check if database exists
  const dbExists = existsSync(DB_PATH)

  if (!dbExists) {
    console.log('📦 Database does not exist, creating new database...')
  } else {
    console.log('✓ Database file exists')
  }

  // Push the schema to the database (creates tables if they don't exist)
  console.log('📊 Pushing database schema...')
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('✓ Database schema pushed successfully')

  // Generate Prisma Client
  console.log('🔨 Generating Prisma Client...')
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('✓ Prisma Client generated')

  // Seed the database
  console.log('🌱 Seeding database...')
  execSync('npm run db:seed', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('✓ Database seeded')

  console.log('✅ Database initialization complete!')
} catch (error) {
  console.error('❌ Database initialization failed:', error)
  process.exit(1)
}
