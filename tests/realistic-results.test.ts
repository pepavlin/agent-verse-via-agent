import { describe, it, expect } from 'vitest'
import {
  detectTopic,
  detectPersonaStyle,
  generateRealisticResult,
  generateRealisticQuestion,
  REALISTIC_RESULT_TEMPLATE_COUNTS,
  REALISTIC_QUESTION_TEMPLATE_COUNTS,
  ALL_TOPIC_CATEGORIES,
} from '../app/run-engine/realistic-results'
import type { TopicCategory, PersonaStyle } from '../app/run-engine/realistic-results'

// ---------------------------------------------------------------------------
// detectTopic — keyword heuristics
// ---------------------------------------------------------------------------

describe('detectTopic', () => {
  it('returns "general" for empty string', () => {
    expect(detectTopic('')).toBe('general')
  })

  it('returns "general" when no keywords match', () => {
    expect(detectTopic('do a thing with the stuff')).toBe('general')
  })

  it('detects "exploration" from map keyword', () => {
    expect(detectTopic('Map the northern sector')).toBe('exploration')
  })

  it('detects "exploration" from explore keyword', () => {
    expect(detectTopic('Explore the unknown territory')).toBe('exploration')
  })

  it('detects "exploration" from survey keyword', () => {
    expect(detectTopic('Survey the new zone')).toBe('exploration')
  })

  it('detects "exploration" from chart/navigate keywords', () => {
    expect(detectTopic('Navigate and chart the terrain')).toBe('exploration')
  })

  it('detects "construction" from build keyword', () => {
    expect(detectTopic('Build a watchtower at grid B-5')).toBe('construction')
  })

  it('detects "construction" from construct keyword', () => {
    expect(detectTopic('Construct the new outpost')).toBe('construction')
  })

  it('detects "construction" from repair/maintain keywords', () => {
    expect(detectTopic('Repair and maintain the bridge')).toBe('construction')
  })

  it('detects "intelligence" from scout keyword', () => {
    expect(detectTopic('Scout the eastern border')).toBe('intelligence')
  })

  it('detects "intelligence" from intel keyword', () => {
    expect(detectTopic('Gather intel on enemy movements')).toBe('intelligence')
  })

  it('detects "intelligence" from recon keyword', () => {
    expect(detectTopic('Reconnaissance mission for the valley')).toBe('intelligence')
  })

  it('detects "defense" from defend keyword', () => {
    expect(detectTopic('Defend the supply depot')).toBe('defense')
  })

  it('detects "defense" from secure keyword', () => {
    expect(detectTopic('Secure the perimeter')).toBe('defense')
  })

  it('detects "defense" from patrol/guard keywords', () => {
    expect(detectTopic('Patrol and guard the checkpoint')).toBe('defense')
  })

  it('detects "coding" from code keyword', () => {
    expect(detectTopic('Write code for the new API endpoint')).toBe('coding')
  })

  it('detects "coding" from debug keyword', () => {
    expect(detectTopic('Debug the authentication module')).toBe('coding')
  })

  it('detects "coding" from implement keyword', () => {
    expect(detectTopic('Implement the search algorithm')).toBe('coding')
  })

  it('detects "research" from analyze keyword', () => {
    expect(detectTopic('Analyze the performance metrics')).toBe('research')
  })

  it('detects "research" from investigate keyword', () => {
    expect(detectTopic('Investigate the root cause of failures')).toBe('research')
  })

  it('detects "research" from review/assess keywords', () => {
    expect(detectTopic('Review and assess current findings')).toBe('research')
  })

  it('detects "communication" from send/message keywords', () => {
    expect(detectTopic('Send a message to all team members')).toBe('communication')
  })

  it('detects "communication" from notify keyword', () => {
    expect(detectTopic('Notify headquarters of the situation')).toBe('communication')
  })

  it('detects "communication" from broadcast keyword', () => {
    expect(detectTopic('Broadcast the alert to all channels')).toBe('communication')
  })

  it('detects "planning" from plan keyword', () => {
    expect(detectTopic('Plan the next phase of operations')).toBe('planning')
  })

  it('detects "planning" from coordinate/schedule keywords', () => {
    expect(detectTopic('Coordinate and schedule the resources')).toBe('planning')
  })

  it('detects "planning" from strategy keyword', () => {
    expect(detectTopic('Define the strategy for the mission')).toBe('planning')
  })

  it('is case-insensitive', () => {
    expect(detectTopic('MAP THE NORTH SECTOR')).toBe('exploration')
    expect(detectTopic('BUILD A WALL')).toBe('construction')
  })

  it('picks the topic with the most keyword hits when multiple match', () => {
    // "map explore survey" → 3 exploration keywords beats "build" → 1 construction
    const topic = detectTopic('map, explore, and survey; also build something')
    expect(topic).toBe('exploration')
  })
})

