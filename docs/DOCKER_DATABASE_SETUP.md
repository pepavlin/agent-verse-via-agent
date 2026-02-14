# Docker Database Setup

## Automatic Database Initialization

This document describes how the SQLite database is automatically initialized when running the application with Docker Compose.

## Problem Solved

Previously, when running the application with `docker-compose up`, the application would fail with:
```
SQLITE_ERROR: no such table: main.Agent
```

This occurred because the Prisma migrations were not being run automatically during container startup.

## Solution

The application now uses a startup script (`scripts/docker-entrypoint.sh`) that automatically:

1. ✅ Checks for the DATABASE_URL environment variable
2. ✅ Creates the database directory if it doesn't exist
3. ✅ Runs Prisma migrations (`prisma migrate deploy`)
4. ✅ Falls back to `prisma db push` if migrations fail
5. ✅ Verifies that tables were created successfully
6. ✅ Starts the Next.js application

## How It Works

### Startup Script (`scripts/docker-entrypoint.sh`)

The entrypoint script performs these steps in order:

```bash
🚀 Starting Agent Verse application...
📁 Database URL: file:/app/data/production.db
📂 Ensuring database directory exists: /app/data
🆕 Database file does not exist, will be created during migration
🔄 Running Prisma migrations...
✅ Prisma migrations completed successfully
🔍 Verifying database tables...
✅ Database tables verified
🎯 Starting Next.js application...
```

### Dockerfile Changes

The Dockerfile now:
- Copies the Prisma CLI and dependencies needed for running migrations
- Copies the `docker-entrypoint.sh` startup script
- Sets the script as executable
- Uses the script as the container's ENTRYPOINT

### Docker Compose Configuration

The `docker-compose.yml` configures:
- A persistent volume (`db-data`) mounted at `/app/data` for database persistence
- Environment variable `DATABASE_URL=file:/app/data/production.db`
- Proper permissions for the database directory

## Usage

### Starting the Application

Simply run:
```bash
docker-compose up
```

The database will be automatically initialized on first startup. Subsequent starts will use the existing database.

### Rebuilding After Schema Changes

If you modify the Prisma schema:

1. Create a new migration locally:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. Rebuild the Docker image:
   ```bash
   docker-compose build
   ```

3. Restart the application:
   ```bash
   docker-compose up
   ```

The new migrations will be automatically applied on startup.

### Resetting the Database

To completely reset the database:

```bash
# Stop and remove containers and volumes
docker-compose down -v

# Start fresh
docker-compose up
```

This will create a new database from scratch.

## Database Persistence

The database file is stored in a Docker volume named `db-data`, which persists between container restarts. This means:

- ✅ Data is preserved when stopping/starting containers
- ✅ Data is preserved when rebuilding images
- ❌ Data is lost only when explicitly running `docker-compose down -v`

## Troubleshooting

### "Migration failed" error

If you see migration errors:
1. Check that your `prisma/schema.prisma` is valid
2. Ensure all migration files are included in the Docker image
3. Try running `docker-compose down -v` to start fresh

### "Permission denied" error

If you see permission errors:
1. Ensure the volume mount is correctly configured in `docker-compose.yml`
2. Check that the user has write permissions to the mounted volume
3. The Dockerfile creates the directory with proper permissions for the `nextjs` user

### Tables not being created

If tables aren't created but no errors appear:
1. Check the container logs: `docker-compose logs app`
2. Verify the DATABASE_URL is correctly set
3. Ensure Prisma migrations exist in `prisma/migrations/`

## Environment Variables

Required environment variables for database:

- `DATABASE_URL`: Path to the SQLite database file (default: `file:/app/data/production.db`)

Optional environment variables:

- `PORT`: Application port (default: 3000)
- `ANTHROPIC_API_KEY`: API key for Anthropic Claude
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `NEXTAUTH_URL`: Base URL for authentication

## Technical Details

### Migration Strategy

The startup script uses a two-tier approach:

1. **Primary**: `prisma migrate deploy`
   - Applies all pending migrations from `prisma/migrations/`
   - Safe for production
   - Preserves data

2. **Fallback**: `prisma db push --accept-data-loss`
   - Used if no migrations exist or migrate deploy fails
   - Syncs schema directly to database
   - Useful for development

### File Structure

```
agent-verse-via-agent/
├── Dockerfile                          # Multi-stage build with Prisma support
├── docker-compose.yml                  # Service definition with volume mounts
├── scripts/
│   └── docker-entrypoint.sh           # Database initialization script
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── migrations/                     # Migration files
│       ├── 20260212115750_init/
│       ├── 20260213004146_add_agentverse_fields/
│       └── ...
└── data/                               # Database directory (in container)
    └── production.db                   # SQLite database file
```

## Best Practices

1. **Always commit migrations**: Ensure migration files are checked into git
2. **Test locally first**: Run migrations locally before deploying
3. **Use volumes for persistence**: Never store databases in container layers
4. **Monitor startup logs**: Check that migrations succeed
5. **Backup data**: Regularly backup the database volume

## References

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Docker Compose Volumes](https://docs.docker.com/compose/compose-file/compose-file-v3/#volumes)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
