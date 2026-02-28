import Anthropic from '@anthropic-ai/sdk'

export interface AgentRunParams {
  agentName: string
  agentRole: string
  agentGoal?: string
  agentPersona?: string
  taskDescription: string
  apiKey: string
}

export interface AgentRunResult {
  success: true
  result: string
}

export interface AgentRunError {
  success: false
  error: string
  userMessage: string
}

export type AgentRunResponse = AgentRunResult | AgentRunError

/**
 * Executes an agent task using the Anthropic API with the user's own API key.
 */
export async function runAgentTask(params: AgentRunParams): Promise<AgentRunResponse> {
  const client = new Anthropic({ apiKey: params.apiKey })

  const systemPrompt = buildSystemPrompt(params)

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: params.taskDescription,
        },
      ],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    const result = textContent ? textContent.text : 'Task completed.'

    return { success: true, result }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return {
        success: false,
        error: 'invalid_api_key',
        userMessage: 'API klíč je neplatný. Zkontroluj nastavení.',
      }
    }
    if (err instanceof Anthropic.RateLimitError) {
      return {
        success: false,
        error: 'rate_limit',
        userMessage: 'Překročen limit požadavků. Zkus to za chvíli.',
      }
    }
    if (err instanceof Anthropic.APIError) {
      return {
        success: false,
        error: 'api_error',
        userMessage: 'Chyba při komunikaci s LLM. Zkus to znovu.',
      }
    }

    return {
      success: false,
      error: 'unknown_error',
      userMessage: 'Nastala neočekávaná chyba. Zkus to znovu.',
    }
  }
}

/**
 * Validates an API key by making a minimal test request.
 */
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  const client = new Anthropic({ apiKey })

  try {
    await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    })
    return { valid: true, message: 'Klíč je platný a funguje.' }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return { valid: false, message: 'Klíč je neplatný.' }
    }
    if (err instanceof Anthropic.RateLimitError) {
      // Rate limit means key is valid
      return { valid: true, message: 'Klíč je platný (limit požadavků).' }
    }
    return { valid: false, message: 'Nelze ověřit klíč. Zkus to znovu.' }
  }
}

function buildSystemPrompt(params: AgentRunParams): string {
  const lines: string[] = [
    `Jsi ${params.agentName}, AI agent s rolí: ${params.agentRole}.`,
  ]

  if (params.agentGoal) {
    lines.push(`Tvůj cíl: ${params.agentGoal}`)
  }

  if (params.agentPersona) {
    lines.push(`Tvá osobnost: ${params.agentPersona}`)
  }

  lines.push(
    '',
    'Splň zadaný úkol a podej jasnou, stručnou odpověď. Odpovídej přímo a bez zbytečného formátování.',
  )

  return lines.join('\n')
}
