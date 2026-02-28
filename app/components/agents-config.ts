// ---------------------------------------------------------------------------
// Agent definitions — no pixi.js dependency, safe to import in tests
// ---------------------------------------------------------------------------

export interface AgentDef {
  id: string
  name: string
  role: string
  /** Fill colour as 0xRRGGBB */
  color: number
  /** Starting column (0-based) */
  startCol: number
  /** Starting row (0-based) */
  startRow: number
  /** What this agent is trying to achieve */
  goal?: string
  /** How this agent behaves / personality description */
  persona?: string
  /**
   * IDs of child agents this agent can delegate sub-tasks to.
   * When set, running this agent will spawn parallel sub-runs for each child
   * and compose their results before completing the parent run.
   */
  childAgentIds?: string[]
}

export const AGENTS: AgentDef[] = [
  {
    id: 'agent-alice',
    name: 'Alice',
    role: 'Explorer',
    color: 0xff6b6b,
    startCol: 5,
    startRow: 5,
    goal: 'Map all unexplored areas of the grid',
    persona: 'Curious and bold. Always the first to venture into unknown territory.',
    // Alice delegates field work to Bob (Builder) and Carol (Scout)
    childAgentIds: ['agent-bob', 'agent-carol'],
  },
  {
    id: 'agent-bob',
    name: 'Bob',
    role: 'Builder',
    color: 0x4ecdc4,
    startCol: 20,
    startRow: 15,
    goal: 'Construct and maintain structures across the grid',
    persona: 'Methodical and reliable. Prefers a solid plan before starting any project.',
  },
  {
    id: 'agent-carol',
    name: 'Carol',
    role: 'Scout',
    color: 0xffe66d,
    startCol: 35,
    startRow: 30,
    goal: 'Gather intelligence and report back quickly',
    persona: 'Fast and observant. Never lingers — always on the move.',
  },
  {
    id: 'agent-dave',
    name: 'Dave',
    role: 'Defender',
    color: 0xa78bfa,
    startCol: 12,
    startRow: 38,
    goal: 'Protect key locations and prevent intrusions',
    persona: 'Steadfast and vigilant. Takes responsibility seriously and never abandons a post.',
  },
]
