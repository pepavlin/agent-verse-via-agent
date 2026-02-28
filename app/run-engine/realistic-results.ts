// ---------------------------------------------------------------------------
// Realistic result and question generation — topic-aware, persona-driven
// ---------------------------------------------------------------------------
//
// This module generates contextual, realistic-looking fake responses for the
// MockLLM by analysing the task description text (keyword heuristics) and
// incorporating the agent's goal and persona into the output.
//
// Pipeline:
//   1. detectTopic(taskDescription)   → TopicCategory (keyword heuristics)
//   2. detectPersonaStyle(persona)    → PersonaStyle  (trait keywords)
//   3. pick template set for (topic, style)
//   4. interpolate agentName, agentRole, agentGoal, taskDescription into result
//
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Topic detection
// ---------------------------------------------------------------------------

/**
 * High-level domain category inferred from the task description text.
 *
 * 'general' is the fallback when no specific topic is detected.
 */
export type TopicCategory =
  | 'exploration'   // map, explore, survey, navigate, chart, terrain
  | 'construction'  // build, construct, install, deploy, repair, maintain
  | 'intelligence'  // scout, gather, intel, observe, report, status
  | 'defense'       // defend, protect, secure, guard, patrol, monitor
  | 'coding'        // code, program, script, debug, implement, fix
  | 'research'      // analyze, research, study, investigate, review, assess
  | 'communication' // send, message, notify, alert, broadcast, communicate
  | 'planning'      // plan, organize, coordinate, schedule, strategize
  | 'general'       // fallback

/** Keyword sets for each topic, ordered from most specific to least. */
const TOPIC_KEYWORDS: Record<Exclude<TopicCategory, 'general'>, string[]> = {
  exploration: [
    'map', 'explore', 'survey', 'scan', 'chart', 'navigate', 'terrain', 'discover',
    'venture', 'trek', 'traverse', 'sector', 'area', 'region', 'zone', 'grid',
    'unexplored', 'unknown', 'territory',
  ],
  construction: [
    'build', 'construct', 'create', 'install', 'deploy', 'repair', 'maintain',
    'erect', 'assemble', 'set up', 'establish', 'foundation', 'structure',
    'tower', 'wall', 'bridge', 'outpost', 'base',
  ],
  intelligence: [
    'scout', 'intel', 'intelligence', 'gather', 'observe', 'spy', 'recon',
    'reconnaissance', 'identify', 'track', 'trace', 'locate', 'find', 'spot',
    'detect', 'report back', 'info', 'data collection',
  ],
  defense: [
    'defend', 'protect', 'secure', 'guard', 'patrol', 'monitor', 'watch',
    'safeguard', 'fortify', 'reinforce', 'perimeter', 'checkpoint', 'standby',
    'neutralise', 'neutralize', 'threat', 'intrusion', 'breach',
  ],
  coding: [
    'code', 'program', 'script', 'debug', 'implement', 'fix', 'refactor',
    'function', 'algorithm', 'api', 'endpoint', 'module', 'class', 'test',
    'deploy', 'pipeline', 'database', 'query', 'bug', 'error',
  ],
  research: [
    'analyze', 'analyse', 'research', 'study', 'investigate', 'review', 'assess',
    'evaluate', 'examine', 'audit', 'measure', 'benchmark', 'compare', 'document',
    'report', 'findings', 'conclusions', 'hypothesis', 'data', 'evidence',
  ],
  communication: [
    'send', 'message', 'notify', 'alert', 'broadcast', 'communicate', 'relay',
    'inform', 'update', 'announce', 'dispatch', 'signal', 'contact', 'reach',
    'transmit', 'share', 'distribute', 'publish',
  ],
  planning: [
    'plan', 'organize', 'organise', 'coordinate', 'schedule', 'strategize',
    'strategise', 'prioritize', 'prioritise', 'allocate', 'roadmap', 'timeline',
    'strategy', 'tactic', 'objective', 'milestone', 'goal', 'prepare',
  ],
}

/**
 * Detect the topic category of a task description using keyword heuristics.
 *
 * Each word in the text is checked against keyword sets. The topic with the
 * highest keyword hit count wins. Ties are broken by declaration order.
 * Returns 'general' if no keywords match.
 */
export function detectTopic(taskDescription: string): TopicCategory {
  const lower = taskDescription.toLowerCase()

  let bestTopic: TopicCategory = 'general'
  let bestScore = 0

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS) as [Exclude<TopicCategory, 'general'>, string[]][]) {
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestTopic = topic
    }
  }

  return bestTopic
}

// ---------------------------------------------------------------------------
// Persona style detection
// ---------------------------------------------------------------------------

