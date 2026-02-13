# AgentVerse Architecture

This document provides a comprehensive overview of the AgentVerse system architecture, including component design, data flow, and communication patterns.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Layers](#architecture-layers)
- [Agent System](#agent-system)
- [Department System](#department-system)
- [Orchestration Patterns](#orchestration-patterns)
- [Database Schema](#database-schema)
- [Communication Protocols](#communication-protocols)
- [Visualization System](#visualization-system)
- [Security Architecture](#security-architecture)

---

## System Overview

AgentVerse follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  (React Components, PixiJS Visualization, User Interface)   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                      Application Layer                       │
│      (Next.js API Routes, Request Validation, Auth)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                      Business Logic Layer                    │
│    (Agent Orchestrator, Departments, Workflow Engine)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                      Agent Layer                             │
│     (BaseAgent, Specialized Agents, Claude Integration)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                      Data Layer                              │
│          (Prisma ORM, SQLite Database, Message Queue)       │
└──────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Modularity**: Each agent type is independent and can be used standalone or in workflows
2. **Extensibility**: New agent types and departments can be added without modifying existing code
3. **Type Safety**: TypeScript throughout, with Zod validation at API boundaries
4. **Separation of Concerns**: Clear boundaries between presentation, business logic, and data
5. **Testability**: Each component can be tested independently

---

## Architecture Layers

### 1. Presentation Layer

**Location**: `/app/components/`, `/app/[routes]/page.tsx`

**Responsibilities**:
- User interface rendering
- User input handling
- Real-time visualization (Canvas & PixiJS)
- Client-side state management

**Key Components**:

| Component | Purpose | Technology |
|-----------|---------|-----------|
| `GameCanvas.tsx` | HTML5 Canvas-based agent world | Canvas API |
| `AgentVisualization.tsx` | GPU-accelerated agent rendering | PixiJS 8 |
| `CreateAgentModal.tsx` | Agent creation form | React Hook Form |
| `AgentChatDialog.tsx` | Agent conversation interface | React |
| `DepartmentCard.tsx` | Department workflow launcher | React |

**State Flow**:
```
User Action → Component State → API Call → Backend → Response → UI Update
```

### 2. Application Layer

**Location**: `/app/api/`

**Responsibilities**:
- HTTP request handling
- Request validation (Zod schemas)
- Authentication & authorization
- Response formatting
- Error handling

**API Structure**:
```
/api
├── auth/
│   └── [...nextauth]/     # NextAuth.js authentication
├── register/              # User registration
├── agents/
│   ├── GET /              # List agents
│   ├── POST /             # Create agent
│   ├── GET /:id           # Get agent details
│   ├── POST /:id/run      # Execute agent
│   ├── GET /:id/status    # Get agent status
│   └── */messages         # Message management
├── departments/
│   └── market-research/
│       ├── GET /run       # Get department info
│       └── POST /run      # Execute workflow
└── chat/
    └── POST /             # Single message chat
```

**Request Flow**:
```
1. Request arrives at API route
2. Authentication check (NextAuth session)
3. Request validation (Zod schema)
4. Rate limiting check
5. Business logic execution
6. Response formatting
7. Error handling (if needed)
```

### 3. Business Logic Layer

**Location**: `/lib/`

**Core Components**:

#### Agent Orchestrator (`orchestrator.ts`)

The central coordination system managing agent lifecycle and execution patterns.

**Class**: `AgentOrchestrator`

**Properties**:
```typescript
- agents: Map<string, BaseAgent>           // Registered agents
- executionHistory: WorkflowExecution[]    // Execution log
- messageQueues: Map<string, AgentMessage[]> // Inter-agent messages
- onUserQuery?: (query: UserQuery) => void // User interaction callback
```

**Key Methods**:

| Method | Purpose | Pattern |
|--------|---------|---------|
| `registerAgent()` | Add agent to system | Registration |
| `executeAgent()` | Run single agent | Single |
| `executePipeline()` | Sequential execution | Pipeline |
| `executeParallel()` | Concurrent execution | Parallel |
| `executeCollaborativeWorkflow()` | Structured workflow | Collaborative |
| `sendAgentMessage()` | Agent-to-agent communication | Messaging |

**Execution Patterns**:

```typescript
// Single Agent Execution
const result = await orchestrator.executeAgent(
  'researcher-1',
  'Research market trends',
  { industry: 'tech' }
);

// Pipeline (Sequential)
const results = await orchestrator.executePipeline(
  ['researcher-1', 'strategist-1', 'critic-1'],
  'Analyze product market fit'
);

// Parallel (Concurrent)
const results = await orchestrator.executeParallel(
  ['researcher-1', 'researcher-2', 'researcher-3'],
  'Gather competitive intelligence'
);

// Collaborative Workflow
const result = await orchestrator.executeCollaborativeWorkflow(
  [
    { agent: researcher, role: 'research' },
    { agent: strategist, role: 'strategy' },
    { agent: critic, role: 'evaluation' },
    { agent: ideator, role: 'innovation' }
  ],
  {
    title: 'Market Analysis',
    description: 'Complete market research',
    context: { market: 'EU', segment: 'B2B' }
  }
);
```

#### Department System (`Department.ts`, `MarketResearchDepartment.ts`)

Coordinates multiple agents in structured workflows.

**Base Department Class**:

```typescript
abstract class Department {
  protected agents: Map<AgentRole, BaseAgent> = new Map();
  protected requiredRoles: AgentRole[] = [];

  // Agent management
  registerAgent(agent: BaseAgent): void
  getAgent(role: AgentRole): BaseAgent | undefined
  isFullyStaffed(): boolean
  getMissingRoles(): AgentRole[]

  // Workflow execution
  abstract execute(input: string, context?: any): Promise<DepartmentExecutionResult>

  // Result compilation
  protected compileFinalResult(steps: WorkflowStep[]): string
}
```

**Market Research Department**:

```typescript
class MarketResearchDepartment extends Department {
  requiredRoles = ['researcher', 'strategist', 'critic', 'ideator'];

  async execute(input: string, context?: any) {
    // Step 1: Research
    const researchResult = await researcher.execute(input, context);

    // Step 2: Strategy
    const strategyResult = await strategist.execute(
      researchResult.result,
      context
    );

    // Step 3: Critique
    const critiqueResult = await critic.execute(
      strategyResult.result,
      context
    );

    // Step 4: Innovation
    const innovationResult = await ideator.execute(
      critiqueResult.result,
      context
    );

    return {
      success: true,
      steps: [researchResult, strategyResult, critiqueResult, innovationResult],
      finalResult: this.compileFinalResult(steps),
      metadata: { department: 'market-research', totalTime, timestamp }
    };
  }
}
```

### 4. Agent Layer

**Location**: `/app/agents/`

**Architecture**:

```
                    ┌──────────────┐
                    │  BaseAgent   │
                    │  (Abstract)  │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴─────┐    ┌─────┴──────┐    ┌─────┴──────┐
    │Researcher│    │ Strategist │    │   Critic   │
    └──────────┘    └────────────┘    └────────────┘
                    ┌─────┴──────┐
                    │  Ideator   │
                    └────────────┘
```

**BaseAgent Class** (`BaseAgent.ts`):

```typescript
abstract class BaseAgent {
  protected id: string;
  protected name: string;
  protected role: AgentRole;
  protected model: string;
  protected anthropic: Anthropic;

  // Core functionality
  async execute(input: string, context?: any): Promise<AgentExecutionResult>
  getStatus(): AgentStatus
  getInfo(): { id, name, role, status }

  // Inter-agent communication
  prepareMessage(content: string, toAgent?: string, taskId?: string): AgentMessage

  // Must be implemented by subclasses
  protected abstract getSystemPrompt(): string
  protected abstract enhanceInput(input: string, context?: any): string
}
```

**Specialized Agents**:

Each agent extends `BaseAgent` and implements:
1. **Custom System Prompt**: Defines role, personality, and capabilities
2. **Input Enhancement**: Adds role-specific context to inputs
3. **Optional Processing**: Custom task processing logic

Example - `ResearcherAgent.ts`:

```typescript
class ResearcherAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a thorough and analytical researcher agent.

Role: Researcher
Personality: Detail-oriented, methodical, fact-focused
Specialization: Data gathering, analysis, competitive intelligence

Your responsibilities:
- Conduct thorough research on topics
- Gather relevant data and facts
- Analyze information objectively
- Provide well-sourced insights
- Identify patterns and trends

When responding:
- Be thorough and comprehensive
- Cite sources when possible
- Present data in structured format
- Highlight key findings
- Note limitations or gaps in data`;
  }

  protected enhanceInput(input: string, context?: any): string {
    return `Research Task: ${input}

Focus Areas:
- Data collection and verification
- Competitive analysis
- Market trends
- Statistical insights
- Source credibility

${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}`;
  }
}
```

**Agent Execution Flow**:

```
1. Client calls agent.execute(input, context)
2. enhanceInput() adds role-specific context
3. getSystemPrompt() provides instructions
4. prepareMessages() formats conversation history
5. Anthropic API called with system + messages
6. Response parsed and returned
7. Execution metadata recorded
```

---

## Database Schema

**Location**: `/prisma/schema.prisma`

### Entity Relationship Diagram

```
┌─────────┐         ┌─────────┐         ┌────────────┐
│  User   │1───────*│  Agent  │1───────*│  Message   │
└─────────┘         └────┬────┘         └────────────┘
                         │
                         │*
                    ┌────┴──────┐
                    │Department │
                    └────┬──────┘
                         │
                         │1
                    ┌────┴────┐         ┌──────────────┐
                    │  Task   │*───────1│WorkflowExec  │
                    └─────────┘         └──────┬───────┘
                                               │
                                               │1
                                        ┌──────┴──────┐
                                        │WorkflowStep │
                                        └─────────────┘
```

### Core Models

#### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  agents    Agent[]
  accounts  Account[]
  sessions  Session[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Agent
```prisma
model Agent {
  id              String    @id @default(cuid())
  name            String
  description     String?
  model           String    @default("claude-3-5-sonnet-20241022")
  role            String
  personality     String?
  specialization  String?
  departmentId    String?
  userId          String
  color           String?   // Hex color for visualization
  size            Int?      // Size in pixels (10-50)
  user            User      @relation(fields: [userId], references: [id])
  department      Department? @relation(fields: [departmentId], references: [id])
  messages        Message[]
  tasksAssigned   Task[]    @relation("AssignedTasks")
  tasksCreated    Task[]    @relation("CreatedTasks")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### Message
```prisma
model Message {
  id        String   @id @default(cuid())
  content   String
  role      String   // 'user' | 'assistant' | 'system'
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id])

  // Inter-agent communication
  fromAgent String?  // Agent ID of sender
  toAgent   String?  // Agent ID of recipient
  taskId    String?  // Related task
  priority  String?  // 'low' | 'medium' | 'high' | 'urgent'
  type      String?  // 'chat' | 'task' | 'query' | 'result'

  createdAt DateTime @default(now())
}
```

#### Department
```prisma
model Department {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  agents      Agent[]
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Task
```prisma
model Task {
  id           String     @id @default(cuid())
  title        String
  description  String?
  status       String     // 'pending' | 'in_progress' | 'blocked' | 'completed' | 'failed'
  priority     String     // 'low' | 'medium' | 'high' | 'urgent'
  assignedTo   String?
  createdBy    String
  departmentId String?
  assignedAgent Agent?   @relation("AssignedTasks", fields: [assignedTo], references: [id])
  createdByAgent Agent   @relation("CreatedTasks", fields: [createdBy], references: [id])
  department   Department? @relation(fields: [departmentId], references: [id])
  messages     Message[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

#### WorkflowExecution
```prisma
model WorkflowExecution {
  id            String         @id @default(cuid())
  workflowId    String
  departmentId  String?
  userId        String?
  input         String
  output        String?
  status        String         // 'pending' | 'running' | 'completed' | 'failed'
  executionTime Int?           // milliseconds
  steps         WorkflowStep[]
  createdAt     DateTime       @default(now())
  completedAt   DateTime?
}
```

#### WorkflowStep
```prisma
model WorkflowStep {
  id          String            @id @default(cuid())
  workflowId  String
  workflow    WorkflowExecution @relation(fields: [workflowId], references: [id])
  stepNumber  Int
  agentRole   String
  agentId     String?
  description String?
  input       String
  output      String?
  status      String            // 'pending' | 'running' | 'completed' | 'failed'
  error       String?
  startedAt   DateTime?
  completedAt DateTime?
}
```

---

## Communication Protocols

### 1. Client-Server Communication

**Protocol**: HTTP REST API
**Format**: JSON

**Request Structure**:
```typescript
{
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <session-token>'  // If authenticated
  },
  body: {
    // Request-specific payload
  }
}
```

**Response Structure**:
```typescript
{
  status: number,  // HTTP status code
  body: {
    success: boolean,
    data?: any,
    error?: {
      message: string,
      code: string,
      details?: any
    }
  }
}
```

### 2. Agent-to-Agent Communication

**Method 1: Direct Messaging** (via Orchestrator)

```typescript
// Send message from one agent to another
orchestrator.sendAgentMessage(
  fromAgentId: string,
  toAgentId: string,
  content: string,
  metadata?: {
    taskId?: string,
    priority?: 'low' | 'medium' | 'high' | 'urgent',
    type?: 'task' | 'query' | 'result'
  }
);

// Retrieve messages for an agent
const messages = orchestrator.getAgentMessages(agentId);

// Mark messages as processed
orchestrator.processAgentMessages(agentId);
```

**Method 2: Pipeline Output** (Sequential)

In pipeline execution, each agent receives the previous agent's output as input:

```typescript
Agent1 → Output1 → Agent2 → Output2 → Agent3 → Output3 → Final Result
```

**Method 3: Shared Context** (Collaborative)

In collaborative workflows, agents share a common context object:

```typescript
const workflow = await orchestrator.executeCollaborativeWorkflow(
  agents,
  {
    title: 'Task',
    context: {
      sharedData: 'accessible by all agents',
      previousResults: []
    }
  }
);
```

### 3. Claude API Communication

**Protocol**: Anthropic Messages API
**Format**: JSON

**Request**:
```typescript
{
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  system: '<system-prompt>',
  messages: [
    { role: 'user', content: 'User message' },
    { role: 'assistant', content: 'Previous response' },
    { role: 'user', content: 'Current message' }
  ]
}
```

**Response**:
```typescript
{
  id: 'msg_xxx',
  type: 'message',
  role: 'assistant',
  content: [
    { type: 'text', text: '<agent-response>' }
  ],
  model: 'claude-3-5-sonnet-20241022',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 1234,
    output_tokens: 567
  }
}
```

---

## Visualization System

### Canvas-Based Visualization (`GameCanvas.tsx`)

**Purpose**: HTML5 Canvas 2D physics simulation

**Architecture**:
```typescript
interface VisualAgent {
  id: string;
  name: string;
  role: AgentRole;
  x: number;        // Position X
  y: number;        // Position Y
  vx: number;       // Velocity X
  vy: number;       // Velocity Y
  speed: number;    // Movement speed
  isPaused: boolean;
  size: number;     // Radius
  color: string;    // Hex color
}
```

**Physics Simulation**:
```typescript
// Movement
agent.x += agent.vx * deltaTime;
agent.y += agent.vy * deltaTime;

// Wall collision
if (agent.x < 0 || agent.x > worldWidth) {
  agent.vx *= -1;  // Reverse direction
}

// Agent collision
const distance = Math.sqrt((dx * dx) + (dy * dy));
if (distance < agent1.size + agent2.size) {
  // Bounce apart
  const angle = Math.atan2(dy, dx);
  agent1.vx = -Math.cos(angle) * agent1.speed;
  agent1.vy = -Math.sin(angle) * agent1.speed;
}
```

**Rendering Loop**:
```typescript
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  drawGrid();

  // Update physics
  agents.forEach(updateAgentPhysics);

  // Draw agents
  agents.forEach(drawAgent);

  // Draw UI overlays
  drawHoverTooltip();
  drawSelectionIndicator();

  requestAnimationFrame(render);
}
```

### PixiJS Visualization (`AgentVisualization.tsx`)

**Purpose**: GPU-accelerated interactive visualization

**Architecture**:
```typescript
// PixiJS Application
const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x1a1a1a
});

// Agent Sprite
const agentSprite = new PIXI.Graphics();
agentSprite.beginFill(color);
agentSprite.drawCircle(0, 0, agent.size);
agentSprite.endFill();
agentSprite.interactive = true;
agentSprite.buttonMode = true;

// Text Label
const label = new PIXI.Text(agent.name, {
  fontFamily: 'Arial',
  fontSize: 12,
  fill: 0xffffff
});
```

**Interaction System**:
```typescript
// Click selection
agentSprite.on('pointerdown', (event) => {
  if (event.data.originalEvent.ctrlKey || event.data.originalEvent.metaKey) {
    // Multi-select
    toggleAgentSelection(agent.id);
  } else {
    // Single select
    selectAgent(agent.id);
  }
});

// Hover effect
agentSprite.on('pointerover', () => {
  agentSprite.scale.set(1.1);  // 10% size increase
});

// Drag-to-select rectangle
app.stage.on('pointermove', (event) => {
  if (isDragging) {
    updateSelectionRectangle(startPos, currentPos);
    selectAgentsInRectangle();
  }
});
```

---

## Security Architecture

### Authentication Flow

```
1. User submits credentials → /api/auth/[...nextauth]
2. NextAuth.js validates credentials
3. bcrypt compares password hash
4. JWT session token generated
5. Session stored in database
6. Cookie set with secure flags
7. Subsequent requests include session cookie
8. Middleware validates session on protected routes
```

### Authorization Layers

| Layer | Check | Implementation |
|-------|-------|----------------|
| **Route Level** | User authentication | NextAuth middleware |
| **Resource Level** | Agent ownership | User ID validation |
| **Action Level** | Operation permissions | Role-based checks |

### Data Protection

1. **Password Hashing**: bcrypt with salt rounds
2. **Session Encryption**: JWT with NEXTAUTH_SECRET
3. **SQL Injection**: Prisma parameterized queries
4. **XSS**: React auto-escaping
5. **CSRF**: NextAuth built-in protection

### Rate Limiting

```typescript
// Rate limit configuration
const rateLimits = {
  '/api/agents': { max: 100, window: 60000 },      // 100 req/min
  '/api/departments/*': { max: 20, window: 60000 }, // 20 req/min
  '/api/chat': { max: 50, window: 60000 }           // 50 req/min
};

// Check rate limit
const { success, remaining, retryAfter } = await checkRateLimit(
  userId,
  endpoint
);
```

---

## Extensibility Points

### Adding New Agent Types

1. Create new agent class extending `BaseAgent`
2. Implement `getSystemPrompt()` and `enhanceInput()`
3. Add role to `AgentRole` enum in `/types/index.ts`
4. Update color scheme in `/types/visualization.ts`
5. Register with orchestrator

### Adding New Departments

1. Create new department class extending `Department`
2. Define `requiredRoles` array
3. Implement `execute()` workflow method
4. Create API route in `/app/api/departments/[name]/`
5. Build frontend interface in `/app/departments/[name]/`

### Adding New Execution Patterns

1. Add method to `AgentOrchestrator` class
2. Define execution logic and result format
3. Update `WorkflowExecution` schema if needed
4. Create tests for new pattern

---

## Performance Considerations

### Database Optimization

- Indexes on frequently queried fields (userId, agentId, departmentId)
- Message history limited to last 20 messages per agent
- Workflow execution history paginated

### API Optimization

- Response caching for static data
- Request batching for parallel operations
- Streaming responses for long-running workflows

### Frontend Optimization

- React component memoization
- PixiJS sprite pooling
- Canvas rendering throttling
- Lazy loading of agent data

---

## Monitoring & Observability

### Metrics Tracked

- Agent execution time
- Workflow completion rate
- API response times
- Error rates by endpoint
- Claude API token usage

### Logging

- Structured logging with timestamps
- Error stack traces
- User actions audit trail
- Workflow execution logs

---

## Summary

AgentVerse's architecture is designed for:

- **Modularity**: Independent, reusable components
- **Scalability**: Horizontal agent scaling
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy addition of new agents and workflows
- **Reliability**: Comprehensive error handling and logging
- **Security**: Multi-layer protection and authentication

The system leverages modern technologies (Next.js, TypeScript, Prisma, Claude AI) to create a robust multi-agent collaboration platform.
