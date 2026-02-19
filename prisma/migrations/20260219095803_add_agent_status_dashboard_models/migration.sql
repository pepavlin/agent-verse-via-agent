-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "model" TEXT NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "personality" TEXT,
    "role" TEXT,
    "specialization" TEXT,
    "departmentId" TEXT,
    "color" TEXT DEFAULT '#a855f7',
    "size" INTEGER DEFAULT 20,
    CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Agent_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromAgent" TEXT,
    "toAgent" TEXT,
    "taskId" TEXT,
    "priority" TEXT,
    "type" TEXT,
    CONSTRAINT "Message_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedTo" TEXT,
    "createdBy" TEXT,
    "departmentId" TEXT,
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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

-- CreateTable
CREATE TABLE "AgentMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTimeMs" INTEGER,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "successfulExecs" INTEGER NOT NULL DEFAULT 0,
    "failedExecs" INTEGER NOT NULL DEFAULT 0,
    "messagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "periodType" TEXT NOT NULL DEFAULT 'hourly',
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentStatusLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "taskId" TEXT,
    "workflowId" TEXT,
    "duration" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "context" TEXT,
    "taskId" TEXT,
    "workflowId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Agent_userId_idx" ON "Agent"("userId");

-- CreateIndex
CREATE INDEX "Agent_role_idx" ON "Agent"("role");

-- CreateIndex
CREATE INDEX "Agent_departmentId_idx" ON "Agent"("departmentId");

-- CreateIndex
CREATE INDEX "Agent_userId_role_idx" ON "Agent"("userId", "role");

-- CreateIndex
CREATE INDEX "Message_agentId_idx" ON "Message"("agentId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_agentId_createdAt_idx" ON "Message"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_taskId_idx" ON "Message"("taskId");

-- CreateIndex
CREATE INDEX "Message_fromAgent_idx" ON "Message"("fromAgent");

-- CreateIndex
CREATE INDEX "Message_toAgent_idx" ON "Message"("toAgent");

-- CreateIndex
CREATE INDEX "Task_assignedTo_idx" ON "Task"("assignedTo");

-- CreateIndex
CREATE INDEX "Task_createdBy_idx" ON "Task"("createdBy");

-- CreateIndex
CREATE INDEX "Task_departmentId_idx" ON "Task"("departmentId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_status_priority_idx" ON "Task"("status", "priority");

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

-- CreateIndex
CREATE INDEX "AgentMetrics_agentId_idx" ON "AgentMetrics"("agentId");

-- CreateIndex
CREATE INDEX "AgentMetrics_timestamp_idx" ON "AgentMetrics"("timestamp");

-- CreateIndex
CREATE INDEX "AgentMetrics_agentId_timestamp_idx" ON "AgentMetrics"("agentId", "timestamp");

-- CreateIndex
CREATE INDEX "AgentMetrics_periodType_periodStart_idx" ON "AgentMetrics"("periodType", "periodStart");

-- CreateIndex
CREATE INDEX "AgentStatusLog_agentId_idx" ON "AgentStatusLog"("agentId");

-- CreateIndex
CREATE INDEX "AgentStatusLog_timestamp_idx" ON "AgentStatusLog"("timestamp");

-- CreateIndex
CREATE INDEX "AgentStatusLog_agentId_timestamp_idx" ON "AgentStatusLog"("agentId", "timestamp");

-- CreateIndex
CREATE INDEX "AgentStatusLog_status_idx" ON "AgentStatusLog"("status");

-- CreateIndex
CREATE INDEX "AgentStatusLog_taskId_idx" ON "AgentStatusLog"("taskId");

-- CreateIndex
CREATE INDEX "AgentStatusLog_workflowId_idx" ON "AgentStatusLog"("workflowId");

-- CreateIndex
CREATE INDEX "ErrorLog_agentId_idx" ON "ErrorLog"("agentId");

-- CreateIndex
CREATE INDEX "ErrorLog_timestamp_idx" ON "ErrorLog"("timestamp");

-- CreateIndex
CREATE INDEX "ErrorLog_agentId_timestamp_idx" ON "ErrorLog"("agentId", "timestamp");

-- CreateIndex
CREATE INDEX "ErrorLog_errorType_idx" ON "ErrorLog"("errorType");

-- CreateIndex
CREATE INDEX "ErrorLog_resolved_idx" ON "ErrorLog"("resolved");

-- CreateIndex
CREATE INDEX "ErrorLog_taskId_idx" ON "ErrorLog"("taskId");

-- CreateIndex
CREATE INDEX "ErrorLog_workflowId_idx" ON "ErrorLog"("workflowId");
