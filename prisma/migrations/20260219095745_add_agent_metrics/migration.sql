-- CreateTable
CREATE TABLE "AgentMetric" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "agentRole" TEXT,
    "userId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "taskId" TEXT,
    "workflowId" TEXT,
    "success" BOOLEAN NOT NULL,
    "executionTime" INTEGER NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCost" INTEGER,
    "model" TEXT NOT NULL,
    "errorType" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentMetric_agentId_idx" ON "AgentMetric"("agentId");

-- CreateIndex
CREATE INDEX "AgentMetric_userId_idx" ON "AgentMetric"("userId");

-- CreateIndex
CREATE INDEX "AgentMetric_agentRole_idx" ON "AgentMetric"("agentRole");

-- CreateIndex
CREATE INDEX "AgentMetric_success_idx" ON "AgentMetric"("success");

-- CreateIndex
CREATE INDEX "AgentMetric_operationType_idx" ON "AgentMetric"("operationType");

-- CreateIndex
CREATE INDEX "AgentMetric_createdAt_idx" ON "AgentMetric"("createdAt");

-- CreateIndex
CREATE INDEX "AgentMetric_agentId_createdAt_idx" ON "AgentMetric"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentMetric_userId_createdAt_idx" ON "AgentMetric"("userId", "createdAt");
