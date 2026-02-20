# Enhanced Agent Status Dashboard

## Overview

The Enhanced Agent Status Dashboard provides comprehensive real-time monitoring of all agents in the AgentVerse system. It displays agent health metrics, status indicators, performance data, and error logs for effective system monitoring and debugging.

## Features

### 1. Real-Time Status Indicators

Each agent displays a color-coded status indicator with animation:

- **🤔 Thinking (Blue, Pulsing)**: Agent is processing a request
- **💬 Communicating (Green, Pulsing)**: Agent is actively exchanging messages
- **⏸️ Idle (Gray)**: Agent is available but not currently active
- **⚠️ Error (Red)**: Agent encountered an error

### 2. Summary Dashboard

Quick overview cards showing:
- Total number of agents
- Active agents count
- Idle agents count
- Agents in error state

### 3. Agent Health Metrics

For each agent, the dashboard displays:
- **Total Executions**: Number of times the agent has been invoked
- **Success Rate**: Percentage of successful executions
- **Average Response Time**: Mean execution time in milliseconds
- **Last Activity**: Timestamp of the most recent agent activity
- **Success/Failure Breakdown**: Visual progress bars showing execution results

### 4. Performance Graphs

When clicking on an agent card, an expanded view shows:
- Historical response time graph
- Success/failure indicators for recent executions
- Detailed execution history

### 5. Error Log Viewer

Dedicated section displaying:
- Recent error messages from all agents
- Agent name and role for each error
- Error timestamp and response time
- Detailed error messages
- Input data that caused the error (expandable)
- Filtering by agent (optional)
- Real-time updates every 10 seconds

### 6. Auto-Refresh

Toggle button to enable/disable automatic dashboard refresh:
- Status data refreshes every 3 seconds when enabled
- Error logs refresh every 10 seconds
- Visual indicator showing refresh state

## API Endpoints

### GET /api/dashboard/status

Returns real-time status for all agents owned by the authenticated user.

**Response:**
```json
{
  "agents": [
    {
      "agentId": "string",
      "name": "string",
      "role": "researcher|strategist|critic|ideator|coordinator|executor",
      "color": "#hex",
      "status": "idle|thinking|communicating|error",
      "lastActivity": "ISO timestamp",
      "metrics": {
        "totalExecutions": number,
        "successfulExecutions": number,
        "failedExecutions": number,
        "averageResponseTime": number,
        "successRate": number
      },
      "recentExecutions": [
        {
          "id": "string",
          "status": "string",
          "responseTime": number,
          "success": boolean,
          "createdAt": "ISO timestamp"
        }
      ]
    }
  ],
  "summary": {
    "totalAgents": number,
    "activeAgents": number,
    "errorAgents": number,
    "idleAgents": number
  }
}
```

### GET /api/dashboard/errors

Returns error logs with optional filtering.

