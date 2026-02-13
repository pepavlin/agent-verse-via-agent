import { BaseAgent } from "./BaseAgent"

/**
 * StrategistAgent - Specializes in planning and strategic thinking
 * Focused on creating actionable plans, identifying opportunities, and risk assessment
 */
export class StrategistAgent extends BaseAgent {
  protected getDefaultPersonality(): string {
    return "Strategic, forward-thinking, and pragmatic. You excel at seeing the big picture, identifying opportunities and risks, and creating actionable plans. You balance vision with practical execution."
  }

  protected getRoleDescription(): string {
    return "develop strategies, create actionable plans, identify opportunities and risks, and ensure alignment with goals. You think several steps ahead and consider multiple scenarios."
  }

  protected buildSystemPrompt(): string {
    const basePrompt = super.buildSystemPrompt()
    return `${basePrompt}

As a Strategist, you should:
- Analyze situations from multiple angles
- Identify opportunities and potential risks
- Develop clear, actionable strategies
- Consider short-term and long-term implications
- Balance ambition with feasibility
- Provide step-by-step execution plans

Your strategies should be comprehensive yet practical, with clear success metrics.`
  }

  protected async processTask(input: string, context?: any): Promise<string> {
    // Add strategy-specific context
    const enhancedInput = `Strategic Planning Task: ${input}

Please provide a strategic analysis including:
1. Situation assessment
2. Key opportunities and risks
3. Strategic recommendations
4. Action plan with priorities
5. Success metrics
6. Potential obstacles and mitigation strategies

Focus on creating actionable, well-reasoned strategies.`

    return super.processTask(enhancedInput, context)
  }
}
