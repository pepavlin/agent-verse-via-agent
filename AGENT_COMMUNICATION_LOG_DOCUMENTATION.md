# Agent Communication Log Panel

## Overview

The Agent Communication Log Panel is a new feature that provides real-time visibility into agent-to-agent message exchanges. This panel helps users understand how agents collaborate and communicate during workflows.

## Features

### 1. Real-time Message Display
- Automatically polls for new messages every 2 seconds
- Shows up to 100 most recent communication events
- Messages are displayed in reverse chronological order (newest first)

### 2. Color-coded Agent Identification
- Each agent is assigned a consistent color based on their name
- Color coding makes it easy to track which agents are communicating
- 10 distinct colors are rotated to ensure visual distinction

### 3. Filtering Capabilities

#### Filter by Agent Name
- Text input allows filtering by partial agent name match
- Matches both sender and recipient agents
- Case-insensitive search

#### Filter by Message Type
- Dropdown to filter by message type:
  - `query` - Agent asking for information
  - `response` - Agent providing an answer
  - `notification` - System notifications
  - `task` - Task assignments

### 4. Expandable Message Details
- Click on any message to expand/collapse details
- Collapsed view shows:
  - Agent names (sender → recipient)
  - Message type
  - Timestamp
  - Preview of message content (first line)
- Expanded view shows:
  - Full message content
  - Metadata (if available)

### 5. Timestamps
- All messages include timestamps in HH:MM:SS format
- Uses 24-hour time format for precision

## User Interface

### Location
- Panel appears on the left side of the main page (opposite the Agent List)
- Toggle visibility with "Show/Hide Comm Log" button in top navigation
- Position: `top-20 left-4` (below the header)

### Dimensions
- Width: `384px` (96 on Tailwind scale)
- Max height: `70vh`
- Scrollable message list

### Visual Design
- Dark theme with neutral colors matching the application
- Semi-transparent background with backdrop blur
- Border with primary color accent
- Hover effects on messages and buttons

## Technical Implementation

### Components

#### AgentCommunicationLog.tsx
Main component located at `/app/components/AgentCommunicationLog.tsx`

**Props:**
- `isOpen: boolean` - Controls visibility
- `onClose: () => void` - Callback when panel is closed

**State:**
- `messages` - Array of communication messages
- `expandedMessages` - Set of message IDs that are expanded
- `filterAgent` - Current agent name filter
- `filterType` - Current message type filter
- `showFilters` - Whether filter controls are visible

### API Endpoint

#### GET /api/agent-communication
Returns recent agent communication messages.

**Response:**
```json
{
  "messages": [
    {
      "id": "string",
      "fromAgentId": "string",
      "fromAgentName": "string",
      "toAgentId": "string",
      "toAgentName": "string",
      "content": "string",
      "type": "query" | "response" | "notification" | "task",
      "timestamp": "ISO date string",
      "metadata": {
        "priority": "string",
        "taskId": "string"
      }
    }
  ],
  "count": number
}
```

#### POST /api/agent-communication
Logs a new agent-to-agent communication event.

**Request Body:**
```json
{
  "fromAgentId": "string",
  "toAgentId": "string",
  "content": "string",
  "type": "query" | "response" | "notification" | "task",
  "metadata": {
    "priority": "string",
    "taskId": "string"
  }
}
```

### Database Schema

Messages are stored in the `Message` table with the following fields for inter-agent communication:
- `fromAgent` - Source agent ID
- `toAgent` - Target agent ID
- `type` - Message type
- `priority` - Message priority level
- `taskId` - Associated task ID (if applicable)

### Orchestrator Integration

The `AgentOrchestrator` class has been enhanced to automatically log communications:

```typescript
async sendAgentMessage(
  fromAgentId: string,
  toAgentId: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<AgentMessage>
```

When an agent sends a message to another agent through the orchestrator, it automatically:
1. Adds the message to the recipient's queue
2. Logs the communication via the API endpoint
3. Stores the communication in the database

## Usage

### For Users

1. **Open the Communication Log**
   - Click "Show Comm Log" button in the top navigation bar
   - Panel appears on the left side of the screen

2. **View Messages**
   - Messages appear automatically as agents communicate
   - Scroll through the list to see history

3. **Filter Messages**
   - Click the filter icon to show filter controls
   - Type agent name in the filter box
   - Select message type from dropdown
   - Click "Clear filters" to reset

4. **Expand Message Details**
   - Click on any message to see full content
   - Click again to collapse

5. **Close the Panel**
   - Click the X icon in the top right
   - Or click "Hide Comm Log" button in navigation

### For Developers

To log agent-to-agent communication from your code:

```typescript
// Using the orchestrator
import { orchestrator } from '@/lib/orchestrator'

await orchestrator.sendAgentMessage(
  'from-agent-id',
  'to-agent-id',
  'Message content here',
  {
    type: 'query',
    priority: 'high'
  }
)

// Or directly via API
await fetch('/api/agent-communication', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromAgentId: 'agent-1',
    toAgentId: 'agent-2',
    content: 'Hello from agent 1',
    type: 'notification'
  })
})
```

## Testing

Unit tests are available at `/tests/unit/components/AgentCommunicationLog.test.tsx`

Tests cover:
- Component rendering
- Message display
- Filtering functionality
- Expand/collapse behavior
- Close button functionality

Run tests with:
```bash
npm run test
```

## Future Enhancements

Potential improvements for future versions:
1. Export communication log to file
2. Search within message content
3. Filter by date/time range
4. View communication graphs/visualizations
5. Real-time WebSocket updates instead of polling
6. Message threading/conversation view
7. Agent communication statistics
8. Notification alerts for specific message types

## Benefits

1. **Transparency**: Users can see how agents interact and make decisions
2. **Debugging**: Developers can trace agent communication issues
3. **Understanding**: Users learn how multi-agent collaboration works
4. **Monitoring**: Track agent activity and workflow progress
5. **Trust**: Increased confidence in AI reasoning through visibility

## Implementation Notes

- The current implementation shows agent responses to users as a fallback when true inter-agent communications don't exist
- This ensures the panel is useful even before complex multi-agent workflows are running
- The panel is designed to scale to handle hundreds of messages efficiently
- Color assignment is deterministic based on agent name hash for consistency
