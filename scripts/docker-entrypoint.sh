#!/bin/sh
set -e

echo "🚀 Starting Agent Verse application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL is not set, using default"
  export DATABASE_URL="file:/app/data/production.db"
fi

echo "📁 Database URL: $DATABASE_URL"

# Detect database type (PostgreSQL or SQLite)
if echo "$DATABASE_URL" | grep -q "^postgresql://"; then
  echo "🐘 PostgreSQL database detected"

  # Wait for PostgreSQL to be ready (extra safety beyond depends_on healthcheck)
  echo "⏳ Waiting for PostgreSQL to be ready..."
  for i in 1 2 3 4 5; do
    if npx prisma db execute --stdin <<EOF 2>/dev/null
SELECT 1;
EOF
    then
      echo "✅ PostgreSQL is ready"
      break
    else
      echo "   Attempt $i/5 - PostgreSQL not ready yet, waiting..."
      sleep 2
    fi
  done

elif echo "$DATABASE_URL" | grep -q "^file:"; then
  echo "📄 SQLite database detected"

  # Extract database file path from DATABASE_URL (remove file: prefix)
  DB_FILE=$(echo "$DATABASE_URL" | sed 's/file://')
  DB_DIR=$(dirname "$DB_FILE")

  # Ensure database directory exists and has proper permissions
  echo "📂 Ensuring database directory exists: $DB_DIR"
  mkdir -p "$DB_DIR"

  # Check if database file exists
  if [ -f "$DB_FILE" ]; then
    echo "✅ Database file exists: $DB_FILE"
  else
    echo "🆕 Database file does not exist, will be created during migration"
  fi
else
  echo "⚠️  Unknown database type in DATABASE_URL"
fi

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
if npx prisma migrate deploy; then
  echo "✅ Prisma migrations completed successfully"
else
  echo "⚠️  Prisma migrate deploy failed, trying prisma db push..."
  if npx prisma db push --accept-data-loss; then
    echo "✅ Database schema pushed successfully"
  else
    echo "❌ Failed to initialize database schema"
    exit 1
  fi
fi

# Verify database connection
echo "🔍 Verifying database connection..."
if npx prisma db execute --stdin <<EOF
SELECT 1 as test;
EOF
then
  echo "✅ Database connection verified"
else
  echo "⚠️  Could not verify database connection, but continuing..."
fi

# Start the application
echo "🎯 Starting Next.js application..."
exec node server.js
