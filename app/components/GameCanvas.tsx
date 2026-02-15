'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Agent {
  id: string
  name: string
  description: string | null
  model: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
  speed: number          // Movement speed multiplier
  isPaused: boolean      // Whether agent is currently paused
  pauseTimer: number     // Timer for pause duration
  maxPauseTime: number   // Max time to pause
  directionChangeTimer: number // Timer for random direction changes
}

interface Camera {
  x: number
  y: number
  zoom: number
}

interface GameCanvasProps {
  onAgentClick?: (agentId: string) => void
}

export default function GameCanvas({ onAgentClick }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const animationFrameRef = useRef<number | undefined>(undefined)

  const WORLD_WIDTH = 2000
  const WORLD_HEIGHT = 1500
  const AGENT_RADIUS = 20

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()

        // Convert agents to game entities with random positions and velocities
        const gameAgents: Agent[] = data.map((agent: Record<string, unknown>, index: number) => {
          const speed = 0.5 + Math.random() * 1.5 // Random speed between 0.5 and 2.0
          const angle = Math.random() * Math.PI * 2
          return {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            model: agent.model,
            x: Math.random() * (WORLD_WIDTH - 200) + 100,
            y: Math.random() * (WORLD_HEIGHT - 200) + 100,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: agent.color || `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
            radius: agent.size || AGENT_RADIUS,
            speed: speed,
            isPaused: false,
            pauseTimer: 0,
            maxPauseTime: 60 + Math.random() * 120, // Pause for 1-3 seconds (60fps)
            directionChangeTimer: 0
          }
        })

        setAgents(gameAgents)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }, [])

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 50 * camera.zoom
    const offsetX = camera.x % gridSize
    const offsetY = camera.y % gridSize

    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = -offsetX; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = -offsetY; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }, [camera.zoom, camera.x, camera.y])

  const drawAgent = useCallback((
    ctx: CanvasRenderingContext2D,
    agent: Agent,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Transform world coordinates to screen coordinates
    const screenX = (agent.x - camera.x) * camera.zoom + canvasWidth / 2
    const screenY = (agent.y - camera.y) * camera.zoom + canvasHeight / 2
    const screenRadius = agent.radius * camera.zoom

    // Don't draw if off-screen
    if (
      screenX < -screenRadius ||
      screenX > canvasWidth + screenRadius ||
      screenY < -screenRadius ||
      screenY > canvasHeight + screenRadius
    ) {
      return
    }

    // Draw outer glow
    const gradient = ctx.createRadialGradient(
      screenX,
      screenY,
      screenRadius * 0.5,
      screenX,
      screenY,
      screenRadius * 1.5
    )
    gradient.addColorStop(0, agent.color + 'AA')
    gradient.addColorStop(0.5, agent.color + '44')
    gradient.addColorStop(1, agent.color + '00')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(screenX, screenY, screenRadius * 1.5, 0, Math.PI * 2)
    ctx.fill()

    // Draw main circle
    ctx.fillStyle = agent.color
    ctx.beginPath()
    ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2)
    ctx.fill()

    // Draw border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw pulsing inner circle
    const pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.beginPath()
    ctx.arc(screenX, screenY, screenRadius * 0.5 * pulse, 0, Math.PI * 2)
    ctx.fill()

    // Draw name
    ctx.fillStyle = '#ffffff'
    ctx.font = `${12 * camera.zoom}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(agent.name, screenX, screenY + screenRadius + 5)
  }, [camera.x, camera.y, camera.zoom])

  // Fetch agents on mount
  useEffect(() => {
    void fetchAgents()
  }, [fetchAgents])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      // Update canvas size
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Clear canvas
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      drawGrid(ctx, canvas.width, canvas.height)

      // Update and draw agents
      setAgents(prevAgents => {
        const updatedAgents = prevAgents.map(agent => {
          const newAgent = { ...agent }

          // Handle pause state
          if (newAgent.isPaused) {
            const updatedPauseTimer = newAgent.pauseTimer + 1
            if (updatedPauseTimer >= newAgent.maxPauseTime) {
              // Resume movement with new random direction
              const angle = Math.random() * Math.PI * 2
              return {
                ...newAgent,
                isPaused: false,
                pauseTimer: 0,
                vx: Math.cos(angle) * newAgent.speed,
                vy: Math.sin(angle) * newAgent.speed
              }
            }
            return { ...newAgent, pauseTimer: updatedPauseTimer }
          }

          // Random chance to pause (1% per frame)
          if (Math.random() < 0.01) {
            return { ...newAgent, isPaused: true, pauseTimer: 0 }
          }

          // Random direction change (0.5% per frame)
          const updatedDirectionTimer = newAgent.directionChangeTimer + 1
          if (updatedDirectionTimer > 60 && Math.random() < 0.005) {
            const angle = Math.random() * Math.PI * 2
            return {
              ...newAgent,
              vx: Math.cos(angle) * newAgent.speed,
              vy: Math.sin(angle) * newAgent.speed,
              directionChangeTimer: 0
            }
          }

          // Update position
          let newX = newAgent.x + newAgent.vx
          let newY = newAgent.y + newAgent.vy
          let newVx = newAgent.vx
          let newVy = newAgent.vy

          // Bounce off walls
          if (newX < newAgent.radius || newX > WORLD_WIDTH - newAgent.radius) {
            newVx = -newVx
            newX = Math.max(newAgent.radius, Math.min(WORLD_WIDTH - newAgent.radius, newX))
          }
          if (newY < newAgent.radius || newY > WORLD_HEIGHT - newAgent.radius) {
            newVy = -newVy
            newY = Math.max(newAgent.radius, Math.min(WORLD_HEIGHT - newAgent.radius, newY))
          }

          // Check collision with other agents
          for (const other of prevAgents) {
            if (other.id === newAgent.id) continue
            const dx = newX - other.x
            const dy = newY - other.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const minDistance = newAgent.radius + other.radius

            if (distance < minDistance) {
              // Simple collision response: bounce back
              const angle = Math.atan2(dy, dx)
              const targetX = other.x + Math.cos(angle) * minDistance
              const targetY = other.y + Math.sin(angle) * minDistance
              newX = targetX
              newY = targetY
              // Reverse velocity
              newVx = -newVx * 0.8
              newVy = -newVy * 0.8
            }
          }

          return { ...newAgent, x: newX, y: newY, vx: newVx, vy: newVy, directionChangeTimer: updatedDirectionTimer }
        })

        // Draw agents
        updatedAgents.forEach(agent => {
          drawAgent(ctx, agent, canvas.width, canvas.height)
        })

        return updatedAgents
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [camera, drawGrid, drawAgent])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Check if clicked on an agent
    const clickedAgent = agents.find(agent => {
      const screenX = (agent.x - camera.x) * camera.zoom + canvas.width / 2
      const screenY = (agent.y - camera.y) * camera.zoom + canvas.height / 2
      const screenRadius = agent.radius * camera.zoom
      const distance = Math.sqrt(
        Math.pow(mouseX - screenX, 2) + Math.pow(mouseY - screenY, 2)
      )
      return distance < screenRadius
    })

    if (clickedAgent) {
      // Call the callback if provided, otherwise navigate
      if (onAgentClick) {
        onAgentClick(clickedAgent.id)
      } else {
        router.push(`/agents/${clickedAgent.id}`)
      }
    } else {
      // Start dragging
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Update mouse position for tooltip
    setMousePos({ x: mouseX, y: mouseY })

    // Check if hovering over an agent
    const hoveredAgent = agents.find(agent => {
      const screenX = (agent.x - camera.x) * camera.zoom + canvas.width / 2
      const screenY = (agent.y - camera.y) * camera.zoom + canvas.height / 2
      const screenRadius = agent.radius * camera.zoom
      const distance = Math.sqrt(
        Math.pow(mouseX - screenX, 2) + Math.pow(mouseY - screenY, 2)
      )
      return distance < screenRadius
    })

    setHoveredAgent(hoveredAgent || null)

    // Handle camera dragging
    if (isDragging) {
      const dx = (mouseX - dragStart.x) / camera.zoom
      const dy = (mouseY - dragStart.y) / camera.zoom

      setCamera(prev => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy
      }))

      setDragStart({ x: mouseX, y: mouseY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(2, prev.zoom * zoomFactor))
    }))
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Tooltip for hovered agent */}
      {hoveredAgent && (
        <div
          className="absolute pointer-events-none bg-gray-900/95 text-white px-3 py-2 rounded-lg shadow-lg border border-purple-500/30 backdrop-blur-sm"
          style={{
            left: mousePos.x + 15,
            top: mousePos.y + 15,
            zIndex: 1000
          }}
        >
          <div className="font-bold text-sm">{hoveredAgent.name}</div>
          <div className="text-xs text-gray-400 mt-1">Model: {hoveredAgent.model}</div>
          {hoveredAgent.description && (
            <div className="text-xs text-gray-300 mt-1 max-w-xs">
              {hoveredAgent.description.length > 80
                ? hoveredAgent.description.substring(0, 80) + '...'
                : hoveredAgent.description}
            </div>
          )}
          <div className="text-xs text-purple-400 mt-1">Click to chat</div>
        </div>
      )}
    </div>
  )
}
