/**
 * Demo script to populate agent status tracker with sample data
 * Run this to demonstrate the dashboard with realistic data
 */

import { AgentStatusTracker } from './lib/agent-status-tracker'

// Sample agents
const agents = [
  { id: 'agent-1', name: 'Research Agent', role: 'researcher' },
  { id: 'agent-2', name: 'Strategic Planner', role: 'strategist' },
  { id: 'agent-3', name: 'Quality Critic', role: 'critic' },
  { id: 'agent-4', name: 'Idea Generator', role: 'ideator' },
  { id: 'agent-5', name: 'Task Coordinator', role: 'coordinator' },
]

// Populate with sample data
console.log('Populating agent status tracker with demo data...')

agents.forEach((agent, index) => {
  // Set different states for variety
  const states = ['idle', 'thinking', 'idle', 'error', 'idle']
  const state = states[index] as 'idle' | 'thinking' | 'communicating' | 'error'
  
  AgentStatusTracker.updateState(agent.id, agent.name, state, 
    state === 'thinking' ? 'Analyzing market data...' : undefined
  )

  // Add task execution history
  const taskCounts = [15, 23, 8, 12, 19]
  const failCounts = [1, 0, 2, 5, 1]
  
  for (let i = 0; i < taskCounts[index]; i++) {
    const success = i >= (taskCounts[index] - failCounts[index])
    const execTime = 1000 + Math.random() * 4000 // 1-5 seconds
    
    AgentStatusTracker.recordTaskExecution(
      agent.id,
      agent.name,
      success,
      execTime,
      success ? undefined : {
        message: 'Task execution failed',
        details: 'Sample error details for demonstration',
      }
    )
  }
})

console.log('Demo data loaded!')
console.log('Agent statuses:', AgentStatusTracker.getAllAgentStatus())
console.log('System metrics:', AgentStatusTracker.getSystemMetrics())
