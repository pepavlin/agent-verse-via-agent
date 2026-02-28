// ---------------------------------------------------------------------------
// Result and question text generation — pure functions, no side effects
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

// ---------------------------------------------------------------------------
// Question generation — for mock "awaiting" runs
// ---------------------------------------------------------------------------

/**
 * Templates for clarifying questions an agent might raise mid-task.
 * Each template returns a prose question string using the run context.
 */
const QUESTION_TEMPLATES: ResultTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} needs clarification on "${taskDescription}": What is the expected output format?`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) encountered an ambiguity in "${taskDescription}". Should the results be summarised or kept in full detail?`,

  ({ agentName, taskDescription }) =>
    `Before completing "${taskDescription}", ${agentName} asks: Are there any constraints or limitations to be aware of?`,

  ({ agentName, agentRole }) =>
    `${agentName} the ${agentRole} needs more information: What are the success criteria for this task?`,

  ({ agentName, taskDescription }) =>
    `${agentName} is paused on "${taskDescription}": Should this take priority over other ongoing assignments?`,

  ({ agentName, agentRole, taskDescription }) =>
    `As a ${agentRole}, ${agentName} would like to confirm: Is "${taskDescription}" meant to be executed autonomously or with human oversight?`,

  ({ agentName, taskDescription }) =>
    `${agentName} has a question about "${taskDescription}": Who are the intended recipients of the final output?`,

  ({ agentName, agentRole }) =>
    `${agentName} (${agentRole}) requests guidance: Is there a preferred approach or tool that should be used for this task?`,
]

/**
 * Generate a plain-prose question string for an awaiting run.
 *
 * @param agentName       Display name of the agent (e.g. "Alice")
 * @param agentRole       Role label of the agent (e.g. "Explorer")
 * @param taskDescription The task that triggered the question
 * @param pickIndex       Optional index override for deterministic selection (used in tests).
 *                        When omitted a random template is chosen.
 */
export function generateQuestion(
  agentName: string,
  agentRole: string,
  taskDescription: string,
  pickIndex?: number,
): string {
  const ctx: ResultContext = { agentName, agentRole, taskDescription }
  const idx =
    pickIndex !== undefined
      ? ((pickIndex % QUESTION_TEMPLATES.length) + QUESTION_TEMPLATES.length) %
        QUESTION_TEMPLATES.length
      : Math.floor(Math.random() * QUESTION_TEMPLATES.length)
  return QUESTION_TEMPLATES[idx](ctx)
}

/** Total number of available question templates (useful for exhaustive testing). */
export const QUESTION_TEMPLATE_COUNT = QUESTION_TEMPLATES.length