// ---------------------------------------------------------------------------
// detectPersonaStyle — persona trait keywords
// ---------------------------------------------------------------------------

describe('detectPersonaStyle', () => {
  it('returns "neutral" for undefined persona', () => {
    expect(detectPersonaStyle(undefined)).toBe('neutral')
  })

  it('returns "neutral" for empty string', () => {
    expect(detectPersonaStyle('')).toBe('neutral')
  })

  it('returns "neutral" for unrecognised persona', () => {
    expect(detectPersonaStyle('very mysterious and arcane')).toBe('neutral')
  })

  it('detects "bold" from bold keyword', () => {
    expect(detectPersonaStyle('Bold and fearless adventurer')).toBe('bold')
  })

  it('detects "bold" from curious/adventurous keywords', () => {
    expect(detectPersonaStyle('Curious and adventurous, always the first to venture')).toBe('bold')
  })

  it('detects "methodical" from methodical keyword', () => {
    expect(detectPersonaStyle('Methodical and reliable. Prefers a solid plan.')).toBe('methodical')
  })

  it('detects "methodical" from careful/systematic keywords', () => {
    expect(detectPersonaStyle('Careful and systematic in every approach')).toBe('methodical')
  })

  it('detects "swift" from fast/quick keywords', () => {
    expect(detectPersonaStyle('Fast and quick — never lingers')).toBe('swift')
  })

  it('detects "swift" from rapid/agile keywords', () => {
    expect(detectPersonaStyle('Agile and rapid, always on the move')).toBe('swift')
  })

  it('detects "steadfast" from steadfast keyword', () => {
    expect(detectPersonaStyle('Steadfast and vigilant. Takes duty seriously.')).toBe('steadfast')
  })

  it('detects "steadfast" from vigilant/responsible keywords', () => {
    expect(detectPersonaStyle('Responsible and vigilant, never abandons a post')).toBe('steadfast')
  })

  it('is case-insensitive', () => {
    expect(detectPersonaStyle('BOLD AND CURIOUS')).toBe('bold')
    expect(detectPersonaStyle('METHODICAL AND RELIABLE')).toBe('methodical')
  })

  it('picks the style with the most keyword hits', () => {
    // "methodical reliable careful systematic" → 4 methodical > "bold" 0
    const style = detectPersonaStyle('methodical, reliable, careful, and systematic')
    expect(style).toBe('methodical')
  })
})

// ---------------------------------------------------------------------------
// generateRealisticResult — all topics produce valid output
// ---------------------------------------------------------------------------

describe('generateRealisticResult — basic contract', () => {
  it('returns a non-empty string', () => {
    const result = generateRealisticResult('Alice', 'Explorer', 'Map the north sector')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes the agent name in the result', () => {
    const result = generateRealisticResult('Alice', 'Explorer', 'Map the north sector')
    expect(result).toContain('Alice')
  })

  it('accepts a pickIndex for deterministic selection', () => {
    const r1 = generateRealisticResult('Alice', 'Explorer', 'Map the north sector', undefined, undefined, 0)
    const r2 = generateRealisticResult('Alice', 'Explorer', 'Map the north sector', undefined, undefined, 0)
    expect(r1).toBe(r2)
  })

  it('different agents produce different results with the same pickIndex', () => {
    const r1 = generateRealisticResult('Alice', 'Explorer', 'Map the north sector', undefined, undefined, 0)
    const r2 = generateRealisticResult('Bob', 'Builder', 'Map the north sector', undefined, undefined, 0)
    expect(r1).not.toBe(r2)
  })

  it('wraps pickIndex correctly for negative values', () => {
    const r = generateRealisticResult('Alice', 'Explorer', 'Map the north sector', undefined, undefined, -1)
    expect(r.length).toBeGreaterThan(0)
  })

  it('includes the goal in output when provided', () => {
    const goal = 'Map all unexplored areas of the grid'
    const result = generateRealisticResult('Alice', 'Explorer', 'Map the north sector', goal)
    expect(result).toContain(goal)
  })

  it('does not include goal marker when goal is not provided', () => {
    const result = generateRealisticResult('Alice', 'Explorer', 'Map the north sector')
    // Should not contain the goal injection prefix
    expect(result).not.toContain('primary mission')
  })
})

