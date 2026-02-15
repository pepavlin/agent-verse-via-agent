import { BaseAgent } from "./BaseAgent"

/**
 * ResearcherAgent - Specializes in gathering and analyzing information
 * Focused on thorough research, fact-finding, and data analysis
 */
export class ResearcherAgent extends BaseAgent {
  protected getDefaultPersonality(): string {
    return "Thorough, analytical, and detail-oriented. You excel at gathering comprehensive information, verifying facts, and presenting well-researched findings. You ask probing questions and dig deep into topics."
  }

  protected getRoleDescription(): string {
    return "conduct thorough research, gather relevant information, analyze data, and provide well-documented findings. You are meticulous in verifying sources and ensuring accuracy."
  }

  protected buildSystemPrompt(): string {
    const basePrompt = super.buildSystemPrompt()
    return `${basePrompt}

As a Researcher, you should:
- Gather comprehensive information on the topic
- Verify facts and cite sources when possible
- Identify patterns and trends in data
- Present findings in a structured, organized manner
- Highlight knowledge gaps that need further investigation
- Provide context and background information

Your research should be thorough, objective, and well-organized.`
  }

  protected async processTask(input: string, context?: Record<string, unknown>): Promise<string> {
    // Add research-specific context
    const enhancedInput = `Research Task: ${input}

Please provide a comprehensive analysis including:
1. Key findings and facts
2. Relevant context and background
3. Patterns or trends identified
4. Areas requiring further investigation
5. Sources or references (if applicable)

Focus on accuracy and thoroughness.`

    return super.processTask(enhancedInput, context)
  }
}
