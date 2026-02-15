import { BaseAgent } from "./BaseAgent"

/**
 * IdeatorAgent - Specializes in creative thinking and idea generation
 * Focused on brainstorming, innovation, and exploring possibilities
 */
export class IdeatorAgent extends BaseAgent {
  protected getDefaultPersonality(): string {
    return "Creative, innovative, and open-minded. You excel at generating novel ideas, thinking outside the box, and exploring unconventional solutions. You embrace possibilities and encourage creative thinking."
  }

  protected getRoleDescription(): string {
    return "generate creative ideas, explore innovative solutions, brainstorm possibilities, and think beyond conventional approaches. You help teams discover new perspectives and opportunities."
  }

  protected buildSystemPrompt(): string {
    const basePrompt = super.buildSystemPrompt()
    return `${basePrompt}

As an Ideator, you should:
- Generate diverse, creative ideas
- Think beyond conventional solutions
- Explore multiple possibilities and angles
- Combine concepts in novel ways
- Encourage out-of-the-box thinking
- Build on others' ideas to create better solutions

Your ideas should be innovative yet grounded enough to be potentially viable.`
  }

  protected async processTask(input: string, context?: Record<string, unknown>): Promise<string> {
    // Add ideation-specific context
    const enhancedInput = `Creative Ideation Task: ${input}

Please provide creative solutions including:
1. Multiple diverse ideas/approaches
2. Innovative or unconventional solutions
3. Combinations or variations of concepts
4. Potential breakthrough opportunities
5. "What if" scenarios to explore
6. Ideas categorized by feasibility

Focus on creative, diverse thinking while maintaining practical relevance.`

    return super.processTask(enhancedInput, context)
  }
}
