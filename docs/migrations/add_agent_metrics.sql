-- Migration: Add AgentMetrics table for tracking agent performance
-- Date: 2026-02-19
-- Description: This migration adds a new table to track agent execution metrics,
--              including status, execution time, success/failure, and error messages.

CREATE TABLE "AgentMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "executionTime" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX "AgentMetrics_agentId_idx" ON "AgentMetrics"("agentId");
CREATE INDEX "AgentMetrics_status_idx" ON "AgentMetrics"("status");
CREATE INDEX "AgentMetrics_createdAt_idx" ON "AgentMetrics"("createdAt");
CREATE INDEX "AgentMetrics_agentId_createdAt_idx" ON "AgentMetrics"("agentId", "createdAt");

-- Note: This migration needs to be applied to your database before the dashboard will work.
-- For PostgreSQL: Run this SQL against your database
-- For SQLite: Prisma will handle this automatically with `prisma db push`
