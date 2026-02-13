-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "executionTime" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowExecutionId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "agentRole" TEXT NOT NULL,
    "agentId" TEXT,
    "description" TEXT NOT NULL,
    "input" TEXT,
    "output" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "WorkflowStep_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "context" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" DATETIME,
    "timeoutAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowExecution_workflowId_key" ON "WorkflowExecution"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_userId_idx" ON "WorkflowExecution"("userId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_departmentId_idx" ON "WorkflowExecution"("departmentId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_createdAt_idx" ON "WorkflowExecution"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowExecutionId_idx" ON "WorkflowStep"("workflowExecutionId");

-- CreateIndex
CREATE INDEX "WorkflowStep_status_idx" ON "WorkflowStep"("status");

-- CreateIndex
CREATE INDEX "UserQuery_workflowId_idx" ON "UserQuery"("workflowId");

-- CreateIndex
CREATE INDEX "UserQuery_agentId_idx" ON "UserQuery"("agentId");

-- CreateIndex
CREATE INDEX "UserQuery_status_idx" ON "UserQuery"("status");
