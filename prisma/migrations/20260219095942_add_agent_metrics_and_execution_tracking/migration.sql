-- CreateTable
CREATE TABLE "AgentExecution" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "input" TEXT,
    "output" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMetrics" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "successfulExecutions" INTEGER NOT NULL DEFAULT 0,
    "failedExecutions" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "currentStatus" TEXT NOT NULL DEFAULT 'idle',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentExecution_agentId_idx" ON "AgentExecution"("agentId");

-- CreateIndex
CREATE INDEX "AgentExecution_status_idx" ON "AgentExecution"("status");

-- CreateIndex
CREATE INDEX "AgentExecution_createdAt_idx" ON "AgentExecution"("createdAt");

-- CreateIndex
CREATE INDEX "AgentExecution_agentId_createdAt_idx" ON "AgentExecution"("agentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentMetrics_agentId_key" ON "AgentMetrics"("agentId");

-- CreateIndex
CREATE INDEX "AgentMetrics_agentId_idx" ON "AgentMetrics"("agentId");

-- CreateIndex
CREATE INDEX "AgentMetrics_currentStatus_idx" ON "AgentMetrics"("currentStatus");

-- CreateIndex
CREATE INDEX "AgentMetrics_lastActivityAt_idx" ON "AgentMetrics"("lastActivityAt");

-- AddForeignKey
ALTER TABLE "AgentExecution" ADD CONSTRAINT "AgentExecution_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMetrics" ADD CONSTRAINT "AgentMetrics_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