**Query Parameters:**
- `agentId` (optional): Filter errors by specific agent
- `limit` (optional, default: 50): Number of errors to return
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "errors": [
    {
      "id": "string",
      "agentId": "string",
      "agentName": "string",
      "agentRole": "string",
      "agentColor": "#hex",
      "status": "string",
      "errorMessage": "string",
      "input": "string",
      "createdAt": "ISO timestamp",
      "responseTime": number
    }
  ],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "hasMore": boolean
  }
}
```

## Database Schema

### AgentExecution

Tracks individual agent execution records for performance monitoring.

```prisma
model AgentExecution {
  id            String   @id @default(cuid())
  agentId       String
  status        String   @default("idle")
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  responseTime  Int?
  success       Boolean  @default(true)
  errorMessage  String?
  input         String?
  output        String?
  createdAt     DateTime @default(now())
  agent         Agent    @relation(...)
}
```

### AgentMetrics

Stores aggregated metrics for each agent.

```prisma
model AgentMetrics {
  id                   String   @id @default(cuid())
  agentId              String   @unique
  totalExecutions      Int      @default(0)
  successfulExecutions Int      @default(0)
  failedExecutions     Int      @default(0)
  averageResponseTime  Float    @default(0)
  lastActivityAt       DateTime?
  currentStatus        String   @default("idle")
  updatedAt            DateTime @updatedAt
  agent                Agent    @relation(...)
}
```

## Components

### AgentStatusDashboard

Main dashboard component that orchestrates the entire view.

**Location:** `app/components/AgentStatusDashboard.tsx`

**Features:**
- Fetches and displays agent status data
- Auto-refresh functionality
- Summary cards
- Agent cards grid with expandable details
- Click-to-expand performance graphs

### StatusIndicator

Displays color-coded status indicators with appropriate icons and animations.

**Location:** `app/components/StatusIndicator.tsx`

**Props:**
- `status`: 'idle' | 'thinking' | 'communicating' | 'error'
- `size`: 'sm' | 'md' | 'lg'
- `showLabel`: boolean

### PerformanceGraph

SVG-based line chart showing historical response times.

**Location:** `app/components/PerformanceGraph.tsx`

**Props:**
- `data`: Array of execution records with timestamp, responseTime, and success
- `agentName`: String for chart title

**Features:**
- Responsive SVG chart
- Color-coded data points (green for success, red for failure)
- Hover tooltips showing exact values
- Gradient area fill
- Grid lines for readability

### ErrorLogViewer

Displays and filters error logs from all agents.

**Location:** `app/components/ErrorLogViewer.tsx`

**Props:**
- `selectedAgentId`: Optional agent ID for filtering

**Features:**
- Auto-refresh every 10 seconds
- Expandable error details
- Color-coded by agent
- Manual refresh button
- Empty state for no errors

## Usage

### Accessing the Dashboard

Navigate to `/dashboard` in your browser after logging in.

### Navigation

- **View All Agents**: Returns to the main agents list page
- **Live Map**: Opens the 2D agent visualization
- **Agent Cards**: Click to expand and view performance graphs
- **View Agent**: Button in expanded view to navigate to agent detail page

### Monitoring Agents

1. **Check Overall Health**: Review summary cards at the top
2. **Identify Issues**: Look for agents with error status (red indicator)
3. **Analyze Performance**: Click agent cards to see response time trends
4. **Review Errors**: Scroll to error logs section for detailed error information
5. **Filter Errors**: Use agent-specific filters if needed

### Auto-Refresh

Toggle the "Auto-refresh" button to enable/disable:
- **ON (Green)**: Dashboard updates automatically
- **OFF (Gray)**: Manual refresh required

## Best Practices

### For System Administrators

1. **Regular Monitoring**: Check dashboard daily for system health
2. **Error Thresholds**: Investigate agents with >5% error rate
3. **Performance Baselines**: Track average response times for anomaly detection
4. **Capacity Planning**: Monitor total executions for resource allocation

### For Debugging

1. **Reproduce Issues**: Use error log inputs to reproduce failures
2. **Timing Analysis**: Check if errors correlate with high response times
3. **Pattern Recognition**: Look for recurring error messages across agents
4. **Agent Comparison**: Compare metrics between similar agents

### For Performance Optimization

1. **Response Time Trends**: Monitor performance graphs for degradation
2. **Success Rates**: Identify agents needing improvement
3. **Load Distribution**: Balance work across agents based on metrics
4. **Error Prevention**: Address common error patterns proactively

## Future Enhancements

Potential improvements for future versions:

- Real-time WebSocket updates (currently polling)
- Exportable reports (CSV, PDF)
- Custom alert thresholds and notifications
- Historical data retention and archiving
- Advanced filtering and search
- Comparison views between time periods
- Agent performance benchmarking
- Custom metric definitions
- Integration with external monitoring tools

## Technical Notes

### Performance Considerations

- Dashboard polls API every 3 seconds (status) and 10 seconds (errors)
- Recent executions limited to 10 per agent to reduce payload size
- Error logs paginated with default limit of 50
- Indexes on `agentId`, `status`, and `createdAt` for fast queries

### Security

- All endpoints require authentication
- Users can only view their own agents
- No sensitive data exposed in error messages
- Input data in error logs truncated to prevent XSS

### Browser Compatibility

- Tested on modern browsers (Chrome, Firefox, Safari, Edge)
- Uses CSS Grid and Flexbox for responsive layout
- SVG graphics for performance charts
- Tailwind CSS for styling consistency

## Troubleshooting

### Dashboard Not Loading

- Check authentication status
- Verify DATABASE_URL in .env
- Ensure Prisma migrations have run
- Check browser console for errors

### Metrics Not Updating

- Verify agents are actually executing
- Check if AgentMetrics records exist in database
- Ensure auto-refresh is enabled
- Check API endpoint responses in Network tab

### Performance Issues

- Reduce auto-refresh frequency if needed
- Limit number of agents per user
- Archive old execution records
- Optimize database queries with proper indexes

## Migration

If upgrading from a previous version:

```bash
# Run the new migration
npx prisma migrate deploy

# Or for development
npx prisma migrate dev
```

This will create the `AgentExecution` and `AgentMetrics` tables required for the dashboard.

## Screenshots

![Agent Status Dashboard](https://github.com/user-attachments/assets/66c3b472-4eb5-4aaa-8760-d380e089f5ff)

The dashboard displays:
- Summary cards showing agent statistics
- Individual agent cards with status indicators
- Health metrics and performance data
- Error logs with detailed information
- Auto-refresh toggle for real-time monitoring
