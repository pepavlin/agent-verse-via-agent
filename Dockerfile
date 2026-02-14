# Dockerfile for Next.js Application
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set dummy DATABASE_URL for Prisma client generation during build
# The real DATABASE_URL will be provided at runtime
ENV DATABASE_URL="file:./build-dummy.db"

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/@libsql ./node_modules/@libsql

# Copy Prisma CLI and dependencies for migrations
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# Copy startup script
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh

# Create directory for database and set permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Make entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

# Expose the port (default 3000, overridable via environment variable)
EXPOSE 3000

ENV PORT=3000

# Use the startup script as entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]
