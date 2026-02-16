# Agent Visualization - Quick Start Guide

## 🚀 Getting Started

### View Demo Visualization
```bash
npm run dev
# Open http://localhost:3000/visualization
```

### View Live Agent Map
```bash
# First create some agents at http://localhost:3000/agents
# Then navigate to http://localhost:3000/live-agents
```

## 🎮 User Controls

| Action | Result |
|--------|--------|
| **Click on agent** | Select agent & show details panel |
| **Drag rectangle** | Select multiple agents at once |
| **Ctrl/Cmd + Click** | Add or remove agent from selection |
| **ESC key** | Clear all selections |
| **Hover over agent** | Visual scale effect (grows slightly) |

## 👁️ What You'll See

### 2D Canvas
- **Background**: Dark grid with agents as colored circles
- **Labels**: Agent names shown below each circle
- **Lines**: Subtle connection lines showing communication patterns
- **Colors**: Role-based (6 different colors for 6 roles)

### Agent Roles & Colors
```
🟦 Researcher   (Indigo)
🟪 Strategist   (Violet)
🟥 Critic       (Red)
🟧 Ideator      (Orange)
🟩 Coordinator  (Green)
🟦 Executor     (Cyan)
```

### Information Panel (Right Side)
When you click an agent:
- Agent name and status
- Role with color-coded badge
- Description
- Model information
- Creation date
- Current position (X, Y)
- Action buttons

## 🏗️ Component Structure

```
/visualization
├── Canvas (PixiJS)
│   ├── Agent circles
│   ├── Connection lines
│   └── Selection rectangle
├── Right Legend Panel
│   ├── Role legend
│   └── Control instructions
└── Right Info Panel
    └── Selected agent details

/live-agents
├── Same as above
├── Real agent data from API
└── Auto-updates every 5 seconds
```

## 🔧 API Integration

### Fetch Agents
```typescript
GET /api/agents
Response: Agent[]
```

### Create Visual Agent
```typescript
import { createVisualAgent } from '@/lib/demoAgents'

const visualAgent = createVisualAgent(apiAgent)
```

## 📊 Performance

- **Rendering**: GPU-accelerated (WebGL via PixiJS)
- **Agent Limit**: Tested with 30 demo agents
- **Update Rate**: 60 FPS with 30 agents
- **Polling**: 5-second interval for live updates

## 🛠️ Development

### Run Tests
```bash
npm run test
```

### Check Code Quality
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

## 🎨 Customization

### Change Canvas Size
```typescript
<AgentVisualization
  width={1400}  // Default: 1200
  height={900}  // Default: 800
  agents={agents}
/>
```

### Show/Hide Connections
```typescript
<AgentVisualization
  showConnections={false}  // Default: true
  agents={agents}
/>
```

### Change Colors
Edit `types/visualization.ts`:
```typescript
export const AGENT_COLORS: Record<string, string> = {
  researcher: '#6366f1',  // Change hex color
  // ... other roles
}
```

## 📂 Key Files

| File | Purpose |
|------|---------|
| `app/components/AgentVisualization.tsx` | Main canvas component |
| `app/components/AgentInfoPanel.tsx` | Agent details panel |
| `app/visualization/page.tsx` | Demo page |
| `app/live-agents/page.tsx` | Live agent page |
| `types/visualization.ts` | Type definitions |
| `lib/demoAgents.ts` | Agent generation utilities |

## 🐛 Troubleshooting

### Canvas not showing
- Check browser WebGL support (Chrome/Firefox/Safari)
- Verify PixiJS is imported correctly
- Check browser console for errors

### Agents not moving
- Demo agents bounce off walls randomly
- Live agents only update on API refresh (5s)
- Check network tab for API calls

### Selection not working
- Ensure agent is within clickable radius (20px)
- Verify mouse events are firing
- Try clicking in the center of the circle

### Performance slow
- Reduce number of agents
- Disable connection visualization
- Check browser hardware acceleration

## 📚 Documentation

For detailed documentation, see:
- `docs/AGENT_VISUALIZATION.md` - Complete API reference
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details

## 🎯 Next Steps

### To Extend This
1. **Real-time Updates**: Replace polling with WebSocket
2. **Zoom/Pan**: Add camera controls
3. **Filters**: Add role-based filtering
4. **Search**: Add agent search functionality
5. **Metrics**: Show agent performance metrics
6. **Messages**: Display actual inter-agent messages

### To Test
1. Create agents via `/agents` page
2. Open `/live-agents` page
3. Click on agents to see details
4. Use Ctrl+Click to multi-select
5. Try rectangle selection with drag

## ✨ Tips & Tricks

- **Multi-select**: Use Ctrl+Click to select specific agents, then use toolbar buttons
- **Clear Quick**: Press ESC to clear selection instantly
- **Check Roles**: Look at legend on right to understand agent colors
- **API Debug**: Open DevTools Network tab to see polling requests
- **Mobile**: Works with touch (click = tap, drag = swipe)

---

**Need Help?** Check `docs/AGENT_VISUALIZATION.md` for detailed information.

**Report Issues?** Check browser console (F12) for error messages.
