import { describe, it, expect } from 'vitest'
import { MockLLMService, createMockLLMService } from '../app/run-engine/mock-llm-service'
import type { MockLLMServiceConfig } from '../app/run-engine/mock-llm-service'
import {
  ALL_TOPIC_CATEGORIES,
  ALL_PERSONA_STYLES,
  RESULT_STYLE_BUCKETS,
  QUESTION_STYLE_BUCKETS,
} from '../app/run-engine/realistic-results'
import type { TopicCategory, PersonaStyle } from '../app/run-engine/realistic-results'

// ---------------------------------------------------------------------------
// Fixtures — mirrors the real agent definitions
// ---------------------------------------------------------------------------

const ALICE: MockLLMServiceConfig = {
  agentName: 'Alice',
  agentRole: 'Explorer',
  goal: 'Map all unexplored areas of the grid',
  persona: 'Curious and bold. Always the first to venture into unknown territory.',
}

const BOB: MockLLMServiceConfig = {
  agentName: 'Bob',
  agentRole: 'Builder',
  goal: 'Construct and maintain structures across the grid',
  persona: 'Methodical and reliable. Prefers a solid plan before starting any project.',
}

const CAROL: MockLLMServiceConfig = {
  agentName: 'Carol',
  agentRole: 'Scout',
  goal: 'Gather intelligence and report back quickly',
  persona: 'Fast and observant. Never lingers — always on the move.',
}

const DAVE: MockLLMServiceConfig = {
  agentName: 'Dave',
  agentRole: 'Defender',
  goal: 'Protect key locations and prevent intrusions',
  persona: 'Steadfast and vigilant. Takes responsibility seriously and never abandons a post.',
}

const MINIMAL: MockLLMServiceConfig = {
  agentName: 'Eve',
  agentRole: 'Assistant',
}

// ---------------------------------------------------------------------------
// Topic → task description mapping for deterministic tests
// ---------------------------------------------------------------------------

const TOPIC_TASKS: Record<TopicCategory, string> = {
  exploration:   'Map and survey the unknown territory',
  construction:  'Build and construct the new structure',
  intelligence:  'Scout and gather intel on movements',
  defense:       'Defend and guard the perimeter',
  coding:        'Code and debug the implementation',
  research:      'Analyze and research the findings',
  communication: 'Send and broadcast the message',
  planning:      'Plan and coordinate the strategy',
  general:       'Handle the general assignment',
}

// ---------------------------------------------------------------------------
// Construction & accessors
// ---------------------------------------------------------------------------