describe('generateRealisticResult — topic detection in action', () => {
  it('generates exploration-flavoured result for mapping task', () => {
    const result = generateRealisticResult('Alice', 'Explorer', 'Map the northern sector', undefined, undefined, 0)
    // Exploration templates contain field-report vocabulary
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('Alice')
  })

  it('generates construction-flavoured result for build task', () => {
    const result = generateRealisticResult('Bob', 'Builder', 'Build a watchtower at grid B-5', undefined, undefined, 0)
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('Bob')
  })

  it('generates intelligence-flavoured result for scout task', () => {
    const result = generateRealisticResult('Carol', 'Scout', 'Scout the eastern border', undefined, undefined, 0)
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('Carol')
  })

  it('generates defense-flavoured result for defend task', () => {
    const result = generateRealisticResult('Dave', 'Defender', 'Defend the supply depot', undefined, undefined, 0)
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('Dave')
  })

  it('generates coding-flavoured result for code task', () => {
    const result = generateRealisticResult('Eve', 'Developer', 'Debug the authentication module', undefined, undefined, 0)
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('Eve')
  })

  it('generates research-flavoured result for analysis task', () => {
    const result = generateRealisticResult('Frank', 'Analyst', 'Analyze the performance metrics', undefined, undefined, 0)
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('Frank')
  })

  it('generates communication-flavoured result for messaging task', () => {
    const result = generateRealisticResult('Grace', 'Comms', 'Broadcast the alert to all channels', undefined, undefined, 0)
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('Grace')
  })

  it('generates planning-flavoured result for strategy task', () => {
    const result = generateRealisticResult('Henry', 'Strategist', 'Plan the next phase of operations', undefined, undefined, 0)
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('Henry')
  })

  it('generates general-flavoured result for generic task', () => {
    const result = generateRealisticResult('Ivy', 'Assistant', 'Do the thing', undefined, undefined, 0)
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('Ivy')
  })
})

describe('generateRealisticResult — all templates per topic are non-empty', () => {
  for (const topic of ALL_TOPIC_CATEGORIES) {
    it(`all ${topic} result templates produce non-empty strings`, () => {
      const count = REALISTIC_RESULT_TEMPLATE_COUNTS[topic]
      for (let i = 0; i < count; i++) {
        // Use a task that reliably maps to the target topic
        const taskMap: Record<TopicCategory, string> = {
          exploration: 'Map and survey the unknown territory',
          construction: 'Build and construct the new structure',
          intelligence: 'Scout and gather intel on movements',
          defense: 'Defend and guard the perimeter',
          coding: 'Code and debug the implementation',
          research: 'Analyze and research the findings',
          communication: 'Send and broadcast the message',
          planning: 'Plan and coordinate the strategy',
          general: 'Handle the general assignment',
        }
        const r = generateRealisticResult('Alice', 'Explorer', taskMap[topic], undefined, undefined, i)
        expect(r.length, `Template ${i} for topic "${topic}" produced empty string`).toBeGreaterThan(0)
      }
    })
  }
})

// ---------------------------------------------------------------------------
// generateRealisticQuestion — all topics produce valid output
// ---------------------------------------------------------------------------

describe('generateRealisticQuestion — basic contract', () => {
  it('returns a non-empty string', () => {
    const q = generateRealisticQuestion('Alice', 'Explorer', 'Map the north sector')
    expect(q.length).toBeGreaterThan(0)
  })

  it('includes the agent name in the question', () => {
    const q = generateRealisticQuestion('Alice', 'Explorer', 'Map the north sector')
    expect(q).toContain('Alice')
  })

  it('accepts a pickIndex for deterministic selection', () => {
    const q1 = generateRealisticQuestion('Alice', 'Explorer', 'Map the north sector', undefined, undefined, 0)
    const q2 = generateRealisticQuestion('Alice', 'Explorer', 'Map the north sector', undefined, undefined, 0)
    expect(q1).toBe(q2)
  })

  it('different agents produce different questions with the same pickIndex', () => {
    const q1 = generateRealisticQuestion('Alice', 'Explorer', 'Map the north sector', undefined, undefined, 0)
    const q2 = generateRealisticQuestion('Bob', 'Builder', 'Map the north sector', undefined, undefined, 0)
    expect(q1).not.toBe(q2)
  })

  it('wraps pickIndex correctly for negative values', () => {
    const q = generateRealisticQuestion('Alice', 'Explorer', 'Map the north sector', undefined, undefined, -1)
    expect(q.length).toBeGreaterThan(0)
  })
})

