# Analytics Dashboard

The AgentVerse Analytics Dashboard provides comprehensive performance tracking and cost management for your AI agents.

## Features

### 📊 Performance Metrics
- **Total Executions**: Track all agent executions over time
- **Success Rate**: Monitor success/failure rates
- **Average Latency**: Measure response times
- **Real-time Updates**: Live metrics as agents execute tasks

### 💰 Cost Tracking
- **Per-Agent Costs**: See individual agent spending
- **Total Spend**: Track overall API costs
- **Token Usage**: Monitor input/output token consumption
- **Cost Estimation**: Automatic calculation based on Claude pricing

### 🔍 Agent Comparison
- Side-by-side metrics for all agents
- Identify top performers
- Compare success rates, latency, and costs
- Filter by role and date range

### 📈 Historical Trends
- Time-series visualization
- Daily/Weekly/Monthly views
- Customizable date ranges
- Export data for external analysis

### 🚨 Error Analysis
- Error frequency tracking
- Error type categorization
- Example error messages
- Agent-specific error patterns

## Accessing the Dashboard

Navigate to `/analytics` in your AgentVerse application. You must be logged in to view analytics.

## Date Range Filtering

Use the date range picker at the top of the dashboard to filter metrics:
- Default: Last 30 days
- Custom ranges available
- All metrics update based on selected range

## Exporting Data

Click the "Export Data" button to download all metrics in JSON format. The export includes:
- Summary metrics
- Agent comparison data
- Time-series data
- Error analysis

## Automatic Tracking

Metrics are automatically collected for:
- Every agent execution via `BaseAgent.execute()`
- Success and failure cases
- Token usage from Claude API
- Execution time
- Error details

## Cost Calculation

Costs are calculated based on Claude API pricing:
- Input tokens: Price per 1K tokens
- Output tokens: Price per 1K tokens
- Model-specific pricing applied automatically
- Costs displayed in USD

## API Endpoints

The dashboard uses these API endpoints:
- `GET /api/analytics/summary` - Overall metrics
- `GET /api/analytics/agents` - Agent comparison
- `GET /api/analytics/timeseries` - Time-series data
- `GET /api/analytics/errors` - Error analysis

All endpoints support date range filtering via query parameters.

## Database Schema

Metrics are stored in the `AgentMetric` table:
```prisma
model AgentMetric {
  id              String   @id @default(cuid())
  agentId         String
  agentName       String
  agentRole       String?
  userId          String
  operationType   String
  success         Boolean
  executionTime   Int
  inputTokens     Int?
  outputTokens    Int?
  totalTokens     Int?
  estimatedCost   Int?
  model           String
  errorType       String?
  errorMessage    String?
  createdAt       DateTime @default(now())
  completedAt     DateTime?
}
```

## Performance Considerations

- Indexes on frequently queried columns (agentId, userId, createdAt)
- Efficient aggregation queries
- Pagination support for large datasets
- Client-side caching of dashboard data

## Future Enhancements

Potential improvements:
- Real-time streaming updates via WebSockets
- Advanced charts (line graphs, pie charts)
- Alerting for high costs or error rates
- Custom metric dashboards
- Team/organization-level analytics
