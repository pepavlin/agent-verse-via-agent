# Quick Start: PostgreSQL Docker Setup

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed
- Anthropic API key

## Option 1: Docker with PostgreSQL (Recommended for Production)

```bash
# 1. Navigate to repository
cd agent-verse-via-agent

# 2. Update Prisma schema provider to PostgreSQL
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# 3. Copy and configure environment variables
cp .env.example .env

# 4. Edit .env and set your API keys
# Required changes:
# - ANTHROPIC_API_KEY=your_actual_api_key
# - NEXTAUTH_SECRET=$(openssl rand -base64 32)
# - POSTGRES_PASSWORD=your_secure_password (change from default!)

# 5. Start Docker services
docker-compose up -d

# 6. View application logs
docker-compose logs -f app

# 7. Open browser
# Navigate to: http://localhost:3000
```

## Option 2: Local Development with SQLite

```bash
# 1. Navigate to repository
cd agent-verse-via-agent

# 2. Ensure Prisma schema uses SQLite (default)
# Check prisma/schema.prisma has: provider = "sqlite"

# 3. Copy and configure environment variables
cp .env.example .env

# 4. Edit .env and update
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY=your_actual_api_key
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 5. Install dependencies
npm install

# 6. Start development server
npm run dev

# 7. Open browser
# Navigate to: http://localhost:3000
```

## Verify Setup

```bash
# Check services are running (Docker)
docker-compose ps

# Check database connection (Docker)
docker exec agent-verse-postgres psql -U agentverse -d agentverse -c "SELECT 1;"

# Check database connection (Local)
npx prisma db execute --stdin <<< "SELECT 1;"

# View logs (Docker)
docker-compose logs -f

# View build info
curl http://localhost:3000/api/deployment-info
```

## Next Steps

1. Register a user at http://localhost:3000/register
2. Login at http://localhost:3000/login
3. Create agents at http://localhost:3000/agents
4. Run workflows at http://localhost:3000/departments

## Documentation

- **Complete Guide**: [docs/POSTGRESQL_SETUP.md](docs/POSTGRESQL_SETUP.md)
- **Database Switching**: [docs/DATABASE_SWITCH_GUIDE.md](docs/DATABASE_SWITCH_GUIDE.md)
- **Docker Setup**: [docs/DOCKER_DATABASE_SETUP.md](docs/DOCKER_DATABASE_SETUP.md)
- **Implementation Summary**: [docs/SETUP_SUMMARY.md](docs/SETUP_SUMMARY.md)

## Troubleshooting

**Connection refused?**
```bash
docker-compose restart postgres
docker-compose logs postgres
```

**Migration failed?**
```bash
# Verify provider matches DATABASE_URL
grep "provider =" prisma/schema.prisma
grep "DATABASE_URL=" .env
```

**Port conflict?**
```bash
# Change ports in .env
PORT=3001
POSTGRES_PORT=5433
docker-compose down && docker-compose up -d
```

## Support

For detailed troubleshooting, see [docs/POSTGRESQL_SETUP.md](docs/POSTGRESQL_SETUP.md#troubleshooting)
