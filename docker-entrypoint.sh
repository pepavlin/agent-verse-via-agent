#!/bin/sh
set -e

# Apply any pending database migrations before starting the server.
# For SQLite the database file is created automatically on first run.
echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Starting Next.js server..."
exec node server.js
