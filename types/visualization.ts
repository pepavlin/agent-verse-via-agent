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
  researcher: '#3b82f6', // blue
  strategist: '#a855f7', // purple
  critic: '#ef4444', // red
  ideator: '#f59e0b', // amber
  coordinator: '#10b981', // green
  executor: '#06b6d4', // cyan
  default: '#6b7280', // gray
}

export const AGENT_RADIUS = 20
export const SELECTION_COLOR = 0x6366f1
export const SELECTION_ALPHA = 0.3
export const SELECTED_OUTLINE_COLOR = 0xfbbf24
export const SELECTED_OUTLINE_WIDTH = 3