/**
 * Stylistic mode derived from the agent's persona description.
 * Influences tone and level of detail in generated responses.
 *
 * - 'bold'       → short, confident, action-first prose
 * - 'methodical' → detailed, structured, step-by-step prose
 * - 'swift'      → brief, punchy, fast-paced prose
 * - 'steadfast'  → formal, thorough, duty-conscious prose
 * - 'neutral'    → balanced default when persona is absent or unrecognised
 */
export type PersonaStyle = 'bold' | 'methodical' | 'swift' | 'steadfast' | 'neutral'

const PERSONA_STYLE_KEYWORDS: Record<PersonaStyle, string[]> = {
  bold: ['bold', 'curious', 'adventurous', 'daring', 'fearless', 'brave', 'first', 'venture'],
  methodical: ['methodical', 'reliable', 'careful', 'systematic', 'precise', 'thorough', 'plan', 'solid'],
  swift: ['fast', 'quick', 'observant', 'agile', 'rapid', 'move', 'speed', 'linger'],
  steadfast: ['steadfast', 'vigilant', 'responsible', 'duty', 'post', 'protect', 'abandon', 'serious'],
  neutral: [],
}

/**
 * Infer a persona style from the agent's persona description string.
 *
 * Returns 'neutral' when persona is undefined, empty, or unrecognised.
 */
export function detectPersonaStyle(persona?: string): PersonaStyle {
  if (!persona) return 'neutral'
  const lower = persona.toLowerCase()

  let bestStyle: PersonaStyle = 'neutral'
  let bestScore = 0

  for (const [style, keywords] of Object.entries(PERSONA_STYLE_KEYWORDS) as [PersonaStyle, string[]][]) {
    if (style === 'neutral') continue
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestStyle = style
    }
  }

  return bestStyle
}

// ---------------------------------------------------------------------------
// Template context
// ---------------------------------------------------------------------------

interface RealisticResultContext {
  agentName: string
  agentRole: string
  taskDescription: string
  agentGoal?: string
  agentPersona?: string
  topic: TopicCategory
  style: PersonaStyle
}

type RealisticTemplate = (ctx: RealisticResultContext) => string

// ---------------------------------------------------------------------------
// Result templates — grouped by topic
// ---------------------------------------------------------------------------

/** Shorthand: returns goal line if goal is set. */
function goalLine(goal?: string): string {
  return goal ? ` This aligns with the primary mission: "${goal}".` : ''
}

const EXPLORATION_RESULT_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription, agentGoal }) =>
    `Mapping operation complete. ${agentName} has fully charted the requested area for task "${taskDescription}" — 847 grid units surveyed, 3 previously unrecorded passages logged, and 2 terrain anomalies flagged for further investigation. All findings synced to the master map.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) filed the following field report: sector scan for "${taskDescription}" completed without incident. Coverage: 100%. Notable discoveries: one elevated vantage point at grid E-4, one concealed entrance at grid F-7. Grid overlay updated.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `Exploration of "${taskDescription}" concluded. ${agentName} documented 14 waypoints, encountered no hostile presence, and identified 2 resource caches. Route data exported for delegation.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} the ${agentRole} completed the survey for "${taskDescription}". Terrain: mixed forest and open plain. Estimated traversal time for future missions: 22 minutes. Map data is now 97% accurate for this sector.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `"${taskDescription}" — fully executed. ${agentName} returned with high-resolution sector data: 6 grid quadrants mapped, 1 potential shortcut identified (saves ~8 min), environmental conditions nominal.${goalLine(agentGoal)}`,
]

const CONSTRUCTION_RESULT_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription, agentGoal }) =>
    `Construction complete. ${agentName} finished "${taskDescription}" using 48 timber units and 12 stone blocks. Structural integrity: 100%. Maintenance schedule logged.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) delivery report: "${taskDescription}" has been erected and stress-tested. Load capacity: 2.4 tonnes. Estimated lifespan under normal conditions: 18 months. Zero defects found.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `Build task "${taskDescription}" signed off. ${agentName} completed all 5 construction phases on schedule. Materials used: within budget. Site cleared and secured post-build.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} the ${agentRole} completed "${taskDescription}". Foundation: reinforced. Sightlines: 180° north–south corridor. Components: all bolted and sealed. Ready for immediate use.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `"${taskDescription}" — done. ${agentName} assembled and tested the installation. Power connections active, communications link confirmed, structural seals airtight.${goalLine(agentGoal)}`,
]

