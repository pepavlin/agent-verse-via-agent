'use client'

import { useEffect, useRef, useState } from 'react'
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
}

interface Camera {
  x: number
  y: number
  zoom: number
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const animationFrameRef = useRef<number | undefined>(undefined)

  const WORLD_WIDTH = 2000
  const WORLD_HEIGHT = 1500
  const AGENT_RADIUS = 20

  // Fetch agents from API
  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()

        // Convert agents to game entities with random positions and velocities
        const gameAgents: Agent[] = data.map((agent: any, index: number) => ({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          model: agent.model,
          x: Math.random() * (WORLD_WIDTH - 200) + 100,
          y: Math.random() * (WORLD_HEIGHT - 200) + 100,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
          radius: AGENT_RADIUS
        }))

        setAgents(gameAgents)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }

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
          // Update position
          let newX = agent.x + agent.vx
          let newY = agent.y + agent.vy
          let newVx = agent.vx
          let newVy = agent.vy

          // Bounce off walls
          if (newX < agent.radius || newX > WORLD_WIDTH - agent.radius) {
            newVx = -newVx
            newX = Math.max(agent.radius, Math.min(WORLD_WIDTH - agent.radius, newX))
          }
          if (newY < agent.radius || newY > WORLD_HEIGHT - agent.radius) {
            newVy = -newVy
            newY = Math.max(agent.radius, Math.min(WORLD_HEIGHT - agent.radius, newY))
          }

          return { ...agent, x: newX, y: newY, vx: newVx, vy: newVy }
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
  }, [camera])

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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
  }

  const drawAgent = (
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
  }

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
      // Navigate to agent chat
      router.push(`/agents/${clickedAgent.id}`)
    } else {
      // Start dragging
      setIsDragging(true)
      setDragStart({ x: mouseX, y: mouseY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const dx = (mouseX - dragStart.x) / camera.zoom
    const dy = (mouseY - dragStart.y) / camera.zoom

    setCamera(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy
    }))

    setDragStart({ x: mouseX, y: mouseY })
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
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    />
  )
}
