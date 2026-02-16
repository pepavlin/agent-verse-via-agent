# Agent Visualization System

## Overview

The Agent Visualization System provides an interactive 2D map for visualizing and managing agents in real-time. It leverages PixiJS for high-performance rendering and includes features for agent selection, information panels, and communication visualization.

## Features

### 1. Interactive 2D Map Canvas
- **Technology**: PixiJS (WebGL-based rendering)
- **Performance**: Hardware-accelerated rendering with automatic device pixel ratio scaling
- **Responsive**: Configurable width and height with centered coordinate system
- **Animation**: Real-time agent movement and physics simulation (bouncing off walls)

### 2. Agent Visualization
- **Display**: Agents shown as colored circles representing their role
- **Role Colors**:
  - Researcher: Indigo (#6366f1)
  - Strategist: Violet (#8b5cf6)
  - Critic: Red (#ef4444)
  - Ideator: Orange (#f97316)
  - Coordinator: Green (#10b981)
  - Executor: Cyan (#06b6d4)
- **Labels**: Agent name displayed below the agent circle
- **Hover Effects**: Visual scaling on hover to indicate interactivity

### 3. Agent Selection
- **Single Click**: Select individual agent and display its details
- **Rectangle Selection**: Drag to select multiple agents at once
- **Multi-Select**: Hold Ctrl (or Cmd) while clicking to add/remove from selection
- **Clear Selection**: Press ESC or click empty area to clear all selections
- **Visual Feedback**: Selected agents have golden outline (color: #fbbf24)

### 4. Agent Information Panel
- **Triggered**: Opens when an agent is selected/clicked
- **Content**:
  - Agent name and status indicator
  - Role badge with color-coded background
  - Description
  - Model information
  - Specialization (if available)
  - Creation date
  - Current position coordinates (X, Y)
  - Action buttons (Send Message, View History)
- **Position**: Fixed panel on the right side of the screen
- **Closing**: Click the X button or click another agent to change focus

### 5. Agent Communication Visualization
- **Connection Lines**: Subtle lines connecting agents to visualize communication patterns
- **Demo Pattern**: Each agent connects to 2-3 nearby agents in the sequence
- **Styling**:
  - Color: Indigo (0x4f46e5)
  - Alpha: 0.2 (subtle, semi-transparent)
  - Width: 1 pixel
- **Real-time Updates**: Lines redraw as agents move
- **Toggle**: Can be enabled/disabled via `showConnections` prop

### 6. Camera Control with Auto-Focus
- **Auto-Focus**: Camera automatically focuses on selected agents
- **Smooth Animation**: Camera smoothly animates to target position with easing
- **Zoom on Focus**: Zooms to 1.5x when focusing, returns to 1x when unfocusing
- **Damping-Based Movement**: Uses smooth damping for natural camera movement (0.08 for position, 0.1 for zoom)
- **Focus Button**: Target icon button in agent sidebar for quick camera focus
- **Programmatic Control**: Support for external focus control via `onFocusAgent` callback and `focusedAgentId` prop
- **Reset**: Deselecting an agent smoothly resets the camera to center (0, 0)

### 7. Real-time Agent Tracking
- **API Integration**: Fetches agent data from `/api/agents`
- **Polling**: Updates agent list every 5 seconds
- **Live-Agents Page**: Dedicated page (`/live-agents`) for real-time monitoring

## Components

### AgentSidebar.tsx
Sidebar panel showing list of selected agents with quick actions.

**Props:**
```typescript
interface AgentSidebarProps {
  selectedAgents: VisualAgent[]                    // List of selected agents
  onClose?: () => void                            // Callback to close sidebar
  onFocusAgent?: (agentId: string) => void       // Callback to focus on specific agent
}
```

**Features:**
- Displays all selected agents with their details
- Focus button (Target icon) for quick camera focusing
- Agent role, specialization, position, and model info
- Summary statistics (total selected, number of different roles)

### AgentVisualization.tsx
Main visualization component rendering the 2D canvas with all agents.

**Props:**
```typescript
interface AgentVisualizationProps {
  agents: VisualAgent[]                        // Array of agents to display
  onSelectionChange?: (agents: VisualAgent[]) => void  // Callback when selection changes
  onAgentClick?: (agent: VisualAgent) => void  // Callback when an agent is clicked
  onFocusAgent?: (agentId: string | null) => void     // Callback when focus target changes
  focusedAgentId?: string | null               // ID of the focused agent (for camera)
  width?: number                                // Canvas width (default: 1200)
  height?: number                               // Canvas height (default: 800)
  showConnections?: boolean                     // Show communication lines (default: true)
}
```

**Camera Animation:**
- Uses `CameraState` interface with target and current positions
- Smooth damping for natural motion (0.08 for position, 0.1 for zoom)
- Zoom range: 1 (default) to 1.5 (focused)

**Features:**
- Real-time animation loop using PixiJS ticker
- Mouse event handling for selection and interaction
- Physics simulation (bouncing off walls)
- Connection visualization
- Selection rectangle drawing

### AgentInfoPanel.tsx
Dedicated panel showing detailed information about a selected agent.

**Props:**
```typescript
interface AgentInfoPanelProps {
  agent: VisualAgent | null        // Selected agent data
  onClose?: () => void             // Callback to close the panel
}
```

**Features:**
- Role-based badge with gradient styling
- Status indicator
- Model and specialization details
- Action buttons for further interaction
- Responsive layout

## Pages

### Visualization Page (`/visualization`)
Demo page using procedurally generated demo agents.

**Features:**
- 30 demo agents with random movement
- Toolbar for bulk actions
- Sidebar with selected agents list
- Legend showing all agent roles
- Control instructions

### Live Agents Page (`/live-agents`)
Production page using real agents from the database.

**Features:**
- Fetches agents from `/api/agents`
- Auto-updates every 5 seconds
- Shows agent role statistics
- Error handling and loading states
- Links to agent management

## Types

### VisualAgent
Extends base `Agent` type with visualization properties:

```typescript
interface VisualAgent extends Agent {
  x: number                        // World X position
  y: number                        // World Y position
  vx: number                       // Velocity X
  vy: number                       // Velocity Y
  color: string                    // Role-based hex color
  selected: boolean                // Selection state
  radius: number                   // Display radius
}
```

### Agent Roles
```typescript
type AgentRole = 'researcher' | 'strategist' | 'critic' | 'ideator' | 'coordinator' | 'executor'
```

## Configuration Constants

```typescript
export const AGENT_COLORS: Record<string, string> = {
  researcher: '#6366f1',
  strategist: '#8b5cf6',
  critic: '#ef4444',
  ideator: '#f97316',
  coordinator: '#10b981',
  executor: '#06b6d4',
  default: '#64748b',
}

export const AGENT_RADIUS = 20
export const SELECTION_COLOR = 0x6366f1
export const SELECTION_ALPHA = 0.3
export const SELECTED_OUTLINE_COLOR = 0xfbbf24
export const SELECTED_OUTLINE_WIDTH = 3
```

## User Controls

| Action | Description |
|--------|-------------|
| Click on Agent | Select agent, show details, and focus camera |
| Drag Rectangle | Select multiple agents at once |
| Ctrl/Cmd + Click | Add/remove agent from selection |
| Focus Button (📌) | Focus camera on agent from sidebar |
| ESC | Clear all selections and reset camera |
| Hover over Agent | Visual scale effect |

## API Integration

### Fetching Agents
The system integrates with the existing `/api/agents` endpoint:

```typescript
GET /api/agents
Response: Agent[]
```

The `createVisualAgent()` utility function converts API agents to visual agents:

```typescript
export function createVisualAgent(agent: Agent): VisualAgent {
  const role = agent.role || 'executor'
  return {
    ...agent,
    x: Math.random() * 1600 - 800,
    y: Math.random() * 1200 - 600,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    color: AGENT_COLORS[role] || AGENT_COLORS.default,
    selected: false,
    radius: 20,
  }
}
```

## Performance Considerations

1. **Canvas Rendering**: PixiJS handles GPU-accelerated rendering
2. **Event Handling**: Efficient coordinate-based agent detection
3. **Polling**: 5-second update interval balances responsiveness with server load
4. **Memory**: Graphics objects pooled in Maps for efficient cleanup

## Recently Implemented

- [x] Smooth camera animation with damping-based easing
- [x] Auto-focus on selected agents with zoom
- [x] Focus button in agent sidebar with Target icon
- [x] Programmatic focus control via callbacks

## Future Enhancements

- [ ] Pan controls for exploring the map
- [ ] Zoom controls for manual zoom adjustment
- [ ] Filter agents by role
- [ ] Real-time agent movement from server
- [ ] Agent relationship visualization (showing actual communication)
- [ ] Agent status indicators (idle, running, error)
- [ ] Performance metrics overlay
- [ ] Export visualization as image
- [ ] WebSocket support for real-time updates
- [ ] Keyboard shortcuts for focus (arrows, number keys)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Requires WebGL support

## Testing

### Unit Tests
Run tests with: `npm run test`

### Linting
Check code quality with: `npm run lint`

### Build
Test production build with: `npm run build`

### Development
Start dev server with: `npm run dev`
Access at: `http://localhost:3000/visualization` (demo) or `http://localhost:3000/live-agents` (live)

## Architecture Notes

### State Management
- Uses React hooks for local state management
- PixiJS handles rendering state separately
- Agent positions and selections synchronized between React and PixiJS

### Event Flow
1. User interaction (mouse event) → Canvas event handler
2. Event handler finds affected agents
3. Agent state updated in React refs
4. Selection change callback triggered
5. UI re-renders (info panel, legend, status bar)
6. PixiJS updates graphics on next tick

### Rendering Pipeline
1. PixiJS initialization with background color
2. Connections graphic layer created
3. Selection rectangle layer created
4. Agent containers created and added
5. Animation loop starts with ticker.add(updateAgents)
6. Each frame: Update positions, redraw connections, update graphics

## Known Limitations

1. Demo agents use random movement (not realistic)
2. Connection visualization is demo-only (shows sequential connections)
3. No manual panning controls (only auto-focus)
4. No zooming controls beyond auto-focus zoom (fixed 1.5x)
5. Real-time movement requires polling, not WebSocket streaming
6. Camera focus affects rendering performance with many agents

## Troubleshooting

### Canvas not rendering
- Check browser WebGL support
- Verify PixiJS is properly initialized
- Check console for errors

### Performance issues
- Reduce agent count
- Disable connection visualization if not needed
- Check browser hardware acceleration settings

### Selection not working
- Ensure canvas has focus
- Verify mouse event listeners are attached
- Check if agent is within AGENT_RADIUS

### Info panel not showing
- Click on agent (should trigger selection)
- Verify onAgentClick callback is set
- Check browser console for errors
