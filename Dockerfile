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

# Set dummy DATABASE_URL for build-time Prisma generation
# This is required for Prisma 7 which needs DATABASE_URL even though
# the actual connection happens at runtime with the real DATABASE_URL
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
# Set build timestamp - this will be embedded in the Next.js build
ARG BUILD_TIMESTAMP
ENV NEXT_PUBLIC_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies for PostgreSQL and database checking
RUN apk add --no-cache postgresql-client netcat-openbsd

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
COPY --from=builder /app/node_modules/pg ./node_modules/pg
COPY --from=builder /app/node_modules/pg-* ./node_modules/

# Copy Prisma CLI and dependencies for migrations
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# Copy valibot - required by Prisma 7 at runtime
COPY --from=builder /app/node_modules/valibot ./node_modules/valibot

# Copy additional Prisma 7 runtime dependencies
COPY --from=builder /app/node_modules/pathe ./node_modules/pathe
COPY --from=builder /app/node_modules/foreground-child ./node_modules/foreground-child
COPY --from=builder /app/node_modules/get-port-please ./node_modules/get-port-please
COPY --from=builder /app/node_modules/hono ./node_modules/hono
COPY --from=builder /app/node_modules/proper-lockfile ./node_modules/proper-lockfile
COPY --from=builder /app/node_modules/remeda ./node_modules/remeda
COPY --from=builder /app/node_modules/std-env ./node_modules/std-env
COPY --from=builder /app/node_modules/zeptomatch ./node_modules/zeptomatch
COPY --from=builder /app/node_modules/signal-exit ./node_modules/signal-exit
COPY --from=builder /app/node_modules/lru-cache ./node_modules/lru-cache

# Copy startup script
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh

# Make entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

# Expose the port (default 3000, overridable via environment variable)
EXPOSE 3000

ENV PORT=3000

# Use the startup script as entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]
