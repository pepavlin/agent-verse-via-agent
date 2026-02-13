# AgentVerse API Documentation

Complete REST API reference for the AgentVerse multi-agent system.

## Table of Contents

- [Authentication](#authentication)
- [Agent Management](#agent-management)
- [Agent Execution](#agent-execution)
- [Department Workflows](#department-workflows)
- [Chat Operations](#chat-operations)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

All API endpoints (except `/api/register` and `/api/auth/*`) require authentication via NextAuth.js session.

### Register User

Create a new user account.

**Endpoint**: `POST /api/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Validation Rules**:
- `email`: Valid email format, unique
- `password`: Minimum 6 characters
- `name`: Optional, max 100 characters

**Success Response** (201):
```json
{
  "message": "User created successfully",
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses**:
```json
// 400 - Validation Error
{
  "error": "Invalid email format"
}

// 409 - Conflict
{
  "error": "User with this email already exists"
}
```

### Login

Authenticate and create session.

**Endpoint**: `POST /api/auth/signin`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response** (200):
```json
{
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "expires": "2024-12-31T23:59:59.999Z"
}
```

### Logout

Destroy session.

**Endpoint**: `POST /api/auth/signout`

**Success Response** (200):
```json
{
  "message": "Signed out successfully"
}
```

---

## Agent Management

### List Agents

Get all agents for the authenticated user.

**Endpoint**: `GET /api/agents`

**Query Parameters**:
- `departmentId` (optional): Filter by department
- `role` (optional): Filter by agent role

**Success Response** (200):
```json
{
  "agents": [
    {
      "id": "cla1234567890",
      "name": "Research Assistant",
      "description": "Specializes in market research",
      "role": "researcher",
      "model": "claude-3-5-sonnet-20241022",
      "personality": "Analytical and thorough",
      "specialization": "Market analysis",
      "departmentId": "cld9876543210",
      "color": "#3b82f6",
      "size": 25,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Create Agent

Create a new AI agent.

**Endpoint**: `POST /api/agents`

**Request Body**:
```json
{
  "name": "Research Assistant",
  "description": "Specializes in market research and competitive analysis",
  "role": "researcher",
  "model": "claude-3-5-sonnet-20241022",
  "personality": "Analytical, thorough, and detail-oriented",
  "specialization": "Market analysis and trend identification",
  "departmentId": "cld9876543210",
  "color": "#3b82f6",
  "size": 25
}
```

**Field Specifications**:

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| `name` | string | Yes | 1-100 chars | - |
| `description` | string | No | Max 500 chars | - |
| `role` | enum | Yes | See [Agent Roles](#agent-roles) | - |
| `model` | enum | No | See [Claude Models](#claude-models) | `claude-3-5-sonnet-20241022` |
| `personality` | string | No | Max 1000 chars | - |
| `specialization` | string | No | Max 200 chars | - |
| `departmentId` | string | No | Valid department ID | null |
| `color` | string | No | Hex format `#RRGGBB` | Role default |
| `size` | number | No | 10-50 | 25 |

**Success Response** (201):
```json
{
  "agent": {
    "id": "cla1234567890",
    "name": "Research Assistant",
    "description": "Specializes in market research and competitive analysis",
    "role": "researcher",
    "model": "claude-3-5-sonnet-20241022",
    "personality": "Analytical, thorough, and detail-oriented",
    "specialization": "Market analysis and trend identification",
    "departmentId": "cld9876543210",
    "userId": "clu0987654321",
    "color": "#3b82f6",
    "size": 25,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:
```json
// 400 - Validation Error
{
  "error": "Invalid agent role",
  "details": {
    "field": "role",
    "value": "invalid_role",
    "expected": ["researcher", "strategist", "critic", "ideator", "coordinator", "executor"]
  }
}

// 401 - Unauthorized
{
  "error": "Authentication required"
}
```

### Get Agent Details

Retrieve detailed information about a specific agent.

**Endpoint**: `GET /api/agents/:agentId`

**Path Parameters**:
- `agentId`: Agent identifier

**Success Response** (200):
```json
{
  "agent": {
    "id": "cla1234567890",
    "name": "Research Assistant",
    "description": "Specializes in market research",
    "role": "researcher",
    "model": "claude-3-5-sonnet-20241022",
    "personality": "Analytical and thorough",
    "specialization": "Market analysis",
    "departmentId": "cld9876543210",
    "color": "#3b82f6",
    "size": 25,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "department": {
      "id": "cld9876543210",
      "name": "Market Research",
      "description": "Comprehensive market analysis team"
    },
    "messageCount": 127,
    "lastActive": "2024-01-20T15:45:00.000Z"
  }
}
```

**Error Responses**:
```json
// 404 - Not Found
{
  "error": "Agent not found"
}

// 403 - Forbidden
{
  "error": "Access denied - you don't own this agent"
}
```

### Get Agent Status

Get real-time operational status of an agent.

**Endpoint**: `GET /api/agents/:agentId/status`

**Success Response** (200):
```json
{
  "status": {
    "id": "cla1234567890",
    "name": "Research Assistant",
    "role": "researcher",
    "isActive": true,
    "currentTask": null,
    "lastExecution": "2024-01-20T15:45:00.000Z",
    "totalExecutions": 47,
    "averageExecutionTime": 3245,
    "successRate": 0.98,
    "pendingMessages": 2
  }
}
```

---

## Agent Execution

### Execute Agent

Run an agent with specific input.

**Endpoint**: `POST /api/agents/:agentId/run`

**Request Body**:
```json
{
  "input": "Analyze the competitive landscape for eco-friendly packaging solutions in the European market",
  "context": {
    "industry": "packaging",
    "geography": "Europe",
    "focus": "sustainability",
    "competitors": ["PackCo", "EcoWrap", "GreenBox"]
  }
}
```

**Field Specifications**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `input` | string | Yes | 1-10,000 characters |
| `context` | object | No | Any valid JSON object |

**Success Response** (200):
```json
{
  "result": {
    "agentId": "cla1234567890",
    "success": true,
    "result": "Based on my research analysis...\n\n## Market Overview\n...\n\n## Competitive Landscape\n...",
    "executionTime": 3245,
    "timestamp": "2024-01-20T15:45:00.000Z",
    "metadata": {
      "model": "claude-3-5-sonnet-20241022",
      "tokensUsed": 1847,
      "contextProvided": true
    }
  }
}
```

**Error Responses**:
```json
// 400 - Invalid Input
{
  "error": "Input is required",
  "code": "VALIDATION_ERROR"
}

// 429 - Rate Limit Exceeded
{
  "error": "Rate limit exceeded",
  "retryAfter": 30,
  "limit": 50,
  "remaining": 0
}

// 500 - Execution Error
{
  "error": "Agent execution failed",
  "details": "Claude API error: ...",
  "code": "EXECUTION_ERROR"
}
```

### Get Agent Messages

Retrieve conversation history for an agent.

**Endpoint**: `GET /api/agents/:agentId/messages`

**Query Parameters**:
- `limit` (optional): Number of messages to retrieve (default: 20, max: 100)
- `before` (optional): Message ID to paginate before
- `type` (optional): Filter by message type (`chat`, `task`, `query`, `result`)

**Success Response** (200):
```json
{
  "messages": [
    {
      "id": "clm1234567890",
      "content": "Analyze market trends",
      "role": "user",
      "agentId": "cla1234567890",
      "type": "chat",
      "createdAt": "2024-01-20T15:30:00.000Z"
    },
    {
      "id": "clm0987654321",
      "content": "Based on current market analysis...",
      "role": "assistant",
      "agentId": "cla1234567890",
      "type": "chat",
      "createdAt": "2024-01-20T15:31:00.000Z"
    }
  ],
  "pagination": {
    "total": 127,
    "hasMore": true,
    "nextCursor": "clm0987654321"
  }
}
```

### Send Message to Agent

Send a single message to an agent and get response.

**Endpoint**: `POST /api/agents/:agentId/messages`

**Request Body**:
```json
{
  "content": "What are the key market trends in sustainable packaging?",
  "type": "chat"
}
```

**Success Response** (200):
```json
{
  "message": {
    "id": "clm9876543210",
    "content": "Key market trends in sustainable packaging include...",
    "role": "assistant",
    "agentId": "cla1234567890",
    "type": "chat",
    "createdAt": "2024-01-20T15:45:00.000Z"
  }
}
```

---

## Department Workflows

### List Departments

Get all available departments.

**Endpoint**: `GET /api/departments`

**Success Response** (200):
```json
{
  "departments": [
    {
      "id": "market-research",
      "name": "Market Research",
      "description": "Comprehensive market analysis combining research, strategy, critique, and innovation",
      "requiredRoles": ["researcher", "strategist", "critic", "ideator"],
      "workflow": {
        "steps": [
          {
            "order": 1,
            "role": "researcher",
            "description": "Gather market data and competitive intelligence"
          },
          {
            "order": 2,
            "role": "strategist",
            "description": "Analyze findings and identify opportunities"
          },
          {
            "order": 3,
            "role": "critic",
            "description": "Evaluate strategy for risks and gaps"
          },
          {
            "order": 4,
            "role": "ideator",
            "description": "Propose innovative solutions"
          }
        ]
      },
      "capabilities": [
        "Competitive Analysis",
        "Market Trend Identification",
        "Strategic Opportunity Assessment",
        "Risk Analysis",
        "Innovation Strategy"
      ]
    }
  ]
}
```

### Get Department Status

Check if a department is fully staffed and ready.

**Endpoint**: `GET /api/departments/market-research/run`

**Success Response** (200):
```json
{
  "department": {
    "id": "market-research",
    "name": "Market Research",
    "isFullyStaffed": true,
    "requiredRoles": ["researcher", "strategist", "critic", "ideator"],
    "staffedRoles": ["researcher", "strategist", "critic", "ideator"],
    "missingRoles": [],
    "agents": [
      {
        "role": "researcher",
        "agent": {
          "id": "cla1234567890",
          "name": "Research Assistant"
        }
      },
      {
        "role": "strategist",
        "agent": {
          "id": "cla2345678901",
          "name": "Strategy Advisor"
        }
      },
      {
        "role": "critic",
        "agent": {
          "id": "cla3456789012",
          "name": "Quality Analyst"
        }
      },
      {
        "role": "ideator",
        "agent": {
          "id": "cla4567890123",
          "name": "Innovation Specialist"
        }
      }
    ]
  }
}
```

### Execute Department Workflow

Run a complete department workflow with all agents.

**Endpoint**: `POST /api/departments/market-research/run`

**Request Body**:
```json
{
  "query": "Analyze the e-commerce market for sustainable products in Europe",
  "options": {
    "targetMarket": "Europe",
    "competitors": ["CompanyA", "CompanyB", "CompanyC"],
    "timeframe": "2024-2026",
    "budget": "€500,000",
    "specificQuestions": [
      "What is the market size?",
      "Who are the main competitors?",
      "What are consumer preferences?"
    ]
  }
}
```

**Field Specifications**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Main research question (1-1000 chars) |
| `options.targetMarket` | string | No | Geographic or demographic focus |
| `options.competitors` | string[] | No | List of competitor names |
| `options.timeframe` | string | No | Time period for analysis |
| `options.budget` | string | No | Budget constraints |
| `options.specificQuestions` | string[] | No | Additional specific questions |

**Success Response** (200):
```json
{
  "result": {
    "success": true,
    "workflowId": "clw1234567890",
    "departmentId": "market-research",
    "steps": [
      {
        "stepNumber": 1,
        "agentRole": "researcher",
        "agentId": "cla1234567890",
        "description": "Market research and data gathering",
        "input": "Analyze the e-commerce market for sustainable products in Europe",
        "output": "## Market Research Results\n\n### Market Size\n...",
        "status": "completed",
        "executionTime": 3245,
        "startedAt": "2024-01-20T15:00:00.000Z",
        "completedAt": "2024-01-20T15:00:03.245Z"
      },
      {
        "stepNumber": 2,
        "agentRole": "strategist",
        "agentId": "cla2345678901",
        "description": "Strategic analysis and opportunity identification",
        "input": "## Market Research Results\n\n### Market Size\n...",
        "output": "## Strategic Analysis\n\n### Key Opportunities\n...",
        "status": "completed",
        "executionTime": 2891,
        "startedAt": "2024-01-20T15:00:03.245Z",
        "completedAt": "2024-01-20T15:00:06.136Z"
      },
      {
        "stepNumber": 3,
        "agentRole": "critic",
        "agentId": "cla3456789012",
        "description": "Critical evaluation and risk assessment",
        "input": "## Strategic Analysis\n\n### Key Opportunities\n...",
        "output": "## Critical Evaluation\n\n### Identified Risks\n...",
        "status": "completed",
        "executionTime": 2543,
        "startedAt": "2024-01-20T15:00:06.136Z",
        "completedAt": "2024-01-20T15:00:08.679Z"
      },
      {
        "stepNumber": 4,
        "agentRole": "ideator",
        "agentId": "cla4567890123",
        "description": "Innovation and creative solutions",
        "input": "## Critical Evaluation\n\n### Identified Risks\n...",
        "output": "## Innovative Solutions\n\n### Creative Approaches\n...",
        "status": "completed",
        "executionTime": 3102,
        "startedAt": "2024-01-20T15:00:08.679Z",
        "completedAt": "2024-01-20T15:00:11.781Z"
      }
    ],
    "finalResult": "# Market Research Report: E-commerce for Sustainable Products in Europe\n\n## Executive Summary\n...\n\n## Research Findings\n...\n\n## Strategic Recommendations\n...\n\n## Risk Assessment\n...\n\n## Innovation Opportunities\n...",
    "metadata": {
      "totalExecutionTime": 11781,
      "timestamp": "2024-01-20T15:00:11.781Z",
      "agentsInvolved": 4,
      "query": "Analyze the e-commerce market for sustainable products in Europe"
    }
  }
}
```

**Error Responses**:
```json
// 400 - Missing Required Roles
{
  "error": "Department not fully staffed",
  "details": {
    "missingRoles": ["critic"],
    "requiredRoles": ["researcher", "strategist", "critic", "ideator"]
  },
  "code": "DEPARTMENT_INCOMPLETE"
}

// 500 - Workflow Execution Error
{
  "error": "Workflow execution failed at step 2",
  "details": {
    "stepNumber": 2,
    "agentRole": "strategist",
    "agentId": "cla2345678901",
    "error": "Claude API error: ..."
  },
  "code": "WORKFLOW_EXECUTION_ERROR"
}
```

---

## Chat Operations

### Send Chat Message

Send a single message to an agent and get immediate response.

**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "agentId": "cla1234567890",
  "message": "What are the key trends in AI for 2024?"
}
```

**Field Specifications**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `agentId` | string | Yes | Valid agent ID |
| `message` | string | Yes | 1-10,000 characters |

**Success Response** (200):
```json
{
  "success": true,
  "response": "Based on current market analysis and technological developments, the key AI trends for 2024 include:\n\n1. **Multimodal AI**\n...\n\n2. **AI Agents**\n...",
  "messageId": "clm1234567890",
  "agentId": "cla1234567890",
  "timestamp": "2024-01-20T15:45:00.000Z"
}
```

---

## Reference Data

### Agent Roles

| Role | Description | Default Color |
|------|-------------|---------------|
| `researcher` | Data gathering and analysis | `#3b82f6` (Blue) |
| `strategist` | Planning and opportunity identification | `#a855f7` (Purple) |
| `critic` | Evaluation and quality assurance | `#ef4444` (Red) |
| `ideator` | Creative thinking and innovation | `#f59e0b` (Amber) |
| `coordinator` | Team coordination and management | `#10b981` (Green) |
| `executor` | Task execution and implementation | `#06b6d4` (Cyan) |

### Claude Models

| Model ID | Description | Use Case |
|----------|-------------|----------|
| `claude-3-5-sonnet-20241022` | Latest Sonnet (default) | General purpose, best balance |
| `claude-3-opus-20240229` | Most capable model | Complex reasoning tasks |
| `claude-3-haiku-20240307` | Fastest model | Quick responses, simple tasks |

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error-specific details
  }
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but no access |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error, check logs |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Authentication failed or missing |
| `AUTHORIZATION_ERROR` | User doesn't have access |
| `NOT_FOUND` | Requested resource not found |
| `CONFLICT` | Resource conflict (duplicate) |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `EXECUTION_ERROR` | Agent execution failed |
| `WORKFLOW_EXECUTION_ERROR` | Department workflow failed |
| `DEPARTMENT_INCOMPLETE` | Missing required agent roles |
| `CLAUDE_API_ERROR` | Anthropic API error |
| `DATABASE_ERROR` | Database operation failed |

---

## Rate Limiting

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642684800
```

### Rate Limits by Endpoint

| Endpoint Pattern | Limit | Window |
|------------------|-------|--------|
| `/api/agents` | 100 requests | 1 minute |
| `/api/agents/:id/run` | 50 requests | 1 minute |
| `/api/departments/*/run` | 20 requests | 1 minute |
| `/api/chat` | 50 requests | 1 minute |
| `/api/register` | 5 requests | 1 hour |

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 50,
    "remaining": 0,
    "retryAfter": 30
  }
}
```

Headers:
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642684830
Retry-After: 30
```

---

## Pagination

Endpoints that return lists support pagination:

### Query Parameters

- `limit`: Number of items per page (default: 20, max: 100)
- `cursor`: Pagination cursor from previous response
- `sort`: Sort field (default: `createdAt`)
- `order`: Sort order (`asc` or `desc`, default: `desc`)

### Pagination Response Format

```json
{
  "data": [...],
  "pagination": {
    "total": 250,
    "limit": 20,
    "hasMore": true,
    "nextCursor": "clx1234567890",
    "prevCursor": null
  }
}
```

---

## Webhooks (Future Feature)

Coming soon: Real-time notifications for workflow completion, agent events, and more.

---

## API Versioning

Current version: **v1** (implicit)

Future versions will be accessible via:
```
/api/v2/agents
/api/v2/departments
```

---

## SDKs and Client Libraries

### TypeScript/JavaScript Example

```typescript
import { AgentVerseClient } from '@agentverse/client';

const client = new AgentVerseClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-domain.com'
});

// Create agent
const agent = await client.agents.create({
  name: 'Research Assistant',
  role: 'researcher',
  personality: 'Analytical and thorough'
});

// Execute agent
const result = await client.agents.execute(agent.id, {
  input: 'Analyze market trends',
  context: { industry: 'tech' }
});

// Run department workflow
const workflow = await client.departments.marketResearch.run({
  query: 'E-commerce trends in Europe',
  options: {
    targetMarket: 'Europe',
    competitors: ['CompanyA', 'CompanyB']
  }
});
```

---

## Best Practices

1. **Authentication**: Always include session cookies in requests
2. **Error Handling**: Check status codes and handle errors gracefully
3. **Rate Limiting**: Implement exponential backoff for 429 responses
4. **Input Validation**: Validate input client-side before sending
5. **Context Provision**: Provide rich context for better agent responses
6. **Pagination**: Use cursor-based pagination for large datasets
7. **Timeouts**: Set reasonable timeouts for agent execution (30-60 seconds)
8. **Idempotency**: Implement idempotency keys for critical operations

---

## Support

For API support:
- GitHub Issues: [github.com/your-org/agentverse/issues](https://github.com)
- Documentation: [docs.agentverse.com](https://docs.agentverse.com)
- Email: support@agentverse.com
