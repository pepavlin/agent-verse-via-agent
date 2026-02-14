# PostgreSQL Docker Setup Guide

## Overview

This guide provides complete instructions for setting up PostgreSQL with Docker for the AgentVerse project. The setup includes automatic database initialization, migrations, and support for both local development (SQLite) and production deployment (PostgreSQL).

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Database Configuration](#database-configuration)
- [Docker Compose Setup](#docker-compose-setup)
- [Environment Variables](#environment-variables)
- [Switching Between SQLite and PostgreSQL](#switching-between-sqlite-and-postgresql)
- [Running the Application](#running-the-application)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)

## Quick Start

### For Docker Deployment (PostgreSQL)

```bash
# 1. Update Prisma schema provider
# Edit prisma/schema.prisma and change:
datasource db {
  provider = "postgresql"
}

# 2. Configure environment variables
cp .env.example .env
# Edit .env and set:
# - ANTHROPIC_API_KEY
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - POSTGRES_PASSWORD (change from default!)

# 3. Start Docker services
docker-compose up -d

# 4. View logs
docker-compose logs -f app

# 5. Access application
# Open http://localhost:3000
```

### For Local Development (SQLite)

```bash
# 1. Update Prisma schema provider
# Edit prisma/schema.prisma and change:
datasource db {
  provider = "sqlite"
}

# 2. Configure environment variables
cp .env.example .env
# Edit .env and set:
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="your_key_here"
NEXTAUTH_SECRET="your_secret_here"

# 3. Install dependencies and start
npm install
npm run dev

# 4. Access application
# Open http://localhost:3000
```

## Architecture

### Components

The PostgreSQL Docker setup consists of:

1. **PostgreSQL Service** (`postgres`)
   - Image: `postgres:16-alpine`
   - Port: 5432 (configurable)
   - Data persistence via Docker volume
   - Health checks for service readiness

2. **Application Service** (`app`)
   - Next.js application with Prisma ORM
   - Automatic database migrations on startup
   - Waits for PostgreSQL to be healthy
   - Port: 3000 (configurable)

3. **Database Connection Layer**
   - Automatic detection of database type (PostgreSQL vs SQLite)
   - Dynamic Prisma client configuration
   - Support for both database engines

### Network Diagram

```
┌────────────────────────────────────────┐
│         Host Machine                   │
│  http://localhost:3000 → app:3000     │
│  postgresql://localhost:5432 → :5432  │
└────────────────────────────────────────┘
                   │
┌──────────────────┴─────────────────────┐
│   Docker Network: agent-verse-network  │
│                                        │
│  ┌──────────┐         ┌────────────┐  │
│  │ postgres │ ←────── │    app     │  │
│  │  :5432   │         │   :3000    │  │
│  └──────────┘         └────────────┘  │
└────────────────────────────────────────┘
         │
┌────────┴──────────┐
│   Docker Volumes  │
│   postgres-data   │
└───────────────────┘
```

## Database Configuration

### Prisma Client Configuration (`lib/prisma.ts`)

The Prisma client automatically detects the database type:

```typescript
// Determine database type from DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
const isPostgreSQL = databaseUrl.startsWith('postgresql://')

// Create appropriate Prisma client based on database type
export const prisma = isPostgreSQL
  ? // PostgreSQL - use default client without adapter
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })
  : // SQLite - use LibSQL adapter
    new PrismaClient({
      adapter: new PrismaLibSql({ url: databaseUrl }),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })
```

### Schema Configuration (`prisma/schema.prisma`)

**IMPORTANT**: You must manually change the provider when switching databases:

```prisma
// For PostgreSQL (Docker deployment)
datasource db {
  provider = "postgresql"
}

// For SQLite (Local development)
datasource db {
  provider = "sqlite"
}
```

### Database URL Configuration (`prisma.config.ts`)

The database URL is configured via environment variable:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

## Docker Compose Setup

### Services Configuration

The `docker-compose.yml` defines two services:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: agent-verse-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=${POSTGRES_DB:-agentverse}
      - POSTGRES_USER=${POSTGRES_USER:-agentverse}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-agentverse_password}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - agent-verse-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-agentverse} -d ${POSTGRES_DB:-agentverse}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    ports:
      - "${POSTGRES_PORT:-5432}:5432"

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: agent-verse-app
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    networks:
      - agent-verse-network
```

### Automatic Database Initialization

The `scripts/docker-entrypoint.sh` handles:

1. ✅ Database type detection (PostgreSQL vs SQLite)
2. ✅ Waiting for PostgreSQL to be ready
3. ✅ Running Prisma migrations
4. ✅ Fallback to `prisma db push` if migrations fail
5. ✅ Database connection verification
6. ✅ Starting the Next.js application

## Environment Variables

### Required Variables

Create a `.env` file with the following:

**For PostgreSQL (Docker):**
```env
# PostgreSQL Configuration
POSTGRES_DB=agentverse
POSTGRES_USER=agentverse
POSTGRES_PASSWORD=your_secure_password_here  # CHANGE THIS!
POSTGRES_PORT=5432

# Database Connection
DATABASE_URL=postgresql://agentverse:your_secure_password_here@postgres:5432/agentverse?schema=public

# Application
PORT=3000
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here  # Generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

**For SQLite (Local Development):**
```env
# Database Connection
DATABASE_URL=file:./dev.db

# Application
PORT=3000
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### Optional Variables

- `NODE_ENV`: Environment mode (`development`, `production`)
- `NEXT_TELEMETRY_DISABLED`: Disable Next.js telemetry (`1`)

## Switching Between SQLite and PostgreSQL

### From SQLite to PostgreSQL

1. **Update Prisma schema**:
   ```bash
   # Edit prisma/schema.prisma
   datasource db {
     provider = "postgresql"  # Change from "sqlite"
   }
   ```

2. **Update environment variables**:
   ```bash
   # Edit .env
   DATABASE_URL=postgresql://agentverse:password@postgres:5432/agentverse?schema=public
   POSTGRES_DB=agentverse
   POSTGRES_USER=agentverse
   POSTGRES_PASSWORD=your_password
   ```

3. **Generate new migrations** (if schema changed):
   ```bash
   npx prisma migrate dev --name switch_to_postgresql
   ```

4. **Start Docker services**:
   ```bash
   docker-compose up -d
   ```

### From PostgreSQL to SQLite

1. **Update Prisma schema**:
   ```bash
   # Edit prisma/schema.prisma
   datasource db {
     provider = "sqlite"  # Change from "postgresql"
   }
   ```

2. **Update environment variables**:
   ```bash
   # Edit .env
   DATABASE_URL=file:./dev.db
   ```

3. **Install dependencies and start**:
   ```bash
   npm install
   npm run dev
   ```

## Running the Application

### Starting Services

```bash
# Start both PostgreSQL and application
docker-compose up -d

# View all logs
docker-compose logs -f

# View application logs only
docker-compose logs -f app

# View database logs only
docker-compose logs -f postgres
```

### Stopping Services

```bash
# Stop containers (data persists)
docker-compose down

# Stop and remove volumes (DELETES ALL DATA!)
docker-compose down -v
```

### Rebuilding After Changes

```bash
# Rebuild and restart
docker-compose up -d --build

# Force rebuild (no cache)
docker-compose build --no-cache
docker-compose up -d
```

## Database Management

### Accessing PostgreSQL

```bash
# Open PostgreSQL shell
docker exec -it agent-verse-postgres psql -U agentverse -d agentverse

# Run SQL query
docker exec -it agent-verse-postgres psql -U agentverse -d agentverse -c "SELECT * FROM \"User\";"
```

### Creating Backups

```bash
# Create backup file
docker exec agent-verse-postgres pg_dump -U agentverse agentverse > backup.sql

# Create compressed backup
docker exec agent-verse-postgres pg_dump -U agentverse agentverse | gzip > backup.sql.gz

# Backup with custom format (recommended)
docker exec agent-verse-postgres pg_dump -U agentverse -Fc agentverse > backup.dump
```

### Restoring Backups

```bash
# Restore from SQL file
cat backup.sql | docker exec -i agent-verse-postgres psql -U agentverse -d agentverse

# Restore from compressed file
gunzip -c backup.sql.gz | docker exec -i agent-verse-postgres psql -U agentverse -d agentverse

# Restore from custom format
docker exec -i agent-verse-postgres pg_restore -U agentverse -d agentverse < backup.dump
```

### Database Migrations

```bash
# Create new migration (local development)
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (DELETES ALL DATA!)
npx prisma migrate reset
```

### Inspecting Database

```bash
# View database schema
npx prisma db pull

# Open Prisma Studio (GUI)
npx prisma studio
```

## Troubleshooting

### Connection Errors

**Problem**: `ECONNREFUSED` or "Connection refused"

**Solution**:
```bash
# 1. Check PostgreSQL is running
docker-compose ps

# 2. Check PostgreSQL health
docker exec agent-verse-postgres pg_isready -U agentverse

# 3. Verify DATABASE_URL uses "postgres" hostname (not "localhost")
echo $DATABASE_URL
# Should be: postgresql://agentverse:password@postgres:5432/agentverse

# 4. Restart services
docker-compose restart
```

### Migration Errors

**Problem**: "Migration failed" or "Schema validation error"

**Solution**:
```bash
# 1. Verify Prisma schema is valid
npx prisma validate

# 2. Check provider matches database type
# Edit prisma/schema.prisma:
# provider = "postgresql"  # For Docker
# provider = "sqlite"      # For local dev

# 3. Reset database and reapply migrations
docker-compose down -v
docker-compose up -d
```

### Provider Mismatch

**Problem**: "The provided database string is invalid"

**Solution**:
```bash
# SQLite URL with PostgreSQL provider
# Edit prisma/schema.prisma:
datasource db {
  provider = "sqlite"  # Change to match DATABASE_URL
}

# Or update DATABASE_URL to match provider
```

### Permission Errors

**Problem**: "permission denied" or "role does not exist"

**Solution**:
```bash
# 1. Verify credentials in .env match docker-compose.yml
grep POSTGRES .env

# 2. Reset PostgreSQL container
docker-compose down
docker volume rm agent-verse-via-agent_postgres-data
docker-compose up -d
```

### Port Conflicts

**Problem**: "port is already allocated"

**Solution**:
```bash
# 1. Change ports in .env
PORT=3001
POSTGRES_PORT=5433

# 2. Restart services
docker-compose down
docker-compose up -d
```

### Build Failures

**Problem**: Build fails during `npm run build`

**Solution**:
```bash
# 1. Ensure schema provider matches DATABASE_URL
# For local builds with SQLite:
datasource db {
  provider = "sqlite"
}
DATABASE_URL="file:./dev.db"

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Build again
npm run build
```

## Best Practices

1. **Development vs Production**
   - Use SQLite for local development (faster, simpler)
   - Use PostgreSQL for Docker/production (scalable, robust)

2. **Security**
   - Change default `POSTGRES_PASSWORD` in production
   - Use strong `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - Never commit `.env` files to version control

3. **Migrations**
   - Always create migrations locally first
   - Test migrations before deploying
   - Commit migration files to git

4. **Backups**
   - Regular automated backups for production
   - Test restore procedures periodically
   - Store backups securely off-server

5. **Monitoring**
   - Check container health: `docker-compose ps`
   - Monitor logs: `docker-compose logs -f`
   - Set up alerts for production databases

6. **Data Persistence**
   - Use Docker volumes (never container storage)
   - Backup volumes regularly
   - Document volume backup/restore procedures

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## Summary

This PostgreSQL Docker setup provides:

✅ Production-grade PostgreSQL database
✅ Automatic database initialization
✅ Docker Compose orchestration
✅ Support for both SQLite and PostgreSQL
✅ Automatic migrations on startup
✅ Health checks and service dependencies
✅ Data persistence via Docker volumes
✅ Comprehensive documentation

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section or check the main [README.md](../README.md).
