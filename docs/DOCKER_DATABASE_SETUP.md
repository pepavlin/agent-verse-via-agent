# Docker Database Setup

## Automatic Database Initialization

This document describes how the PostgreSQL database is automatically initialized when running the application with Docker Compose.

## Overview

The application uses a PostgreSQL database when running in Docker, providing:
- **Production-grade reliability**: PostgreSQL is a robust, ACID-compliant database
- **Better performance**: Optimized for concurrent access and large datasets
- **Advanced features**: Full-text search, JSON support, and complex queries
- **Data persistence**: Automatic volume management for data durability

## Problem Solved

Previously, when running the application with `docker-compose up`, the database setup required manual steps. Now, the PostgreSQL database is automatically configured and initialized, with all migrations applied on first startup.

## Solution

The application uses Docker Compose to orchestrate two services:

1. **PostgreSQL Database** (`postgres` service):
   - PostgreSQL 16 Alpine image
   - Automatic health checks
   - Persistent data volume
   - Network isolation

2. **Application** (`app` service):
   - Waits for database to be healthy
   - Automatic migrations on startup
   - Configured with proper DATABASE_URL

### Startup Script (`scripts/docker-entrypoint.sh`)

The entrypoint script automatically:

1. ✅ Detects the database type (PostgreSQL or SQLite)
2. ✅ Waits for PostgreSQL to be ready
3. ✅ Runs Prisma migrations (`prisma migrate deploy`)
4. ✅ Falls back to `prisma db push` if migrations fail
5. ✅ Verifies database connection
6. ✅ Starts the Next.js application

The startup log looks like this:

```bash
🚀 Starting Agent Verse application...
📁 Database URL: postgresql://agentverse:***@postgres:5432/agentverse?schema=public
🐘 PostgreSQL database detected
⏳ Waiting for PostgreSQL to be ready...
✅ PostgreSQL is ready
🔄 Running Prisma migrations...
✅ Prisma migrations completed successfully
🔍 Verifying database connection...
✅ Database connection verified
🎯 Starting Next.js application...
```

## Architecture

### Docker Compose Services

```yaml
services:
  postgres:
    - PostgreSQL 16 Alpine
    - Port 5432 (configurable)
    - Health checks with pg_isready
    - Persistent volume: postgres-data

  app:
    - Next.js application
    - Depends on postgres (waits for healthy)
    - Automatic migrations on startup
    - Port 3000 (configurable)
```

### Network Flow

```
┌─────────────────────────────────────┐
│   Host Machine                      │
│   └─ Port 3000 → app:3000          │
│   └─ Port 5432 → postgres:5432     │
└─────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────┐
│   Docker Network: agent-verse-network│
│                                     │
│   ┌─────────────┐  ┌─────────────┐ │
│   │   postgres  │  │     app     │ │
│   │   (DB)      │←─│  (Next.js)  │ │
│   │   :5432     │  │   :3000     │ │
│   └─────────────┘  └─────────────┘ │
└─────────────────────────────────────┘
         │
┌────────┴────────┐
│  Docker Volumes │
│  postgres-data  │
└─────────────────┘
```

## Usage

### Initial Setup

1. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with required values**:
   ```env
   # PostgreSQL Configuration
   POSTGRES_DB=agentverse
   POSTGRES_USER=agentverse
   POSTGRES_PASSWORD=your_secure_password_here  # Change this!

   # Application Configuration
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   NEXTAUTH_SECRET=your_nextauth_secret_here  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL=http://localhost:3000
   ```

### Starting the Application

Start both PostgreSQL and the application:
```bash
docker-compose up -d
```

The first startup will:
1. Pull PostgreSQL 16 Alpine image (if not cached)
2. Build the Next.js application image
3. Create the PostgreSQL container and initialize the database
4. Wait for PostgreSQL to be healthy
5. Start the application container
6. Run all Prisma migrations automatically
7. Start the Next.js server

View logs:
```bash
# All services
docker-compose logs -f

# Just the application
docker-compose logs -f app

# Just the database
docker-compose logs -f postgres
```

### Stopping the Application

```bash
# Stop containers (data persists)
docker-compose down

# Stop and remove volumes (deletes all data!)
docker-compose down -v
```

### Rebuilding After Schema Changes

If you modify the Prisma schema:

1. Create a new migration locally:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. Rebuild and restart:
   ```bash
   docker-compose up -d --build
   ```

The new migrations will be automatically applied on startup.

### Database Management

**Access PostgreSQL directly**:
```bash
docker exec -it agent-verse-postgres psql -U agentverse -d agentverse
```

**Create a database backup**:
```bash
docker exec agent-verse-postgres pg_dump -U agentverse agentverse > backup.sql
```

**Restore from backup**:
```bash
cat backup.sql | docker exec -i agent-verse-postgres psql -U agentverse -d agentverse
```

**Reset the database completely**:
```bash
# WARNING: This deletes all data!
docker-compose down -v
docker-compose up -d
```

## Database Persistence

PostgreSQL data is stored in a Docker volume named `postgres-data`, which persists between container restarts:

- ✅ Data is preserved when stopping/starting containers
- ✅ Data is preserved when rebuilding application images
- ✅ Data survives even if the postgres container is removed
- ❌ Data is lost only when explicitly running `docker-compose down -v`

