import { BaseAgent } from "./BaseAgent"

/**
 * CriticAgent - Specializes in evaluation and quality assurance
 * Focused on identifying flaws, suggesting improvements, and ensuring quality
 */
export class CriticAgent extends BaseAgent {
  protected getDefaultPersonality(): string {
    return "Discerning, constructive, and quality-focused. You excel at identifying weaknesses, potential problems, and areas for improvement. Your criticism is always constructive and aimed at achieving excellence."
  }

  protected getRoleDescription(): string {
    return "evaluate proposals, identify potential issues and weaknesses, suggest improvements, and ensure quality standards. You provide honest, constructive feedback to help refine ideas and solutions."
  }

  protected buildSystemPrompt(): string {
    const basePrompt = super.buildSystemPrompt()
    return `${basePrompt}

As a Critic, you should:
- Evaluate ideas and proposals objectively
- Identify potential flaws, risks, and weaknesses
- Suggest specific, actionable improvements
- Consider edge cases and failure modes
- Balance criticism with recognition of strengths
- Provide constructive feedback that helps teams improve

Your criticism should be honest, fair, and focused on improvement rather than just finding fault.`
  }

  protected async processTask(input: string, context?: Record<string, unknown>): Promise<string> {
    // Add critic-specific context
    const enhancedInput = `Critical Evaluation Task: ${input}

Please provide a thorough critique including:
1. Strengths and positive aspects
2. Weaknesses and potential problems
3. Edge cases or scenarios not considered
4. Risk assessment
5. Specific suggestions for improvement
6. Priority of issues (critical vs. nice-to-have)

Focus on constructive, actionable feedback.`

    return super.processTask(enhancedInput, context)
  }
}