const INTELLIGENCE_RESULT_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription, agentGoal }) =>
    `Intel gathered. ${agentName} completed "${taskDescription}": 2.3 km covered, movement of 3 unidentified units logged at 08:42 moving north-northeast. Choke point at grid E-9 identified. All data transmitted.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) intelligence summary for "${taskDescription}": No hostile structures detected. Patrol interval: ~45 minutes. Blind spots mapped at grid B-3 and D-8. Recommend insertion via western flank.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `"${taskDescription}" — recon complete. ${agentName} identified 4 persons of interest, documented vehicle activity at 09:15 and 11:30, and extracted signal intercepts for analysis.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} the ${agentRole} completed surveillance for "${taskDescription}". Observation window: 3 hours. Key findings: supply depot active 06:00–18:00, guard rotation every 2 hours, east gate unmonitored 14:00–14:30.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `Field report from ${agentName}: "${taskDescription}" executed successfully. Assets located, photographed, and catalogued. No detection occurred. Report ready for command review.${goalLine(agentGoal)}`,
]

const DEFENSE_RESULT_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription, agentGoal }) =>
    `Perimeter secured. ${agentName} completed "${taskDescription}" — defensive cordon established, all 4 approach vectors covered. Checkpoints active. Standby protocol engaged.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) security report for "${taskDescription}": area clear of threats. 2 suspicious contacts investigated and cleared. Patrol route optimised for 24/7 coverage. No breaches logged.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `"${taskDescription}" — defense task completed. ${agentName} reinforced 3 weak points, repositioned 2 sensors, and established a rapid-response protocol. Response time now under 90 seconds.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} the ${agentRole} finished "${taskDescription}". Threat level: low. Fortifications: intact. All watch rotations staffed. Incident log: 0 events. Area classification: secured.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `Protection mandate for "${taskDescription}" fulfilled. ${agentName} established layered defense: outer perimeter (grid H-2 to H-9), inner cordon (grid I-4 to I-7), and central stronghold.${goalLine(agentGoal)}`,
]

const CODING_RESULT_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription, agentGoal }) =>
    `Task "${taskDescription}" completed. ${agentName} implemented the solution, wrote unit tests (coverage: 94%), and verified no regressions. CI pipeline: green. Merge-ready.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) code review for "${taskDescription}": 3 critical bugs fixed, 2 performance bottlenecks resolved (40% throughput gain), and API surface documented. PR submitted.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `"${taskDescription}" — implementation done. ${agentName} refactored 420 lines of legacy code, introduced proper error handling, and added integration tests. Build time: −15%.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} the ${agentRole} delivered "${taskDescription}". Endpoint live, auth middleware in place, rate limiting configured. Loadtest results: 1 200 req/s sustained. Zero errors.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `Code task "${taskDescription}" closed. ${agentName} debugged the root cause (off-by-one in pagination), deployed the fix to staging, and confirmed resolution with QA.${goalLine(agentGoal)}`,
]

const RESEARCH_RESULT_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription, agentGoal }) =>
    `Research complete. ${agentName} finished "${taskDescription}": reviewed 23 sources, synthesised 5 key insights, identified 2 conflicting data points requiring follow-up. Full report attached.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) analysis for "${taskDescription}": primary hypothesis supported (confidence: 78%). Outliers noted in Q3 data. Recommendations: increase sample size, retest variable B.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `"${taskDescription}" — study concluded. ${agentName} benchmarked 6 competing approaches, documented trade-offs, and proposed a phased implementation plan. Estimated ROI: 3.2×.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} the ${agentRole} completed assessment of "${taskDescription}". Risk matrix updated: 2 high-impact items escalated, 4 medium items scheduled for next sprint. Executive summary ready.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `Findings from "${taskDescription}" documented. ${agentName} evaluated 4 frameworks, ran 12 experiments, and produced a 3-page summary with actionable next steps.${goalLine(agentGoal)}`,
]

const COMMUNICATION_RESULT_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription, agentGoal }) =>
    `Message delivered. ${agentName} completed "${taskDescription}": all intended recipients acknowledged. Delivery confirmation logged at 11:04. No bounced transmissions.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) broadcast for "${taskDescription}": distributed to 14 nodes, read receipts: 12/14. 2 nodes offline — retry scheduled in 30 minutes.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `"${taskDescription}" — communication task done. ${agentName} composed and dispatched the alert. Priority: HIGH. Channel: encrypted relay. Status: confirmed.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} the ${agentRole} completed "${taskDescription}". Notification sent to 3 channels (primary, backup, emergency). Response received from 2 of 3. Third channel marked unreachable.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `Outbound relay for "${taskDescription}" complete. ${agentName} transmitted the update through secure channel, signal strength: 97%, latency: 42 ms.${goalLine(agentGoal)}`,
]

