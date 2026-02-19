# Agent Status Dashboard

## Overview

The Agent Status Dashboard provides real-time monitoring and health metrics for all agents in your AgentVerse system. It helps administrators monitor agent performance, identify issues, and debug problems efficiently.

## Features

### 1. Real-Time Agent Status Monitoring
- **Visual Status Indicators**: Color-coded indicators show agent states:
  - 🟢 **Green (Idle)**: Agent is ready and waiting for tasks
  - 🔵 **Blue (Thinking)**: Agent is processing a request (animated pulse)
  - 🟡 **Yellow (Communicating)**: Agent is communicating with other agents (animated pulse)
  - 🔴 **Red (Error)**: Agent has encountered an error

### 2. System Health Overview
The dashboard provides a high-level view of your multi-agent system:
- **Total Agents**: Count of all registered agents
- **Active Agents**: Number of agents currently processing tasks
- **Error Count**: Number of agents in error state
- **Overall System Health**: Aggregated health status (Healthy/Warning/Critical)

### 3. Agent Health Metrics
For each agent, the dashboard displays:
- **Tasks Completed**: Total number of tasks executed
- **Average Response Time**: Mean execution time for tasks
- **Error Rate**: Percentage of failed executions
- **Activity Frequency**: Number of executions in the last 24 hours

### 4. Error Log Viewer
- View detailed error messages for all agents
- Filter errors by specific agent
- See timestamp and execution details for each error
- Color-coded by agent role for easy identification

### 5. Auto-Refresh
The dashboard automatically refreshes every 5 seconds to provide real-time updates without manual intervention.

## Accessing the Dashboard

1. Log in to your AgentVerse account
2. Navigate to the **Dashboard** link in the main navigation
3. The dashboard will load with the current status of all your agents

## Dashboard Tabs

### Overview Tab
Displays the main dashboard with:
- System health summary cards
- Individual agent status cards with metrics
- Click on any agent card to view detailed information

### Error Logs Tab
Shows a chronological list of all agent errors with:
- Agent name and role
- Error message details
- Timestamp
- Execution time
- Filter options

## API Endpoints

The dashboard uses the following API endpoints:

### GET /api/agents/metrics
Returns aggregated metrics for all user's agents.

**Response:**
```json
{
  "agents": [
    {
      "agentId": "agent_123",
      "name": "Research Assistant",
      "role": "researcher",
      "color": "#3b82f6",
      "status": "idle",
      "lastActivity": "2026-02-19T10:30:00.000Z",
      "metrics": {
        "tasksCompleted": 45,
        "averageResponseTime": 1250,
        "errorRate": 2.2,
        "activityFrequency": 12
      }
    }
  ],
  "timestamp": "2026-02-19T10:35:00.000Z"
}
```

### GET /api/agents/errors
Returns error logs with optional filtering.

**Query Parameters:**
- `agentId` (optional): Filter errors by specific agent
- `limit` (optional): Number of results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "errors": [
    {
      "id": "error_123",
      "agentId": "agent_123",
      "agentName": "Research Assistant",
      "agentRole": "researcher",
      "errorMessage": "API rate limit exceeded",
      "timestamp": "2026-02-19T10:30:00.000Z",
      "executionTime": 5000
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

## Database Schema

The dashboard uses the `AgentMetrics` table to track agent performance:

```sql
CREATE TABLE "AgentMetrics" (
    "id" TEXT PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "status" TEXT DEFAULT 'idle',
    "executionTime" INTEGER,
    "success" BOOLEAN DEFAULT true,
    "errorMessage" TEXT,
    "tasksCompleted" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Setting Up Metrics Collection

To populate the dashboard with data, you need to record agent metrics when agents execute tasks. Here's an example:

```typescript
import { prisma } from '@/lib/prisma'

async function recordAgentExecution(
  agentId: string,
  status: 'idle' | 'thinking' | 'communicating' | 'error',
  executionTime: number,
  success: boolean,
  errorMessage?: string
) {
  await prisma.agentMetrics.create({
    data: {
      agentId,
      status,
      executionTime,
      success,
      errorMessage,
      tasksCompleted: success ? 1 : 0,
      createdAt: new Date()
    }
  })
}
```

## Components

The dashboard is built from these reusable components:

1. **AgentStatusDashboard** (`app/components/AgentStatusDashboard.tsx`)
   - Main dashboard component with auto-refresh
   - Displays system overview and agent cards

2. **AgentStatusIndicator** (`app/components/AgentStatusIndicator.tsx`)
   - Color-coded status indicator with optional label
   - Animated pulse for active states

3. **AgentHealthMetrics** (`app/components/AgentHealthMetrics.tsx`)
   - Displays four key metrics in a grid layout
   - Color-coded error rate indicator

4. **ErrorLogViewer** (`app/components/ErrorLogViewer.tsx`)
   - Filterable list of error logs
   - Auto-refreshes with the main dashboard

## Customization

### Refresh Interval
Change the auto-refresh interval by modifying the `refreshInterval` prop:

```tsx
<AgentStatusDashboard refreshInterval={10000} /> // 10 seconds
```

### Status Colors
Customize status indicator colors in `AgentStatusIndicator.tsx`:

```tsx
const statusConfig = {
  idle: { color: 'bg-green-500', label: 'Idle' },
  thinking: { color: 'bg-blue-500', label: 'Thinking' },
  communicating: { color: 'bg-yellow-500', label: 'Communicating' },
  error: { color: 'bg-red-500', label: 'Error' }
}
```

## Troubleshooting

### Dashboard shows no agents
- Ensure you have created at least one agent
- Check that you're logged in with the correct user account

### Metrics not updating
- Verify that agent executions are recording metrics using the `prisma.agentMetrics.create()` method
- Check the browser console for API errors
- Ensure the database connection is working

### Error logs not showing
- Confirm that failed agent executions are being recorded with `success: false`
- Check that error messages are being saved in the `errorMessage` field

## Future Enhancements

Potential improvements for the dashboard:
- Historical performance graphs (line charts showing trends over time)
- Alert notifications for critical errors
- Export functionality for metrics and logs
- Advanced filtering and search capabilities
- Agent comparison views
- Real-time WebSocket updates instead of polling

## Related Documentation

- [API Documentation](./API.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Agent Creation Guide](./CREATING_AGENTS.md)
