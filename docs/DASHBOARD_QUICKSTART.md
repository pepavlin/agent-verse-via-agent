# Agent Status Dashboard - Quick Reference

## Visual Overview

The Agent Status Dashboard is accessible at `/admin` (or view the demo at `/dashboard-demo`) and provides comprehensive monitoring of your multi-agent system.

![Dashboard Screenshot](https://github.com/user-attachments/assets/45083672-494c-4025-b783-bd14fed83c5b)

## Key Features at a Glance

### Status Indicators
- 🟢 **Idle** - Agent is ready for tasks
- 🔵 **Thinking** - Agent is processing (animated)
- 🟡 **Communicating** - Agent is messaging (animated)
- 🔴 **Error** - Agent needs attention

### Metrics Displayed
Each agent card shows:
- **Tasks Completed** - Total successful executions
- **Avg Response Time** - Mean execution duration
- **Error Rate** - Percentage of failed tasks
- **Activity (24h)** - Recent activity count

### System Overview Cards
- **Total Agents** - All registered agents
- **Active Agents** - Currently working agents
- **Errors** - Agents in error state
- **System Health** - Overall status (Healthy/Warning/Critical)

## Quick Start

1. Navigate to `/admin` after logging in
2. View real-time status of all your agents
3. Click on any agent card for detailed metrics
4. Switch to "Error Logs" tab to troubleshoot issues
5. Dashboard auto-refreshes every 5 seconds

## Integration

To record metrics when agents execute tasks:

```typescript
import { prisma } from '@/lib/prisma'

await prisma.agentMetrics.create({
  data: {
    agentId: 'agent-id',
    status: 'thinking', // or 'idle', 'communicating', 'error'
    executionTime: 1250, // milliseconds
    success: true,
    errorMessage: null,
    tasksCompleted: 1
  }
})
```

## Learn More

See the [full documentation](./AGENT_STATUS_DASHBOARD.md) for:
- API endpoints reference
- Database schema details
- Customization options
- Troubleshooting guide
