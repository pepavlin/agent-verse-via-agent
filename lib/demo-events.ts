import { orchestrator } from '@/lib/orchestrator'

/**
 * Helper script to generate demo communication events for testing
 * This simulates agent-to-agent communication and workflow execution
 * Using agent IDs from the mock agents in /api/agents/route.ts
 */

export async function generateDemoEvents() {
  // Simulate various communication patterns using the mock agent IDs
  
  // 1. Direct message from Research Agent to Strategic Planner
  await orchestrator.sendAgentMessage(
    'agent-1', // Research Agent
    'agent-2', // Strategic Planner
    'I have completed the market research. The findings show strong demand in the healthcare sector.',
    { priority: 'high', type: 'response' }
  )

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 100))

  // 2. Response from Strategic Planner to Research Agent
  await orchestrator.sendAgentMessage(
    'agent-2', // Strategic Planner
    'agent-1', // Research Agent
    'Excellent work! Based on your research, I will develop a strategic entry plan for the healthcare market.',
    { priority: 'medium', type: 'response' }
  )

  await new Promise(resolve => setTimeout(resolve, 100))

  // 3. Broadcast from Strategic Planner to Idea Generator and Research Agent
  await orchestrator.broadcastMessage(
    'agent-2', // Strategic Planner
    ['agent-3', 'agent-1'], // Idea Generator, Research Agent
    'Team update: We are focusing on healthcare market entry strategy. Please provide your input.',
    { priority: 'medium', type: 'notification' }
  )

  await new Promise(resolve => setTimeout(resolve, 100))

  // 4. Feedback from Idea Generator to Strategic Planner
  await orchestrator.sendAgentMessage(
    'agent-3', // Idea Generator
    'agent-2', // Strategic Planner
    'I suggest we explore partnership opportunities with existing healthcare providers and consider a phased rollout approach starting with smaller clinics.',
    { priority: 'medium', type: 'response' }
  )

  await new Promise(resolve => setTimeout(resolve, 100))

  // 5. Another idea from Idea Generator
  await orchestrator.sendAgentMessage(
    'agent-3', // Idea Generator
    'agent-1', // Research Agent
    'Could you investigate successful healthcare tech partnerships in similar markets? This could guide our strategy.',
    { priority: 'medium', type: 'query' }
  )

  await new Promise(resolve => setTimeout(resolve, 100))

  // 6. Research update from Research Agent
  await orchestrator.sendAgentMessage(
    'agent-1', // Research Agent
    'agent-2', // Strategic Planner
    'Additional finding: The telehealth segment is growing at 28% annually. This could be our entry point.',
    { priority: 'urgent', type: 'notification' }
  )

  return {
    success: true,
    message: 'Demo events generated successfully',
    eventCount: orchestrator.getCommunicationEvents().length,
  }
}
