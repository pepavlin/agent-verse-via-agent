import { Department, DepartmentConfig } from './Department'
import { AgentRole } from '@/types'

/**
 * Market Research Department Configuration
 * Coordinates 4 agents to conduct comprehensive market research:
 * 1. Researcher - Gathers market data and competitive intelligence
 * 2. Strategist - Analyzes market trends and opportunities
 * 3. Critic - Identifies risks, gaps, and challenges
 * 4. Ideator - Proposes innovative solutions and strategies
 */

const MARKET_RESEARCH_CONFIG: DepartmentConfig = {
  id: 'market-research',
  name: 'Market Research Department',
  description: 'Comprehensive market analysis and strategic recommendations through collaborative agent workflow',
  requiredRoles: ['researcher', 'strategist', 'critic', 'ideator'] as AgentRole[],
  workflowTemplate: [
    {
      stepNumber: 1,
      agentRole: 'researcher' as AgentRole,
      description: 'Gather comprehensive market data, competitor information, and industry trends',
      input: undefined,
      output: undefined
    },
    {
      stepNumber: 2,
      agentRole: 'strategist' as AgentRole,
      description: 'Analyze research findings to identify strategic opportunities and market positioning',
      input: undefined,
      output: undefined
    },
    {
      stepNumber: 3,
      agentRole: 'critic' as AgentRole,
      description: 'Evaluate strategy for risks, gaps, weaknesses, and potential challenges',
      input: undefined,
      output: undefined
    },
    {
      stepNumber: 4,
      agentRole: 'ideator' as AgentRole,
      description: 'Propose innovative solutions to address identified gaps and capitalize on opportunities',
      input: undefined,
      output: undefined
    }
  ]
}

/**
 * Factory function to create Market Research Department
 */
export function createMarketResearchDepartment(): Department {
  return new Department(MARKET_RESEARCH_CONFIG)
}

/**
 * Market Research Department class with specialized methods
 */
export class MarketResearchDepartment extends Department {
  constructor() {
    super(MARKET_RESEARCH_CONFIG)
  }

  /**
   * Execute market research with domain-specific context
   */
  async conductMarketResearch(
    marketQuery: string,
    options?: {
      targetMarket?: string
      competitors?: string[]
      timeframe?: string
      budget?: string
      specificQuestions?: string[]
    }
  ) {
    // Build enhanced context for market research
    const context = {
      type: 'market_research',
      targetMarket: options?.targetMarket || 'general',
      competitors: options?.competitors || [],
      timeframe: options?.timeframe || '12 months',
      budget: options?.budget,
      specificQuestions: options?.specificQuestions || [],
      timestamp: new Date().toISOString()
    }

    // Enhance the query with structured context
    const enhancedQuery = this.buildEnhancedQuery(marketQuery, options)

    // Execute the workflow
    return await this.execute(enhancedQuery, context)
  }

  /**
   * Build enhanced query with market research context
   */
  private buildEnhancedQuery(query: string, options?: Record<string, unknown>): string {
    let enhanced = `Market Research Request: ${query}\n\n`

    if (options?.targetMarket) {
      enhanced += `Target Market: ${options.targetMarket}\n`
    }

    if (options?.competitors && Array.isArray(options.competitors) && options.competitors.length > 0) {
      enhanced += `Key Competitors: ${(options.competitors as string[]).join(', ')}\n`
    }

    if (options?.timeframe) {
      enhanced += `Timeframe: ${options.timeframe}\n`
    }

    if (options?.budget) {
      enhanced += `Budget Considerations: ${options.budget}\n`
    }

    if (options?.specificQuestions && Array.isArray(options.specificQuestions) && options.specificQuestions.length > 0) {
      enhanced += `\nSpecific Questions to Address:\n`
      ;(options.specificQuestions as string[]).forEach((q, i) => {
        enhanced += `${i + 1}. ${q}\n`
      })
    }

    enhanced += `\nPlease provide comprehensive analysis based on your role and expertise.`

    return enhanced
  }

  /**
   * Get market research status
   */
  getResearchStatus() {
    const info = this.getInfo()
    return {
      ...info,
      capabilities: [
        'Competitive Analysis',
        'Market Trend Identification',
        'Strategic Opportunity Assessment',
        'Risk Analysis',
        'Innovation Strategy',
        'Market Positioning Recommendations'
      ],
      workflowSteps: [
        'Data gathering and competitive intelligence (Researcher)',
        'Strategic analysis and opportunity mapping (Strategist)',
        'Risk assessment and gap identification (Critic)',
        'Solution ideation and recommendations (Ideator)'
      ]
    }
  }
}

/**
 * Export both factory and class
 */
export { MARKET_RESEARCH_CONFIG }