describe('generateRealisticQuestion — topic detection in action', () => {
  const cases: [string, string, string][] = [
    ['exploration', 'Alice', 'Map the territory'],
    ['construction', 'Bob', 'Build a structure'],
    ['intelligence', 'Carol', 'Scout the region'],
    ['defense', 'Dave', 'Defend the perimeter'],
    ['coding', 'Eve', 'Debug the code'],
    ['research', 'Frank', 'Analyze the data'],
    ['communication', 'Grace', 'Send a message'],
    ['planning', 'Henry', 'Plan the operation'],
    ['general', 'Ivy', 'Do the thing'],
  ]

  for (const [_topic, name, task] of cases) {
    it(`generates a question for "${task}" that includes the agent name`, () => {
      const q = generateRealisticQuestion(name, 'Role', task, undefined, undefined, 0)
      expect(q.length).toBeGreaterThan(0)
      expect(q).toContain(name)
    })
  }
})

describe('generateRealisticQuestion — all templates per topic are non-empty', () => {
  for (const topic of ALL_TOPIC_CATEGORIES) {
    it(`all ${topic} question templates produce non-empty strings`, () => {
      const count = REALISTIC_QUESTION_TEMPLATE_COUNTS[topic]
      const taskMap: Record<TopicCategory, string> = {
        exploration: 'Map and survey the unknown territory',
        construction: 'Build and construct the new structure',
        intelligence: 'Scout and gather intel on movements',
        defense: 'Defend and guard the perimeter',
        coding: 'Code and debug the implementation',
        research: 'Analyze and research the findings',
        communication: 'Send and broadcast the message',
        planning: 'Plan and coordinate the strategy',
        general: 'Handle the general assignment',
      }
      for (let i = 0; i < count; i++) {
        const q = generateRealisticQuestion('Alice', 'Explorer', taskMap[topic], undefined, undefined, i)
        expect(q.length, `Template ${i} for topic "${topic}" produced empty string`).toBeGreaterThan(0)
      }
    })
  }
})

// ---------------------------------------------------------------------------
// Goal injection
// ---------------------------------------------------------------------------

describe('generateRealisticResult — goal injection', () => {
  it('result contains the full goal string when provided', () => {
    const goal = 'Map all unexplored areas of the grid'
    const result = generateRealisticResult(
      'Alice', 'Explorer', 'Map the north sector', goal, undefined, 0,
    )
    expect(result).toContain(goal)
  })

  it('result does not contain "primary mission" when no goal provided', () => {
    const result = generateRealisticResult('Alice', 'Explorer', 'Map the north sector', undefined, undefined, 0)
    expect(result).not.toContain('primary mission')
  })

  it('result with goal is longer than result without goal (same template)', () => {
    const withGoal = generateRealisticResult(
      'Alice', 'Explorer', 'Map the north sector',
      'Map all unexplored areas', undefined, 0,
    )
    const withoutGoal = generateRealisticResult(
      'Alice', 'Explorer', 'Map the north sector', undefined, undefined, 0,
    )
    expect(withGoal.length).toBeGreaterThan(withoutGoal.length)
  })
})

// ---------------------------------------------------------------------------
// Template counts sanity
// ---------------------------------------------------------------------------

describe('REALISTIC_RESULT_TEMPLATE_COUNTS', () => {
  it('has entries for all topic categories', () => {
    for (const topic of ALL_TOPIC_CATEGORIES) {
      expect(REALISTIC_RESULT_TEMPLATE_COUNTS[topic]).toBeDefined()
      expect(REALISTIC_RESULT_TEMPLATE_COUNTS[topic]).toBeGreaterThan(0)
    }
  })

  it('each topic has at least 3 result templates', () => {
    for (const topic of ALL_TOPIC_CATEGORIES) {
      expect(REALISTIC_RESULT_TEMPLATE_COUNTS[topic]).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('REALISTIC_QUESTION_TEMPLATE_COUNTS', () => {
  it('has entries for all topic categories', () => {
    for (const topic of ALL_TOPIC_CATEGORIES) {
      expect(REALISTIC_QUESTION_TEMPLATE_COUNTS[topic]).toBeDefined()
      expect(REALISTIC_QUESTION_TEMPLATE_COUNTS[topic]).toBeGreaterThan(0)
    }
  })

  it('each topic has at least 3 question templates', () => {
    for (const topic of ALL_TOPIC_CATEGORIES) {
      expect(REALISTIC_QUESTION_TEMPLATE_COUNTS[topic]).toBeGreaterThanOrEqual(3)
    }
  })
})
