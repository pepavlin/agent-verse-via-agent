import { Agent, AgentRole } from '@/types'
import { VisualAgent, AGENT_COLORS } from '@/types/visualization'

// Animation speed multiplier (1000x slower than previous, 1/1,000,000 of normal speed)
const ANIMATION_SPEED_MULTIPLIER = 0.000001

const AGENT_ROLES: AgentRole[] = [
  'researcher',
  'strategist',
  'critic',
  'ideator',
  'coordinator',
  'executor',
]

const AGENT_NAMES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
  'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
  'Atlas', 'Phoenix', 'Nexus', 'Quantum', 'Cipher', 'Vector',
]

export function generateDemoAgents(count: number = 20): VisualAgent[] {
  const agents: VisualAgent[] = []

  for (let i = 0; i < count; i++) {
    const role = AGENT_ROLES[i % AGENT_ROLES.length]
    const name = `${AGENT_NAMES[i % AGENT_NAMES.length]}-${Math.floor(i / AGENT_NAMES.length) + 1}`

    const agent: VisualAgent = {
      id: `demo-agent-${i}`,
      name,
      description: `Demo ${role} agent`,
      model: 'claude-3-5-sonnet-20241022',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'demo-user',
      role,
      specialization: `${role} operations`,
      // Visual properties
      x: Math.random() * 1600 - 800, // Random position in a 1600x1200 world
      y: Math.random() * 1200 - 600,
      vx: (Math.random() - 0.5) * 2 * ANIMATION_SPEED_MULTIPLIER, // Random velocity
      vy: (Math.random() - 0.5) * 2 * ANIMATION_SPEED_MULTIPLIER,
      color: AGENT_COLORS[role] || AGENT_COLORS.default,
      selected: false,
      radius: 20,
    }

    agents.push(agent)
  }

  return agents
}

export function createVisualAgent(agent: Agent): VisualAgent {
  const role = agent.role || 'executor'

  return {
    ...agent,
    x: Math.random() * 1600 - 800,
    y: Math.random() * 1200 - 600,
    vx: (Math.random() - 0.5) * 2 * ANIMATION_SPEED_MULTIPLIER,
    vy: (Math.random() - 0.5) * 2 * ANIMATION_SPEED_MULTIPLIER,
    color: AGENT_COLORS[role] || AGENT_COLORS.default,
    selected: false,
    radius: 20,
  }
}