const PLANNING_RESULT_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription, agentGoal }) =>
    `Plan finalised. ${agentName} completed "${taskDescription}": 5-phase roadmap drafted, dependencies mapped, resource requirements estimated (12 units/day). Ready for approval.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) strategy document for "${taskDescription}": 3 scenarios modelled (optimistic / baseline / contingency). Critical path identified. Risk mitigation: 4 items flagged.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `"${taskDescription}" — planning session complete. ${agentName} aligned 5 stakeholders, resolved 2 conflicting priorities, and published a shared timeline. First milestone: T+7 days.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} the ${agentRole} delivered the plan for "${taskDescription}". Scope confirmed, milestones agreed, owner assignments distributed. Kickoff scheduled for next cycle.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `Coordination task "${taskDescription}" wrapped. ${agentName} produced a prioritised backlog (18 items), identified 3 quick wins, and set up a weekly progress cadence.${goalLine(agentGoal)}`,
]

const GENERAL_RESULT_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription, agentGoal }) =>
    `${agentName} completed the task: "${taskDescription}". All objectives addressed and findings documented.${goalLine(agentGoal)}`,

  ({ agentName, agentRole, taskDescription }) =>
    `As a ${agentRole}, ${agentName} concluded "${taskDescription}" with no unresolved issues. Outcome: satisfactory. Ready for next assignment.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `Task "${taskDescription}" resolved by ${agentName}. Summary filed, dependencies cleared, status set to done.${goalLine(agentGoal)}`,

  ({ agentName, agentRole }) =>
    `${agentName} (${agentRole}) has finished the assigned task and is standing by for new instructions.`,

  ({ agentName, taskDescription, agentGoal }) =>
    `"${taskDescription}" — closed. ${agentName} reports no blockers and considers all deliverables fully addressed.${goalLine(agentGoal)}`,
]

/** All topic → template map for results. */
const REALISTIC_RESULT_TEMPLATES: Record<TopicCategory, RealisticTemplate[]> = {
  exploration:   EXPLORATION_RESULT_TEMPLATES,
  construction:  CONSTRUCTION_RESULT_TEMPLATES,
  intelligence:  INTELLIGENCE_RESULT_TEMPLATES,
  defense:       DEFENSE_RESULT_TEMPLATES,
  coding:        CODING_RESULT_TEMPLATES,
  research:      RESEARCH_RESULT_TEMPLATES,
  communication: COMMUNICATION_RESULT_TEMPLATES,
  planning:      PLANNING_RESULT_TEMPLATES,
  general:       GENERAL_RESULT_TEMPLATES,
}

// ---------------------------------------------------------------------------
// Question templates — grouped by topic
// ---------------------------------------------------------------------------

const EXPLORATION_QUESTION_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} is ready to begin "${taskDescription}" but needs clarification: Should the sector scan include underground passages, or surface terrain only?`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) paused on "${taskDescription}": Are there any restricted zones within the target area that should be excluded from the mapping?`,

  ({ agentName, taskDescription }) =>
    `Before entering the field for "${taskDescription}", ${agentName} asks: What is the priority order if multiple unexplored sectors are discovered simultaneously?`,
]

const CONSTRUCTION_QUESTION_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} is about to start "${taskDescription}" but needs to confirm: What material specification applies — standard or reinforced?`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) is blocked on "${taskDescription}": The designated grid coordinates are occupied. Should the structure be repositioned or should the existing content be removed first?`,

  ({ agentName, taskDescription }) =>
    `${agentName} asks before proceeding with "${taskDescription}": Is there a load-bearing requirement that should determine the foundation depth?`,
]

const INTELLIGENCE_QUESTION_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} is ready to execute "${taskDescription}" but requires clarification: Is passive observation only, or is active probing permitted?`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) paused on "${taskDescription}": What is the acceptable risk level — covert only, or can limited exposure be tolerated?`,

  ({ agentName, taskDescription }) =>
    `Before deploying for "${taskDescription}", ${agentName} asks: How should conflicting intelligence from multiple sources be prioritised?`,
]

const DEFENSE_QUESTION_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} is setting up for "${taskDescription}" but needs guidance: Are neutralise-on-sight rules of engagement active, or contain-and-report only?`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) asks before proceeding with "${taskDescription}": What is the escalation threshold — at what point should command be notified of a contact?`,

  ({ agentName, taskDescription }) =>
    `${agentName} paused on "${taskDescription}": Should the defensive perimeter be maintained continuously or is rotational coverage acceptable?`,
]

const CODING_QUESTION_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} needs to clarify "${taskDescription}": Should the implementation be backward-compatible with v1 of the API, or is a breaking change acceptable?`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) asks about "${taskDescription}": What is the target test coverage threshold — 80%, 90%, or 100%?`,

  ({ agentName, taskDescription }) =>
    `Before starting "${taskDescription}", ${agentName} asks: Is this feature behind a feature flag, or should it be deployed to all users immediately?`,
]

const RESEARCH_QUESTION_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} is working on "${taskDescription}" and needs clarification: Should the analysis include historical data from before the baseline period, or only current-cycle data?`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) encountered ambiguity in "${taskDescription}": Are outlier data points to be excluded, or should they be reported separately?`,

  ({ agentName, taskDescription }) =>
    `Before finalising "${taskDescription}", ${agentName} asks: Who is the primary audience for the findings — technical team or executive summary?`,
]

const COMMUNICATION_QUESTION_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} is ready to transmit for "${taskDescription}" but needs to confirm: Should this go via the primary channel only, or broadcast to all available channels?`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) asks about "${taskDescription}": Is end-to-end encryption required for this transmission, or is standard relay acceptable?`,

  ({ agentName, taskDescription }) =>
    `Before dispatching "${taskDescription}", ${agentName} asks: Should recipients confirm receipt, or is a one-way broadcast sufficient?`,
]

const PLANNING_QUESTION_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} is drafting the plan for "${taskDescription}" but needs input: Should timelines be optimistic (best-case) or padded for risk (conservative)?`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) asks about "${taskDescription}": Are there budget constraints that should cap the resource allocation in the plan?`,

  ({ agentName, taskDescription }) =>
    `Before finalising "${taskDescription}", ${agentName} asks: Which stakeholder group has final sign-off authority on this plan?`,
]

const GENERAL_QUESTION_TEMPLATES: RealisticTemplate[] = [
  ({ agentName, taskDescription }) =>
    `${agentName} needs clarification on "${taskDescription}": What is the expected output format for the final deliverable?`,

  ({ agentName, agentRole, taskDescription }) =>
    `${agentName} (${agentRole}) encountered an ambiguity in "${taskDescription}". Should the results be summarised or provided in full detail?`,

  ({ agentName, taskDescription }) =>
    `Before completing "${taskDescription}", ${agentName} asks: Are there any constraints or limitations that should be taken into account?`,

  ({ agentName, agentRole }) =>
    `${agentName} the ${agentRole} needs more information: What are the success criteria for this task?`,

  ({ agentName, taskDescription }) =>
    `${agentName} has a question about "${taskDescription}": Who are the intended recipients of the final output?`,
]

/** All topic → template map for questions. */
const REALISTIC_QUESTION_TEMPLATES: Record<TopicCategory, RealisticTemplate[]> = {
  exploration:   EXPLORATION_QUESTION_TEMPLATES,
  construction:  CONSTRUCTION_QUESTION_TEMPLATES,
  intelligence:  INTELLIGENCE_QUESTION_TEMPLATES,
  defense:       DEFENSE_QUESTION_TEMPLATES,
  coding:        CODING_QUESTION_TEMPLATES,
  research:      RESEARCH_QUESTION_TEMPLATES,
  communication: COMMUNICATION_QUESTION_TEMPLATES,
  planning:      PLANNING_QUESTION_TEMPLATES,
  general:       GENERAL_QUESTION_TEMPLATES,
}

// ---------------------------------------------------------------------------
// Persona style → template index buckets
// ---------------------------------------------------------------------------
//
// Each topic has multiple templates, each written with a subtly different
// tone. Style buckets map a PersonaStyle to the subset of template indices
// that best match that style. When a persona is detected, only the matching
// bucket of templates is considered for selection, so the generated response
// actually reflects the agent's personality.
//
// Bucket conventions (per topic, results have 5 templates, questions have 3):
//   bold      → short, action-first, confident prose
//   methodical → detailed, structured, step-by-step
//   swift      → brief, punchy, efficient
//   steadfast  → formal, thorough, duty-conscious
//   neutral    → all indices (no style preference)
// ---------------------------------------------------------------------------

/**
 * Maps each PersonaStyle to the template indices that best express that style
 * for a given topic.
 *
 * `neutral` always includes all indices so that agents without a detected
 * persona still get the full variety of templates.
 */
export type StyleTemplateBuckets = Record<PersonaStyle, number[]>

/** Style buckets for result templates, keyed by topic. */
export const RESULT_STYLE_BUCKETS: Record<TopicCategory, StyleTemplateBuckets> = {
  // Template 0: "Mapping operation complete" — action-first (bold)
  // Template 1: "filed the following field report" — formal report (methodical)
  // Template 2: "documented 14 waypoints" — comprehensive (steadfast)
  // Template 3: "completed the survey… Terrain: mixed forest" — balanced (methodical/neutral)
  // Template 4: "fully executed… high-resolution sector data" — brief (swift)
  exploration: {
    bold:       [0],
    methodical: [1, 3],
    swift:      [4],
    steadfast:  [2],
    neutral:    [0, 1, 2, 3, 4],
  },

  // Template 0: "using 48 timber units… Maintenance schedule logged" — detailed (methodical)
  // Template 1: "delivery report… stress-tested. Load capacity" — formal spec (methodical)
  // Template 2: "all 5 phases on schedule… within budget" — comprehensive (steadfast)
  // Template 3: "Foundation: reinforced. Sightlines… bolted and sealed" — thorough (steadfast)
  // Template 4: "assembled and tested… Power connections active" — direct (bold/swift)
  construction: {
    bold:       [4],
    methodical: [0, 1],
    swift:      [4],
    steadfast:  [2, 3],
    neutral:    [0, 1, 2, 3, 4],
  },

  // Template 0: "Intel gathered… movement logged… Choke point identified" — swift/specific
  // Template 1: "intelligence summary… No hostile structures… Blind spots mapped" — methodical
  // Template 2: "identified 4 persons of interest… extracted signal intercepts" — bold
  // Template 3: "Observation window: 3 hours… guard rotation every 2 hours" — steadfast
  // Template 4: "Assets located, photographed, catalogued. No detection." — swift
  intelligence: {
    bold:       [2],
    methodical: [1],
    swift:      [0, 4],
    steadfast:  [3],
    neutral:    [0, 1, 2, 3, 4],
  },

  // Template 0: "defensive cordon established, all 4 approach vectors covered" — steadfast
  // Template 1: "security report: area clear… Patrol route optimised" — methodical
  // Template 2: "reinforced 3 weak points… rapid-response protocol" — bold
  // Template 3: "Threat level: low. Fortifications: intact. Incident log: 0" — steadfast
  // Template 4: "layered defense: outer perimeter / inner cordon / central stronghold" — methodical
  defense: {
    bold:       [2],
    methodical: [1, 4],
    swift:      [2],
    steadfast:  [0, 3],
    neutral:    [0, 1, 2, 3, 4],
  },

  // Template 0: "unit tests (94%)… CI: green. Merge-ready" — methodical
  // Template 1: "3 bugs fixed, 2 bottlenecks resolved (40% throughput)" — methodical
  // Template 2: "refactored 420 lines… error handling… Build time: −15%" — bold/swift
  // Template 3: "Endpoint live, auth middleware… Loadtest: 1200 req/s" — methodical
  // Template 4: "debugged root cause (off-by-one)… confirmed with QA" — swift
  coding: {
    bold:       [2],
    methodical: [0, 1, 3],
    swift:      [4],
    steadfast:  [0, 3],
    neutral:    [0, 1, 2, 3, 4],
  },

  // Template 0: "reviewed 23 sources, synthesised 5 key insights" — methodical
  // Template 1: "primary hypothesis supported (confidence: 78%)" — methodical
  // Template 2: "benchmarked 6 approaches, documented trade-offs, phased plan" — methodical
  // Template 3: "Risk matrix updated: 2 high-impact items escalated" — steadfast
  // Template 4: "evaluated 4 frameworks, ran 12 experiments, 3-page summary" — bold/swift
  research: {
    bold:       [4],
    methodical: [0, 1, 2],
    swift:      [4],
    steadfast:  [3],
    neutral:    [0, 1, 2, 3, 4],
  },

  // Template 0: "all recipients acknowledged. Delivery confirmation logged" — swift
  // Template 1: "broadcast: distributed to 14 nodes, read receipts: 12/14" — methodical
  // Template 2: "Priority: HIGH. Channel: encrypted relay. Status: confirmed" — bold
  // Template 3: "Notification sent to 3 channels (primary, backup, emergency)" — methodical
  // Template 4: "signal strength: 97%, latency: 42 ms" — swift
  communication: {
    bold:       [2],
    methodical: [1, 3],
    swift:      [0, 4],
    steadfast:  [3],
    neutral:    [0, 1, 2, 3, 4],
  },

  // Template 0: "5-phase roadmap drafted, dependencies mapped, resource requirements" — methodical
  // Template 1: "3 scenarios modelled (optimistic / baseline / contingency)" — methodical
  // Template 2: "aligned 5 stakeholders, resolved 2 conflicting priorities" — bold
  // Template 3: "Scope confirmed, milestones agreed, owner assignments distributed" — steadfast
  // Template 4: "prioritised backlog (18 items), 3 quick wins, weekly cadence" — swift
  planning: {
    bold:       [2],
    methodical: [0, 1],
    swift:      [4],
    steadfast:  [3],
    neutral:    [0, 1, 2, 3, 4],
  },

  // Template 0: "All objectives addressed and findings documented" — neutral
  // Template 1: "Outcome: satisfactory. Ready for next assignment" — neutral/steadfast
  // Template 2: "Summary filed, dependencies cleared, status set to done" — methodical
  // Template 3: "has finished and is standing by for new instructions" — swift
  // Template 4: "reports no blockers and considers all deliverables fully addressed" — bold
  general: {
    bold:       [4],
    methodical: [0, 2],
    swift:      [3],
    steadfast:  [1],
    neutral:    [0, 1, 2, 3, 4],
  },
}

/** Style buckets for question templates, keyed by topic. */
export const QUESTION_STYLE_BUCKETS: Record<TopicCategory, StyleTemplateBuckets> = {
  // Q0: "Should the sector scan include underground passages?" — direct (bold)
  // Q1: "Are there any restricted zones… that should be excluded?" — methodical/steadfast
  // Q2: "What is the priority order if multiple sectors are discovered?" — methodical
  exploration: {
    bold:       [0],
    methodical: [1, 2],
    swift:      [0],
    steadfast:  [1],
    neutral:    [0, 1, 2],
  },

  // Q0: "What material specification applies — standard or reinforced?" — methodical
  // Q1: "The designated coordinates are occupied. Reposition or remove?" — bold
  // Q2: "Is there a load-bearing requirement that should determine foundation depth?" — methodical
  construction: {
    bold:       [1],
    methodical: [0, 2],
    swift:      [1],
    steadfast:  [0, 2],
    neutral:    [0, 1, 2],
  },

  // Q0: "Is passive observation only, or is active probing permitted?" — swift
  // Q1: "What is the acceptable risk level — covert only or limited exposure?" — steadfast
  // Q2: "How should conflicting intelligence from multiple sources be prioritised?" — methodical
  intelligence: {
    bold:       [0],
    methodical: [2],
    swift:      [0],
    steadfast:  [1],
    neutral:    [0, 1, 2],
  },

  // Q0: "Are neutralise-on-sight rules active, or contain-and-report only?" — bold/steadfast
  // Q1: "What is the escalation threshold — when to notify command?" — steadfast
  // Q2: "Should the defensive perimeter be maintained continuously or rotational?" — methodical
  defense: {
    bold:       [0],
    methodical: [2],
    swift:      [0],
    steadfast:  [0, 1],
    neutral:    [0, 1, 2],
  },

  // Q0: "Should the implementation be backward-compatible with v1?" — methodical
  // Q1: "What is the target test coverage threshold — 80%, 90%, or 100%?" — methodical
  // Q2: "Is this feature behind a feature flag, or deployed to all users immediately?" — swift
  coding: {
    bold:       [2],
    methodical: [0, 1],
    swift:      [2],
    steadfast:  [0, 1],
    neutral:    [0, 1, 2],
  },

  // Q0: "Should the analysis include historical data or only current-cycle data?" — methodical
  // Q1: "Are outlier data points to be excluded, or reported separately?" — methodical
  // Q2: "Who is the primary audience — technical team or executive summary?" — swift
  research: {
    bold:       [2],
    methodical: [0, 1],
    swift:      [2],
    steadfast:  [0, 1],
    neutral:    [0, 1, 2],
  },

  // Q0: "Should this go via the primary channel only, or broadcast to all?" — bold
  // Q1: "Is end-to-end encryption required, or is standard relay acceptable?" — steadfast
  // Q2: "Should recipients confirm receipt, or is a one-way broadcast sufficient?" — swift
  communication: {
    bold:       [0],
    methodical: [1, 2],
    swift:      [2],
    steadfast:  [1],
    neutral:    [0, 1, 2],
  },

  // Q0: "Should timelines be optimistic (best-case) or padded for risk?" — methodical
  // Q1: "Are there budget constraints that should cap the resource allocation?" — methodical
  // Q2: "Which stakeholder group has final sign-off authority?" — steadfast
  planning: {
    bold:       [0],
    methodical: [0, 1],
    swift:      [0],
    steadfast:  [2],
    neutral:    [0, 1, 2],
  },

  // Q0: "What is the expected output format for the final deliverable?" — neutral
  // Q1: "Should the results be summarised or provided in full detail?" — methodical
  // Q2: "Are there any constraints or limitations that should be taken into account?" — neutral
  // Q3: "What are the success criteria for this task?" — steadfast
  // Q4: "Who are the intended recipients of the final output?" — swift
  general: {
    bold:       [2],
    methodical: [1, 3],
    swift:      [4],
    steadfast:  [3],
    neutral:    [0, 1, 2, 3, 4],
  },
}

// ---------------------------------------------------------------------------
// Internal helper: style-aware index selection
// ---------------------------------------------------------------------------

/**
 * Pick a template index from the style-appropriate bucket for a given topic.
 *
 * When `pickIndex` is supplied the index is resolved deterministically within
 * the bucket (modulo bucket length). When omitted, a random index from the
 * bucket is chosen.
 */
function pickStyleIndex(
  buckets: StyleTemplateBuckets,
  style: PersonaStyle,
  pickIndex?: number,
): number {
  const bucket = buckets[style]
  if (pickIndex !== undefined) {
    return bucket[((pickIndex % bucket.length) + bucket.length) % bucket.length]
  }
  return bucket[Math.floor(Math.random() * bucket.length)]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a realistic result string for a completed run.
 *
 * Topic is auto-detected from `taskDescription` via keyword heuristics.
 * The agent's `goal` is woven into the output to ground it in the agent's
 * broader mission. `persona` drives style detection which selects from a
 * persona-appropriate subset of templates, so the response tone actually
 * reflects the agent's personality (bold, methodical, swift, steadfast, or
 * neutral when persona is absent).
 *
 * @param agentName       Display name of the agent (e.g. "Alice")
 * @param agentRole       Role label (e.g. "Explorer")
 * @param taskDescription The task that was executed
 * @param agentGoal       Optional: agent's overarching mission statement
 * @param agentPersona    Optional: personality description (affects style)
 * @param pickIndex       Optional index override for deterministic selection (tests)
 */
export function generateRealisticResult(
  agentName: string,
  agentRole: string,
  taskDescription: string,
  agentGoal?: string,
  agentPersona?: string,
  pickIndex?: number,
): string {
  const topic = detectTopic(taskDescription)
  const style = detectPersonaStyle(agentPersona)
  const templates = REALISTIC_RESULT_TEMPLATES[topic]

  const idx = pickStyleIndex(RESULT_STYLE_BUCKETS[topic], style, pickIndex)

  const ctx: RealisticResultContext = {
    agentName,
    agentRole,
    taskDescription,
    agentGoal,
    agentPersona,
    topic,
    style,
  }

  let result = templates[idx](ctx)

  // Guarantee that the goal is always present in the output when provided.
  // Some templates include it inline via goalLine(); for those that don't,
  // append it as a mission-alignment note so callers can always rely on
  // the goal appearing in the text when it was supplied.
  if (agentGoal && !result.includes(agentGoal)) {
    result += ` This aligns with the primary mission: "${agentGoal}".`
  }

  return result
}

/**
 * Generate a realistic clarifying question for an awaiting run.
 *
 * Topic is auto-detected from `taskDescription`. Questions are domain-specific
 * and persona-styled so they feel natural for both the type of work being done
 * and the agent's personality.
 *
 * @param agentName       Display name of the agent (e.g. "Alice")
 * @param agentRole       Role label (e.g. "Explorer")
 * @param taskDescription The task that triggered the question
 * @param agentGoal       Optional: agent's overarching mission statement
 * @param agentPersona    Optional: personality description
 * @param pickIndex       Optional index override for deterministic selection (tests)
 */
export function generateRealisticQuestion(
  agentName: string,
  agentRole: string,
  taskDescription: string,
  agentGoal?: string,
  agentPersona?: string,
  pickIndex?: number,
): string {
  const topic = detectTopic(taskDescription)
  const style = detectPersonaStyle(agentPersona)
  const templates = REALISTIC_QUESTION_TEMPLATES[topic]

  const idx = pickStyleIndex(QUESTION_STYLE_BUCKETS[topic], style, pickIndex)

  const ctx: RealisticResultContext = {
    agentName,
    agentRole,
    taskDescription,
    agentGoal,
    agentPersona,
    topic,
    style,
  }

  return templates[idx](ctx)
}

/**
 * Total number of realistic result templates across all topics.
 * Useful for exhaustive test iteration.
 */
export const REALISTIC_RESULT_TEMPLATE_COUNTS: Record<TopicCategory, number> = Object.fromEntries(
  Object.entries(REALISTIC_RESULT_TEMPLATES).map(([topic, templates]) => [topic, templates.length]),
) as Record<TopicCategory, number>

/**
 * Total number of realistic question templates across all topics.
 * Useful for exhaustive test iteration.
 */
export const REALISTIC_QUESTION_TEMPLATE_COUNTS: Record<TopicCategory, number> = Object.fromEntries(
  Object.entries(REALISTIC_QUESTION_TEMPLATES).map(([topic, templates]) => [topic, templates.length]),
) as Record<TopicCategory, number>

/** Ordered list of all topic categories (for iteration in tests). */
export const ALL_TOPIC_CATEGORIES: TopicCategory[] = [
  'exploration', 'construction', 'intelligence', 'defense',
  'coding', 'research', 'communication', 'planning', 'general',
]

/** Ordered list of all persona styles (for iteration in tests). */
export const ALL_PERSONA_STYLES: PersonaStyle[] = [
  'bold', 'methodical', 'swift', 'steadfast', 'neutral',
]
