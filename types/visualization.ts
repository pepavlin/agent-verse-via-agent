import { Agent } from './index'

// Visualization-specific types
export interface VisualAgent extends Agent {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  selected: boolean
  radius: number
}

export interface SelectionRect {
  startX: number
  startY: number
  endX: number
  endY: number
}

export interface ViewportState {
  x: number
  y: number
  scale: number
}

export interface InteractionState {
  isDragging: boolean
  isSelecting: boolean
  selectionRect: SelectionRect | null
  hoveredAgentId: string | null
}

export const AGENT_COLORS: Record<string, string> = {
  researcher: '#6366f1', // Indigo (Primary)
  strategist: '#8b5cf6', // Violet (Secondary)
  critic: '#ef4444', // Red (Danger)
  ideator: '#f97316', // Orange (Warning)
  coordinator: '#10b981', // Green (Success)
  executor: '#06b6d4', // Cyan (Accent)
  default: '#64748b', // Slate 500 (Gray)
}

export const AGENT_RADIUS = 20
export const SELECTION_COLOR = 0x6366f1
export const SELECTION_ALPHA = 0.3
export const SELECTED_OUTLINE_COLOR = 0xfbbf24
export const SELECTED_OUTLINE_WIDTH = 3
