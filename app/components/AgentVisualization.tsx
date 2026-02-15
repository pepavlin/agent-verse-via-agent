'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import { VisualAgent, SelectionRect, ViewportState, InteractionState, AGENT_RADIUS, SELECTION_COLOR, SELECTION_ALPHA, SELECTED_OUTLINE_COLOR, SELECTED_OUTLINE_WIDTH } from '@/types/visualization'

interface AgentVisualizationProps {
  agents: VisualAgent[]
  onSelectionChange?: (selectedAgents: VisualAgent[]) => void
  width?: number
  height?: number
}

export default function AgentVisualization({
  agents: initialAgents,
  onSelectionChange,
  width = 1200,
  height = 800,
}: AgentVisualizationProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const agentsRef = useRef<VisualAgent[]>(initialAgents)
  const [selectedAgents, setSelectedAgents] = useState<VisualAgent[]>([])

  // Graphics objects
  const agentGraphicsRef = useRef<Map<string, PIXI.Container>>(new Map())
  const selectionRectGraphicRef = useRef<PIXI.Graphics | null>(null)

  // Viewport state
  const viewportRef = useRef<ViewportState>({
    x: 0,
    y: 0,
    scale: 1,
  })

  // Interaction state
  const interactionRef = useRef<InteractionState>({
    isDragging: false,
    isSelecting: false,
    selectionRect: null,
    hoveredAgentId: null,
  })

  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)
  const isCtrlKeyRef = useRef(false)

  // Update selected agents state
  const updateSelectedAgents = useCallback(() => {
    const selected = agentsRef.current.filter((a) => a.selected)
    setSelectedAgents(selected)
    onSelectionChange?.(selected)
  }, [onSelectionChange])

  // Find agent at mouse position
  const findAgentAtPosition = useCallback((x: number, y: number): VisualAgent | null => {
    // Convert screen coordinates to world coordinates
    const worldX = x - width / 2
    const worldY = y - height / 2

    for (const agent of agentsRef.current) {
      const dx = worldX - agent.x
      const dy = worldY - agent.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= AGENT_RADIUS) {
        return agent
      }
    }

    return null
  }, [width, height])

  // Clear all selections
  const clearSelection = useCallback(() => {
    agentsRef.current.forEach((agent) => {
      agent.selected = false
    })
    updateSelectedAgents()
  }, [updateSelectedAgents])

  // Draw selection rectangle
  const drawSelectionRect = useCallback(() => {
    if (!selectionRectGraphicRef.current || !interactionRef.current.selectionRect) return

    const rect = interactionRef.current.selectionRect
    const graphic = selectionRectGraphicRef.current

    graphic.clear()
    graphic.rect(
      Math.min(rect.startX, rect.endX),
      Math.min(rect.startY, rect.endY),
      Math.abs(rect.endX - rect.startX),
      Math.abs(rect.endY - rect.startY)
    )
    graphic.fill({ color: SELECTION_COLOR, alpha: SELECTION_ALPHA })
    graphic.stroke({ width: 2, color: SELECTION_COLOR })
  }, [])

  // Clear selection rectangle
  const clearSelectionRect = useCallback(() => {
    if (selectionRectGraphicRef.current) {
      selectionRectGraphicRef.current.clear()
    }
  }, [])

  // Select agents in rectangle
  const selectAgentsInRect = useCallback((rect: SelectionRect) => {
    const minX = Math.min(rect.startX, rect.endX) - width / 2
    const maxX = Math.max(rect.startX, rect.endX) - width / 2
    const minY = Math.min(rect.startY, rect.endY) - height / 2
    const maxY = Math.max(rect.startY, rect.endY) - height / 2

    agentsRef.current.forEach((agent) => {
      const inRect = agent.x >= minX && agent.x <= maxX && agent.y >= minY && agent.y <= maxY

      if (inRect) {
        agent.selected = true
      } else if (!isCtrlKeyRef.current) {
        agent.selected = false
      }
    })

    updateSelectedAgents()
  }, [width, height, updateSelectedAgents])

  // Handle agent click
  const handleAgentClick = useCallback((agent: VisualAgent, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      // Toggle selection
      agent.selected = !agent.selected
    } else {
      // Clear other selections and select this one
      agentsRef.current.forEach((a) => {
        a.selected = a.id === agent.id
      })
    }

    updateSelectedAgents()
  }, [updateSelectedAgents])

  // Initialize agent graphics
  const initializeAgents = useCallback((app: PIXI.Application) => {
    agentsRef.current.forEach((agent) => {
      const container = new PIXI.Container()
      container.x = agent.x + width / 2
      container.y = agent.y + height / 2

      // Agent circle
      const circle = new PIXI.Graphics()
      circle.circle(0, 0, AGENT_RADIUS)
      circle.fill(agent.color)
      container.addChild(circle)

      // Agent name
      const text = new PIXI.Text({
        text: agent.name,
        style: {
          fontSize: 12,
          fill: 0xffffff,
          align: 'center',
        }
      })
      text.anchor.set(0.5)
      text.y = AGENT_RADIUS + 15
      container.addChild(text)

      // Make interactive
      container.eventMode = 'static'
      container.cursor = 'pointer'

      // Add hover effect
      container.on('pointerover', () => {
        interactionRef.current.hoveredAgentId = agent.id
        circle.clear()
        circle.circle(0, 0, AGENT_RADIUS * 1.1)
        circle.fill(agent.color)
      })

      container.on('pointerout', () => {
        interactionRef.current.hoveredAgentId = null
        if (!agent.selected) {
          circle.clear()
          circle.circle(0, 0, AGENT_RADIUS)
          circle.fill(agent.color)
        }
      })

      app.stage.addChild(container)
      agentGraphicsRef.current.set(agent.id, container)
    })
  }, [width, height])

  // Update agent positions and animations
  const updateAgents = useCallback(() => {
    if (!appRef.current) return

    const bounds = {
      minX: -width / 2,
      maxX: width / 2,
      minY: -height / 2,
      maxY: height / 2,
    }

    agentsRef.current.forEach((agent) => {
      // Update position
      agent.x += agent.vx
      agent.y += agent.vy

      // Bounce off walls
      if (agent.x < bounds.minX || agent.x > bounds.maxX) {
        agent.vx *= -1
        agent.x = Math.max(bounds.minX, Math.min(bounds.maxX, agent.x))
      }
      if (agent.y < bounds.minY || agent.y > bounds.maxY) {
        agent.vy *= -1
        agent.y = Math.max(bounds.minY, Math.min(bounds.maxY, agent.y))
      }

      // Update graphic position
      const graphic = agentGraphicsRef.current.get(agent.id)
      if (graphic) {
        graphic.x = agent.x + width / 2
        graphic.y = agent.y + height / 2

        // Update selection outline
        const circle = graphic.children[0] as PIXI.Graphics
        if (agent.selected) {
          circle.clear()
          circle.circle(0, 0, AGENT_RADIUS)
          circle.fill(agent.color)
          circle.circle(0, 0, AGENT_RADIUS + 2)
          circle.stroke({ width: SELECTED_OUTLINE_WIDTH, color: SELECTED_OUTLINE_COLOR })
        }
      }
    })
  }, [width, height])

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return

    const app = new PIXI.Application()

    app.init({
      width,
      height,
      backgroundColor: 0x0a0a0f,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(() => {
      if (canvasRef.current && app.canvas) {
        canvasRef.current.appendChild(app.canvas as HTMLCanvasElement)
        appRef.current = app

        // Create selection rectangle graphic
        const selectionGraphic = new PIXI.Graphics()
        app.stage.addChild(selectionGraphic)
        selectionRectGraphicRef.current = selectionGraphic

        // Initialize agents
        initializeAgents(app)

        // Start animation loop
        app.ticker.add(updateAgents)
      }
    })

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, textureSource: true })
        appRef.current = null
      }
    }
  }, [updateAgents, initializeAgents, width, height])

  // Mouse event handlers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      mouseDownPosRef.current = { x, y }
      isCtrlKeyRef.current = e.ctrlKey || e.metaKey

      // Check if clicking on an agent
      const clickedAgent = findAgentAtPosition(x, y)

      if (clickedAgent) {
        handleAgentClick(clickedAgent, e.ctrlKey || e.metaKey)
      } else {
        // Start rect selection
        interactionRef.current.isSelecting = true
        interactionRef.current.selectionRect = {
          startX: x,
          startY: y,
          endX: x,
          endY: y,
        }

        // Clear selection if not holding Ctrl
        if (!isCtrlKeyRef.current) {
          clearSelection()
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactionRef.current.isSelecting || !interactionRef.current.selectionRect) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      interactionRef.current.selectionRect.endX = x
      interactionRef.current.selectionRect.endY = y

      drawSelectionRect()
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (interactionRef.current.isSelecting && interactionRef.current.selectionRect) {
        selectAgentsInRect(interactionRef.current.selectionRect)
        clearSelectionRect()
      }

      interactionRef.current.isSelecting = false
      interactionRef.current.selectionRect = null
      mouseDownPosRef.current = null
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection()
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [findAgentAtPosition, handleAgentClick, clearSelection, drawSelectionRect, selectAgentsInRect, clearSelectionRect])

  return (
    <div className="relative">
      <div
        ref={canvasRef}
        className="border border-gray-700 rounded-lg overflow-hidden"
        style={{ width, height }}
      />
    </div>
  )
}