**Volume location**:
```bash
# Inspect volume
docker volume inspect agent-verse-via-agent_postgres-data

# Backup volume
docker run --rm -v agent-verse-via-agent_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v agent-verse-via-agent_postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

## Troubleshooting

### "Connection refused" or "ECONNREFUSED"

If the application can't connect to PostgreSQL:
1. Check PostgreSQL health: `docker-compose ps`
2. Ensure postgres service is healthy before app starts
3. Verify DATABASE_URL uses `postgres` as hostname (not `localhost`)
4. Check network configuration in docker-compose.yml

### "Migration failed" error

If you see migration errors:
1. Check that your `prisma/schema.prisma` is valid
2. Ensure provider is set to "postgresql"
3. Verify all migration files are included in the Docker image
4. Check migration lock file: `prisma/migrations/migration_lock.toml`
5. Try running `docker-compose down -v` to start fresh

### "role does not exist" error

If PostgreSQL reports missing user:
1. Verify POSTGRES_USER matches in .env
2. Ensure DATABASE_URL uses the correct username
3. Reset database: `docker-compose down -v && docker-compose up`

### Application starts before database is ready

If you see "database is not ready" errors:
1. Check that `depends_on` with `condition: service_healthy` is configured
2. Verify PostgreSQL healthcheck is working
3. The startup script includes additional retry logic
4. Increase `start_period` in healthcheck if needed

### Tables not being created

If tables aren't created but no errors appear:
1. Check container logs: `docker-compose logs app`
2. Verify DATABASE_URL is correctly set in docker-compose.yml
3. Ensure Prisma migrations exist in `prisma/migrations/`
4. Check that migration_lock.toml has `provider = "postgresql"`

### Port conflict (port already in use)

If port 5432 or 3000 is already in use:
1. Change ports in .env:
   ```env
   PORT=3001
   POSTGRES_PORT=5433
   ```
2. Rebuild: `docker-compose up -d`

## Environment Variables

### Required Variables

- `POSTGRES_DB`: Database name (default: `agentverse`)
- `POSTGRES_USER`: Database user (default: `agentverse`)
- `POSTGRES_PASSWORD`: Database password (default: `agentverse_password`, **CHANGE IN PRODUCTION**)
- `ANTHROPIC_API_KEY`: API key for Anthropic Claude
- `NEXTAUTH_SECRET`: Secret for NextAuth.js (generate with: `openssl rand -base64 32`)

### Optional Variables

- `PORT`: Application port (default: `3000`)
- `POSTGRES_PORT`: PostgreSQL port (default: `5432`)
- `NEXTAUTH_URL`: Base URL for authentication (default: `http://localhost:3000`)
- `DATABASE_URL`: Full PostgreSQL connection string (auto-generated from other vars if not set)

## Technical Details

### Migration Strategy

The startup script uses a two-tier approach:

1. **Primary**: `prisma migrate deploy`
   - Applies all pending migrations from `prisma/migrations/`
   - Safe for production
   - Preserves data
   - Transactional (all-or-nothing)

2. **Fallback**: `prisma db push --accept-data-loss`
   - Used if no migrations exist or migrate deploy fails
   - Syncs schema directly to database
   - Useful for development and initial setup

### Health Check Strategy

**PostgreSQL Health Check**:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U agentverse -d agentverse"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

**Application Health Check**:
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Database Wait Logic

The startup script includes additional safety:
```bash
# Wait for PostgreSQL (beyond depends_on healthcheck)
for i in 1 2 3 4 5; do
  if npx prisma db execute --stdin <<EOF
SELECT 1;
EOF
  then
    echo "✅ PostgreSQL is ready"
    break
  else
    sleep 2
  fi
done
```

### File Structure

```
agent-verse-via-agent/
├── Dockerfile                          # Multi-stage build with Prisma support
├── docker-compose.yml                  # Two-service stack (postgres + app)
├── scripts/
│   └── docker-entrypoint.sh           # DB initialization (PostgreSQL/SQLite aware)
├── prisma/
│   ├── schema.prisma                   # Database schema (provider: postgresql)
│   └── migrations/                     # Migration files
│       ├── migration_lock.toml         # Provider lock (postgresql)
│       ├── 20260212115750_init/
│       ├── 20260213004146_add_agentverse_fields/
│       └── ...
└── .env.example                        # Environment template with PostgreSQL config
```

## Best Practices

1. **Always commit migrations**: Ensure migration files are checked into git
2. **Change default passwords**: Update `POSTGRES_PASSWORD` for production
3. **Use volumes for persistence**: Never store databases in container layers
4. **Monitor startup logs**: Check that migrations succeed (`docker-compose logs -f app`)
5. **Backup data regularly**: Use `pg_dump` for backups
6. **Test locally first**: Run migrations locally before deploying
7. **Use secrets management**: For production, use Docker secrets or environment files
8. **Rotate credentials**: Change database passwords periodically
9. **Limit exposed ports**: Only expose ports needed for your use case
10. **Monitor database health**: Set up monitoring for PostgreSQL in production

## Local Development vs Docker

### Local Development (SQLite)
```env
DATABASE_URL="file:./dev.db"
```
- Fast setup
- No additional services
- Good for development
- Limited to single process

### Docker (PostgreSQL)
```env
DATABASE_URL="postgresql://agentverse:password@postgres:5432/agentverse?schema=public"
```
- Production-like environment
- Better performance for concurrent users
- Full SQL feature set
- Requires Docker Compose

To switch between environments, update the Prisma schema `provider` and DATABASE_URL.

## References

- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Docker Compose Healthchecks](https://docs.docker.com/compose/compose-file/#healthcheck)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
