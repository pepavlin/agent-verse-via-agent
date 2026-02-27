// ---------------------------------------------------------------------------
// Result text generation — pure functions, no side effects
// ---------------------------------------------------------------------------

/**
 * Template entries for generating completion messages.
 * Each template is a function that receives context and returns a prose string.
 */
type ResultTemplate = (ctx: ResultContext) => string

interface ResultContext {
  agentName: string
  agentRole: string
  taskDescription: string
}

const RESULT_TEMPLATES: ResultTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} successfully completed the task: "${taskDescription}". All objectives were met without issue.`,

  ({ agentName, agentRole, taskDescription }) =>
    `As a ${agentRole}, ${agentName} finished working on "${taskDescription}". The outcome exceeded initial expectations.`,

  ({ agentName, taskDescription }) =>
    `Task complete. ${agentName} wrapped up "${taskDescription}" and documented the findings for future reference.`,

  ({ agentName, agentRole }) =>
    `${agentName} (${agentRole}) has finished the assigned task and is ready for new instructions.`,

  ({ agentName, taskDescription }) =>
    `"${taskDescription}" — done. ${agentName} reports no blockers and considers the task fully resolved.`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} applied ${agentRole.toLowerCase()} expertise to "${taskDescription}" and delivered a solid result.`,

  ({ agentName, taskDescription }) =>
    `${agentName} completed "${taskDescription}". The area has been thoroughly covered and results logged.`,

  ({ agentName, agentRole }) =>
    `Mission accomplished. ${agentName} the ${agentRole} has finished the task and is returning to standby.`,
]

/**
 * Generate a plain-prose result string for a completed run.
 *
 * @param agentName  Display name of the agent (e.g. "Alice")
 * @param agentRole  Role label of the agent (e.g. "Explorer")
 * @param taskDescription  The task that was executed
 * @param pickIndex  Optional index override for deterministic selection (used in tests).
 *                   When omitted a random template is chosen.
 */
export function generateResult(
  agentName: string,
  agentRole: string,
  taskDescription: string,
  pickIndex?: number,
): string {
  const ctx: ResultContext = { agentName, agentRole, taskDescription }
  const idx =
    pickIndex !== undefined
      ? ((pickIndex % RESULT_TEMPLATES.length) + RESULT_TEMPLATES.length) % RESULT_TEMPLATES.length
      : Math.floor(Math.random() * RESULT_TEMPLATES.length)
  return RESULT_TEMPLATES[idx](ctx)
}

/** Total number of available result templates (useful for exhaustive testing). */
export const RESULT_TEMPLATE_COUNT = RESULT_TEMPLATES.length
