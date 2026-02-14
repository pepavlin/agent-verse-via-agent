# Quick Database Switching Guide

This guide provides quick commands for switching between SQLite (local development) and PostgreSQL (Docker/production).

## Switch to PostgreSQL (Docker)

```bash
# 1. Update schema provider
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# 2. Verify .env has PostgreSQL configuration
cat > .env << 'EOF'
# PostgreSQL Configuration
POSTGRES_DB=agentverse
POSTGRES_USER=agentverse
POSTGRES_PASSWORD=agentverse_password
POSTGRES_PORT=5432

# Database Connection
DATABASE_URL=postgresql://agentverse:agentverse_password@postgres:5432/agentverse?schema=public

# Application
PORT=3000
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
EOF

# 3. Generate Prisma client
npx prisma generate

# 4. Start Docker services
docker-compose up -d

# 5. View logs
docker-compose logs -f app
```

## Switch to SQLite (Local Development)

```bash
# 1. Update schema provider
sed -i 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma

# 2. Verify .env has SQLite configuration
cat > .env << 'EOF'
# Database Connection
DATABASE_URL=file:./dev.db

# Application
PORT=3000
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
EOF

# 3. Generate Prisma client
npx prisma generate

# 4. Start development server
npm run dev
```

## Verify Current Configuration

```bash
# Check schema provider
grep 'provider =' prisma/schema.prisma

# Check DATABASE_URL
grep 'DATABASE_URL=' .env

# Test database connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

## Key Points

⚠️ **IMPORTANT**: The Prisma schema `provider` field must match your DATABASE_URL:
- `provider = "postgresql"` for PostgreSQL URLs (`postgresql://...`)
- `provider = "sqlite"` for SQLite URLs (`file:...`)

✅ The Prisma client (`lib/prisma.ts`) automatically detects the database type and configures itself accordingly.

✅ Docker entrypoint script (`scripts/docker-entrypoint.sh`) handles both database types automatically.

## Common Issues

### "provider mismatch" error
- Check that `prisma/schema.prisma` provider matches `DATABASE_URL` format
- Run `npx prisma generate` after changing provider

### Build fails
- Ensure provider is set correctly before running `npm run build`
- For local builds, use SQLite
- For Docker builds, use PostgreSQL

### Connection refused
- For PostgreSQL, ensure Docker services are running: `docker-compose ps`
- For SQLite, ensure database file path is correct in `DATABASE_URL`
