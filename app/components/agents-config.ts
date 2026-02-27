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
}

export const AGENTS: AgentDef[] = [
  {
    id: 'agent-alice',
    name: 'Alice',
    role: 'Explorer',
    color: 0xff6b6b,
    startCol: 5,
    startRow: 5,
  },
  {
    id: 'agent-bob',
    name: 'Bob',
    role: 'Builder',
    color: 0x4ecdc4,
    startCol: 20,
    startRow: 15,
  },
  {
    id: 'agent-carol',
    name: 'Carol',
    role: 'Scout',
    color: 0xffe66d,
    startCol: 35,
    startRow: 30,
  },
  {
    id: 'agent-dave',
    name: 'Dave',
    role: 'Defender',
    color: 0xa78bfa,
    startCol: 12,
    startRow: 38,
  },
]
