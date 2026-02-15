#!/usr/bin/env tsx

import { execSync } from 'child_process'

console.log('Initializing database...')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '(set)' : '(not set)')

try {
  // Push the schema to the database (creates tables if they don't exist)
  console.log('Pushing database schema...')
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('Database schema pushed successfully')

  // Generate Prisma Client
  console.log('Generating Prisma Client...')
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('Prisma Client generated')

  // Seed the database
  console.log('Seeding database...')
  execSync('npm run db:seed', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('Database seeded')

  console.log('Database initialization complete!')
} catch (error) {
  console.error('Database initialization failed:', error)
  process.exit(1)
}