describe('MockLLMService — construction and accessors', () => {
  it('stores agentName', () => {
    const svc = new MockLLMService(ALICE)
    expect(svc.agentName).toBe('Alice')
  })

  it('stores agentRole', () => {
    const svc = new MockLLMService(ALICE)
    expect(svc.agentRole).toBe('Explorer')
  })

  it('stores goal when provided', () => {
    const svc = new MockLLMService(ALICE)
    expect(svc.goal).toBe(ALICE.goal)
  })

  it('goal is undefined when not provided', () => {
    const svc = new MockLLMService(MINIMAL)
    expect(svc.goal).toBeUndefined()
  })

  it('stores persona when provided', () => {
    const svc = new MockLLMService(ALICE)
    expect(svc.persona).toBe(ALICE.persona)
  })

  it('persona is undefined when not provided', () => {
    const svc = new MockLLMService(MINIMAL)
    expect(svc.persona).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// isRealistic flag
// ---------------------------------------------------------------------------

describe('MockLLMService — isRealistic', () => {
  it('is false when neither goal nor persona are provided', () => {
    const svc = new MockLLMService(MINIMAL)
    expect(svc.isRealistic).toBe(false)
  })

  it('is true when goal is provided', () => {
    const svc = new MockLLMService({ agentName: 'X', agentRole: 'Y', goal: 'Some goal' })
    expect(svc.isRealistic).toBe(true)
  })

  it('is true when persona is provided', () => {
    const svc = new MockLLMService({ agentName: 'X', agentRole: 'Y', persona: 'Some persona' })
    expect(svc.isRealistic).toBe(true)
  })

  it('is true when both goal and persona are provided', () => {
    const svc = new MockLLMService(ALICE)
    expect(svc.isRealistic).toBe(true)
  })

  it('can be forced true via useRealisticGeneration even without goal/persona', () => {
    const svc = new MockLLMService({ agentName: 'X', agentRole: 'Y', useRealisticGeneration: true })
    expect(svc.isRealistic).toBe(true)
  })

  it('can be forced false via useRealisticGeneration even with goal/persona', () => {
    const svc = new MockLLMService({ ...ALICE, useRealisticGeneration: false })
    expect(svc.isRealistic).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Persona style detection
// ---------------------------------------------------------------------------

describe('MockLLMService — personaStyle detection', () => {
  it('Alice (curious and bold) → bold', () => {
    expect(new MockLLMService(ALICE).personaStyle).toBe('bold')
  })

  it('Bob (methodical and reliable) → methodical', () => {
    expect(new MockLLMService(BOB).personaStyle).toBe('methodical')
  })

  it('Carol (fast and observant) → swift', () => {
    expect(new MockLLMService(CAROL).personaStyle).toBe('swift')
  })

  it('Dave (steadfast and vigilant) → steadfast', () => {
    expect(new MockLLMService(DAVE).personaStyle).toBe('steadfast')
  })

  it('no persona → neutral', () => {
    expect(new MockLLMService(MINIMAL).personaStyle).toBe('neutral')
  })
})

// ---------------------------------------------------------------------------
// detectTopicFor
// ---------------------------------------------------------------------------

describe('MockLLMService — detectTopicFor()', () => {
  const svc = new MockLLMService(ALICE)

  it('detects exploration from mapping task', () => {
    expect(svc.detectTopicFor('Map the north sector')).toBe('exploration')
  })

  it('detects construction from build task', () => {
    expect(svc.detectTopicFor('Build a watchtower')).toBe('construction')
  })

  it('detects intelligence from scout task', () => {
    expect(svc.detectTopicFor('Scout and gather intel on movements')).toBe('intelligence')
  })

  it('detects defense from defend task', () => {
    expect(svc.detectTopicFor('Defend and guard the perimeter')).toBe('defense')
  })

  it('detects coding from debug task', () => {
    expect(svc.detectTopicFor('Debug the code and fix the error')).toBe('coding')
  })

  it('detects research from analyze task', () => {
    expect(svc.detectTopicFor('Analyze the performance data')).toBe('research')
  })

  it('detects communication from broadcast task', () => {
    expect(svc.detectTopicFor('Send and broadcast the alert')).toBe('communication')
  })

  it('detects planning from plan task', () => {
    expect(svc.detectTopicFor('Plan and coordinate the operation')).toBe('planning')
  })

  it('returns general for unknown task', () => {
    expect(svc.detectTopicFor('Do the thing')).toBe('general')
  })

  it('is consistent across service instances', () => {
    const svc2 = new MockLLMService(BOB)
    expect(svc.detectTopicFor('Map the sector')).toBe(svc2.detectTopicFor('Map the sector'))
  })
})

// ---------------------------------------------------------------------------
// generateResult — basic contract
// ---------------------------------------------------------------------------

describe('MockLLMService — generateResult() basic contract', () => {
  it('returns a non-empty string (realistic mode)', () => {
    const svc = new MockLLMService(ALICE)
    expect(svc.generateResult('Map the north sector').length).toBeGreaterThan(0)
  })

  it('returns a non-empty string (generic mode)', () => {
    const svc = new MockLLMService(MINIMAL)
    expect(svc.generateResult('Do something').length).toBeGreaterThan(0)
  })

  it('result contains the agent name (realistic mode)', () => {
    const svc = new MockLLMService(ALICE)
    expect(svc.generateResult('Map the north sector')).toContain('Alice')
  })

  it('result contains the agent name (generic mode)', () => {
    const svc = new MockLLMService(MINIMAL)
    expect(svc.generateResult('Do something')).toContain('Eve')
  })

  it('different tasks produce different results', () => {
    const svc = new MockLLMService(ALICE)
    const r1 = svc.generateResult('Map the north sector', 0)
    const r2 = svc.generateResult('Build a watchtower', 0)
    // Different topics → different template pools → different results
    expect(r1).not.toBe(r2)
  })

  it('is deterministic with pickIndex', () => {
    const svc = new MockLLMService(ALICE)
    const r1 = svc.generateResult('Map the north sector', 0)
    const r2 = svc.generateResult('Map the north sector', 0)
    expect(r1).toBe(r2)
  })

  it('different pickIndex values produce different (or same) results within bucket', () => {
    // Alice is bold → exploration bucket is [0] (one template), so pickIndex 0 and 1 should both resolve to index 0
    const svc = new MockLLMService(ALICE)
    const r1 = svc.generateResult('Map the north sector', 0)
    const r2 = svc.generateResult('Map the north sector', 1)
    // Both resolve to template 0 because the bold bucket for exploration has only [0]
    expect(r1).toBe(r2)
  })

  it('different agents produce different results for same task and pickIndex', () => {
    const aliceSvc = new MockLLMService(ALICE)
    const bobSvc = new MockLLMService(BOB)
    const r1 = aliceSvc.generateResult('Map the north sector', 0)
    const r2 = bobSvc.generateResult('Map the north sector', 0)
    // Alice is bold (template 0), Bob is methodical (template 1 or 3) → different templates
    // Even if same template, different names produce different text
    expect(r1).not.toBe(r2)
  })
})

// ---------------------------------------------------------------------------
// generateResult — goal injection
// ---------------------------------------------------------------------------

describe('MockLLMService — generateResult() goal injection', () => {
  it('result contains the full goal when goal is provided', () => {
    const svc = new MockLLMService(ALICE)
    const result = svc.generateResult('Map the north sector', 0)
    expect(result).toContain(ALICE.goal!)
  })

  it('result does not contain goal text when no goal provided', () => {
    const svc = new MockLLMService(MINIMAL)
    const result = svc.generateResult('Do something', 0)
    // The goal is undefined so no injection should occur
    expect(result).not.toContain('primary mission')
  })

  it('result with goal is longer than result without goal (same task, same pickIndex)', () => {
    const withGoal = new MockLLMService(ALICE)
    const withoutGoal = new MockLLMService({ agentName: 'Alice', agentRole: 'Explorer', persona: ALICE.persona })
    const r1 = withGoal.generateResult('Map the north sector', 0)
    const r2 = withoutGoal.generateResult('Map the north sector', 0)
    expect(r1.length).toBeGreaterThan(r2.length)
  })
})

// ---------------------------------------------------------------------------
// generateQuestion — basic contract
// ---------------------------------------------------------------------------

describe('MockLLMService — generateQuestion() basic contract', () => {
  it('returns a non-empty string (realistic mode)', () => {
    const svc = new MockLLMService(ALICE)
    expect(svc.generateQuestion('Map the north sector').length).toBeGreaterThan(0)
  })

  it('returns a non-empty string (generic mode)', () => {
    const svc = new MockLLMService(MINIMAL)
    expect(svc.generateQuestion('Do something').length).toBeGreaterThan(0)
  })

  it('question contains the agent name (realistic mode)', () => {
    const svc = new MockLLMService(ALICE)
    expect(svc.generateQuestion('Map the north sector')).toContain('Alice')
  })

  it('question contains the agent name (generic mode)', () => {
    const svc = new MockLLMService(MINIMAL)
    expect(svc.generateQuestion('Do something')).toContain('Eve')
  })

  it('is deterministic with pickIndex', () => {
    const svc = new MockLLMService(BOB)
    const q1 = svc.generateQuestion('Build a watchtower', 0)
    const q2 = svc.generateQuestion('Build a watchtower', 0)
    expect(q1).toBe(q2)
  })

  it('different tasks produce different questions', () => {
    const svc = new MockLLMService(ALICE)
    const q1 = svc.generateQuestion('Map the north sector', 0)
    const q2 = svc.generateQuestion('Build a watchtower', 0)
    expect(q1).not.toBe(q2)
  })

  it('different agents produce different questions for same task and pickIndex', () => {
    const aliceSvc = new MockLLMService(ALICE)
    const daveSvc = new MockLLMService(DAVE)
    const q1 = aliceSvc.generateQuestion('Defend the perimeter', 0)
    const q2 = daveSvc.generateQuestion('Defend the perimeter', 0)
    // Different names → different text even if same template
    expect(q1).not.toBe(q2)
  })
})

// ---------------------------------------------------------------------------
// Persona style drives template bucket selection
// ---------------------------------------------------------------------------

describe('MockLLMService — persona style drives template selection', () => {
  // For exploration topic, the style buckets are:
  //   bold:       [0]      → template 0: "Mapping operation complete..."
  //   methodical: [1, 3]   → template 1: "filed the following field report..."
  //   swift:      [4]      → template 4: "fully executed... high-resolution..."
  //   steadfast:  [2]      → template 2: "documented 14 waypoints..."
  //   neutral:    [0,1,2,3,4]

  const EXPLORATION_TASK = 'Map and survey the unexplored territory'

  it('bold Alice picks different exploration result than methodical Bob', () => {
    const alice = new MockLLMService(ALICE)
    const bob = new MockLLMService(BOB)
    // Both use pickIndex=0; bold→template 0, methodical→template 1
    const r1 = alice.generateResult(EXPLORATION_TASK, 0)
    const r2 = bob.generateResult(EXPLORATION_TASK, 0)
    expect(r1).not.toBe(r2)
  })

  it('swift Carol picks different exploration result than steadfast Dave', () => {
    const carol = new MockLLMService(CAROL)
    const dave = new MockLLMService(DAVE)
    const r1 = carol.generateResult(EXPLORATION_TASK, 0)
    const r2 = dave.generateResult(EXPLORATION_TASK, 0)
    expect(r1).not.toBe(r2)
  })

  it('each real agent produces unique exploration result for pickIndex 0', () => {
    const results = [ALICE, BOB, CAROL, DAVE].map(cfg =>
      new MockLLMService(cfg).generateResult(EXPLORATION_TASK, 0),
    )
    const unique = new Set(results)
    // Bold→0, methodical→1, swift→4, steadfast→2 — all different templates + different names
    expect(unique.size).toBe(4)
  })

  it('neutral agent gets results from the full template pool', () => {
    // neutral bucket = [0,1,2,3,4], so pickIndex 0→template 0, 1→template 1, etc.
    const svc = new MockLLMService({ agentName: 'Neutral', agentRole: 'Agent' })
    const r0 = svc.generateResult(EXPLORATION_TASK, 0)
    const r1 = svc.generateResult(EXPLORATION_TASK, 1)
    // Different pickIndex values → different templates from the full pool
    expect(r0).not.toBe(r1)
  })
})

// ---------------------------------------------------------------------------
// All agents — all topics produce valid results and questions
// ---------------------------------------------------------------------------

describe('MockLLMService — all agents × all topics produce valid output', () => {
  const agents = [ALICE, BOB, CAROL, DAVE]

  for (const agentConfig of agents) {
    for (const topic of ALL_TOPIC_CATEGORIES) {
      it(`${agentConfig.agentName} (${agentConfig.agentRole}) on ${topic} task → non-empty result`, () => {
        const svc = new MockLLMService(agentConfig)
        const result = svc.generateResult(TOPIC_TASKS[topic], 0)
        expect(result.length).toBeGreaterThan(0)
        expect(result).toContain(agentConfig.agentName)
      })

      it(`${agentConfig.agentName} (${agentConfig.agentRole}) on ${topic} task → non-empty question`, () => {
        const svc = new MockLLMService(agentConfig)
        const question = svc.generateQuestion(TOPIC_TASKS[topic], 0)
        expect(question.length).toBeGreaterThan(0)
        expect(question).toContain(agentConfig.agentName)
      })
    }
  }
})

// ---------------------------------------------------------------------------
// createMockLLMService factory function
// ---------------------------------------------------------------------------

describe('createMockLLMService — factory function', () => {
  it('returns a MockLLMService instance', () => {
    const svc = createMockLLMService(ALICE)
    expect(svc).toBeInstanceOf(MockLLMService)
  })

  it('factory result behaves identically to constructor result', () => {
    const fromFactory = createMockLLMService(ALICE)
    const fromCtor = new MockLLMService(ALICE)
    const task = 'Map the north sector'
    expect(fromFactory.generateResult(task, 0)).toBe(fromCtor.generateResult(task, 0))
    expect(fromFactory.personaStyle).toBe(fromCtor.personaStyle)
  })

  it('stores all config fields correctly', () => {
    const svc = createMockLLMService(BOB)
    expect(svc.agentName).toBe('Bob')
    expect(svc.agentRole).toBe('Builder')
    expect(svc.goal).toBe(BOB.goal)
    expect(svc.persona).toBe(BOB.persona)
  })
})

// ---------------------------------------------------------------------------
// RESULT_STYLE_BUCKETS — structure validation
// ---------------------------------------------------------------------------

describe('RESULT_STYLE_BUCKETS — structure', () => {
  it('has entries for every topic category', () => {
    for (const topic of ALL_TOPIC_CATEGORIES) {
      expect(RESULT_STYLE_BUCKETS[topic]).toBeDefined()
    }
  })

  it('every topic has entries for all persona styles', () => {
    for (const topic of ALL_TOPIC_CATEGORIES) {
      for (const style of ALL_PERSONA_STYLES) {
        expect(RESULT_STYLE_BUCKETS[topic][style]).toBeDefined()
        expect(RESULT_STYLE_BUCKETS[topic][style].length).toBeGreaterThan(0)
      }
    }
  })

  it('neutral bucket always contains all valid template indices', () => {
    const EXPECTED_COUNTS: Record<TopicCategory, number> = {
      exploration:   5,
      construction:  5,
      intelligence:  5,
      defense:       5,
      coding:        5,
      research:      5,
      communication: 5,
      planning:      5,
      general:       5,
    }
    for (const topic of ALL_TOPIC_CATEGORIES) {
      const neutralBucket = RESULT_STYLE_BUCKETS[topic].neutral
      expect(neutralBucket.length).toBe(EXPECTED_COUNTS[topic])
      // All indices present
      for (let i = 0; i < EXPECTED_COUNTS[topic]; i++) {
        expect(neutralBucket).toContain(i)
      }
    }
  })

  it('all bucket indices are within the valid template range', () => {
    const MAX_INDEX: Partial<Record<TopicCategory, number>> = {}
    for (const topic of ALL_TOPIC_CATEGORIES) {
      const neutralLen = RESULT_STYLE_BUCKETS[topic].neutral.length
      for (const style of ALL_PERSONA_STYLES) {
        for (const idx of RESULT_STYLE_BUCKETS[topic][style]) {
          expect(idx).toBeGreaterThanOrEqual(0)
          expect(idx).toBeLessThan(neutralLen)
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// QUESTION_STYLE_BUCKETS — structure validation
// ---------------------------------------------------------------------------

describe('QUESTION_STYLE_BUCKETS — structure', () => {
  it('has entries for every topic category', () => {
    for (const topic of ALL_TOPIC_CATEGORIES) {
      expect(QUESTION_STYLE_BUCKETS[topic]).toBeDefined()
    }
  })

  it('every topic has entries for all persona styles', () => {
    for (const topic of ALL_TOPIC_CATEGORIES) {
      for (const style of ALL_PERSONA_STYLES) {
        expect(QUESTION_STYLE_BUCKETS[topic][style]).toBeDefined()
        expect(QUESTION_STYLE_BUCKETS[topic][style].length).toBeGreaterThan(0)
      }
    }
  })

  it('all bucket indices are within the valid question template range', () => {
    // Non-general topics have 3 question templates; general has 5
    const QUESTION_COUNTS: Record<TopicCategory, number> = {
      exploration:   3,
      construction:  3,
      intelligence:  3,
      defense:       3,
      coding:        3,
      research:      3,
      communication: 3,
      planning:      3,
      general:       5,
    }
    for (const topic of ALL_TOPIC_CATEGORIES) {
      for (const style of ALL_PERSONA_STYLES) {
        for (const idx of QUESTION_STYLE_BUCKETS[topic][style]) {
          expect(idx).toBeGreaterThanOrEqual(0)
          expect(idx).toBeLessThan(QUESTION_COUNTS[topic])
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// ALL_PERSONA_STYLES export
// ---------------------------------------------------------------------------

describe('ALL_PERSONA_STYLES', () => {
  it('contains all five styles', () => {
    expect(ALL_PERSONA_STYLES).toHaveLength(5)
    expect(ALL_PERSONA_STYLES).toContain('bold')
    expect(ALL_PERSONA_STYLES).toContain('methodical')
    expect(ALL_PERSONA_STYLES).toContain('swift')
    expect(ALL_PERSONA_STYLES).toContain('steadfast')
    expect(ALL_PERSONA_STYLES).toContain('neutral')
  })
})

// ---------------------------------------------------------------------------
// Style-bucket integration: different styles produce different template selections
// ---------------------------------------------------------------------------

describe('Style-bucket integration — different styles select different templates', () => {
  // Test that persona style actually changes the selected template.
  // For exploration results, bold→[0], methodical→[1,3], swift→[4], steadfast→[2].
  // pickIndex=0 with bold: bucket[0] = 0 → template 0 ("Mapping operation complete")
  // pickIndex=0 with methodical: bucket[0] = 1 → template 1 ("filed the following field report")
  // pickIndex=0 with swift: bucket[0] = 4 → template 4 ("fully executed... high-resolution")
  // pickIndex=0 with steadfast: bucket[0] = 2 → template 2 ("documented 14 waypoints")

  const EXPLORATION_TASK = 'Map and explore the unknown territory'

  it('bold exploration result starts with "Mapping operation" (template 0)', () => {
    const svc = new MockLLMService(ALICE) // bold
    const result = svc.generateResult(EXPLORATION_TASK, 0)
    expect(result).toContain('Mapping operation complete')
  })

  it('methodical exploration result contains "field report" (template 1)', () => {
    const svc = new MockLLMService(BOB) // methodical
    const result = svc.generateResult(EXPLORATION_TASK, 0)
    expect(result).toContain('field report')
  })

  it('swift exploration result contains "fully executed" (template 4)', () => {
    const svc = new MockLLMService(CAROL) // swift
    const result = svc.generateResult(EXPLORATION_TASK, 0)
    expect(result).toContain('fully executed')
  })

  it('steadfast exploration result contains "concluded" (template 2)', () => {
    const svc = new MockLLMService(DAVE) // steadfast
    const result = svc.generateResult(EXPLORATION_TASK, 0)
    expect(result).toContain('concluded')
  })
})

// ---------------------------------------------------------------------------
// Generic mode (no goal/persona) — falls back to results.ts templates
// ---------------------------------------------------------------------------

describe('MockLLMService — generic mode (no goal or persona)', () => {
  it('generates a result without topic awareness', () => {
    const svc = new MockLLMService({ agentName: 'Sam', agentRole: 'Worker' })
    const result = svc.generateResult('Do something complex', 0)
    expect(result).toContain('Sam')
    expect(result.length).toBeGreaterThan(0)
  })

  it('generates a question without topic awareness', () => {
    const svc = new MockLLMService({ agentName: 'Sam', agentRole: 'Worker' })
    const question = svc.generateQuestion('Do something complex', 0)
    expect(question).toContain('Sam')
    expect(question.length).toBeGreaterThan(0)
  })

  it('explicit useRealisticGeneration:false overrides goal/persona', () => {
    const svc = new MockLLMService({ ...ALICE, useRealisticGeneration: false })
    expect(svc.isRealistic).toBe(false)
    // Should still produce valid output
    const result = svc.generateResult('Map the sector', 0)
    expect(result).toContain('Alice')
  })
})
