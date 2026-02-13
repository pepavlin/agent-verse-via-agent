# Creating Custom Agents in AgentVerse

A comprehensive guide to creating new agent types and extending the AgentVerse system.

## Table of Contents

- [Agent Architecture Overview](#agent-architecture-overview)
- [Creating a Basic Agent](#creating-a-basic-agent)
- [Agent System Prompts](#agent-system-prompts)
- [Input Enhancement](#input-enhancement)
- [Agent Configuration](#agent-configuration)
- [Testing Your Agent](#testing-your-agent)
- [Integrating into Departments](#integrating-into-departments)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Agent Architecture Overview

AgentVerse uses an object-oriented agent architecture with inheritance:

```
       ┌──────────────┐
       │  BaseAgent   │  (Abstract class)
       │  (Abstract)  │
       └──────┬───────┘
              │
              │ extends
              │
       ┌──────┴──────────────────────────┐
       │                                  │
┌──────┴────────┐              ┌─────────┴────────┐
│ ResearcherAgent│              │ StrategistAgent  │
│               │              │                  │
└───────────────┘              └──────────────────┘
       │                                  │
       │                                  │
┌──────┴────────┐              ┌─────────┴────────┐
│  CriticAgent  │              │   IdeatorAgent   │
└───────────────┘              └──────────────────┘
       │
       │
┌──────┴──────────┐
│  YourCustomAgent│  (Your implementation)
└─────────────────┘
```

### BaseAgent Responsibilities

- **Claude API Integration**: Manages communication with Anthropic's API
- **Message History**: Maintains conversation context
- **Execution Management**: Handles agent execution lifecycle
- **Status Tracking**: Reports agent operational status
- **Inter-agent Communication**: Facilitates agent messaging

### Your Agent Responsibilities

- **System Prompt**: Define role, personality, and capabilities
- **Input Enhancement**: Add role-specific context to inputs
- **Custom Processing**: Optional specialized task processing

---

## Creating a Basic Agent

### Step 1: Create Agent File

Create a new file in `/app/agents/`:

```typescript
// app/agents/YourCustomAgent.ts
import { BaseAgent } from './BaseAgent';
import { AgentExecutionResult } from '@/types';

export class YourCustomAgent extends BaseAgent {
  constructor(config: {
    id: string;
    name: string;
    model?: string;
  }) {
    super(config);
  }

  /**
   * Define the agent's system prompt
   * This shapes the agent's personality and capabilities
   */
  protected getSystemPrompt(): string {
    return `You are a [role description] agent.

Role: [Your Role Name]
Personality: [Personality traits]
Specialization: [Area of expertise]

Your responsibilities:
- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]

When responding:
- [Guideline 1]
- [Guideline 2]
- [Guideline 3]`;
  }

  /**
   * Enhance input with role-specific context
   * This helps focus the agent on its specialty
   */
  protected enhanceInput(input: string, context?: any): string {
    return `[Role-specific Task Framing]: ${input}

Focus Areas:
- [Focus area 1]
- [Focus area 2]
- [Focus area 3]

${context ? `Additional Context: ${JSON.stringify(context, null, 2)}` : ''}`;
  }

  /**
   * Optional: Override for custom processing logic
   */
  protected async processTask(
    input: string,
    context?: any
  ): Promise<AgentExecutionResult> {
    // Default implementation calls Claude API
    // Override only if you need custom logic
    return super.processTask(input, context);
  }
}
```

### Step 2: Define Agent Role

Add your agent role to the type system:

```typescript
// types/index.ts

export type AgentRole =
  | 'researcher'
  | 'strategist'
  | 'critic'
  | 'ideator'
  | 'coordinator'
  | 'executor'
  | 'your-custom-role';  // Add your role here
```

### Step 3: Add Visualization Color

```typescript
// types/visualization.ts

export const ROLE_COLORS: Record<AgentRole, number> = {
  researcher: 0x3b82f6,   // Blue
  strategist: 0xa855f7,   // Purple
  critic: 0xef4444,       // Red
  ideator: 0xf59e0b,      // Amber
  coordinator: 0x10b981,  // Green
  executor: 0x06b6d4,     // Cyan
  'your-custom-role': 0x8b5cf6  // Violet (example)
};

export const ROLE_COLORS_HEX: Record<AgentRole, string> = {
  researcher: '#3b82f6',
  strategist: '#a855f7',
  critic: '#ef4444',
  ideator: '#f59e0b',
  coordinator: '#10b981',
  executor: '#06b6d4',
  'your-custom-role': '#8b5cf6'
};
```

### Step 4: Update Validation Schema

```typescript
// lib/validation.ts

export const agentRoleEnum = z.enum([
  'researcher',
  'strategist',
  'critic',
  'ideator',
  'coordinator',
  'executor',
  'your-custom-role'  // Add your role here
]);
```

---

## Agent System Prompts

The system prompt is the most important part of your agent. It defines:

1. **Role**: What the agent does
2. **Personality**: How the agent behaves
3. **Capabilities**: What the agent can do
4. **Guidelines**: How the agent should respond

### System Prompt Template

```typescript
protected getSystemPrompt(): string {
  return `You are a highly specialized [ROLE] agent in the AgentVerse system.

## Core Identity

**Role**: [Primary role description]
**Personality**: [2-3 key personality traits]
**Specialization**: [Specific area of expertise]

## Capabilities

You excel at:
1. [Primary capability with brief explanation]
2. [Secondary capability with brief explanation]
3. [Tertiary capability with brief explanation]

## Responsibilities

Your main duties include:
- [Specific responsibility 1]
- [Specific responsibility 2]
- [Specific responsibility 3]
- [Specific responsibility 4]

## Response Guidelines

When generating responses:

### Structure
- Start with a brief summary or key insight
- Use clear headings and sections
- Present information in logical order
- Conclude with actionable recommendations

### Style
- Be [adjective] and [adjective]
- Use [language style]
- Provide [type of evidence/support]
- Maintain [tone characteristic]

### Quality Standards
- [Quality standard 1]
- [Quality standard 2]
- [Quality standard 3]

## Collaboration

When working with other agents:
- [How to receive input from other agents]
- [How to format output for other agents]
- [What to emphasize in multi-agent workflows]

## Limitations

Be transparent about:
- [Limitation 1]
- [Limitation 2]
- [What you can't or shouldn't do]

Remember: Your unique value comes from [key differentiator].`;
}
```

### Example: Data Analyst Agent

```typescript
protected getSystemPrompt(): string {
  return `You are a meticulous Data Analyst agent in the AgentVerse system.

## Core Identity

**Role**: Data Analysis and Statistical Interpretation
**Personality**: Analytical, precise, evidence-driven
**Specialization**: Quantitative analysis and data-driven insights

## Capabilities

You excel at:
1. **Statistical Analysis**: Interpreting datasets, identifying patterns, calculating metrics
2. **Data Visualization**: Recommending effective charts and graphs for data presentation
3. **Trend Identification**: Spotting correlations, anomalies, and meaningful trends
4. **Predictive Insights**: Making data-driven forecasts and projections

## Responsibilities

Your main duties include:
- Analyzing quantitative data from various sources
- Identifying statistical patterns and correlations
- Calculating relevant metrics and KPIs
- Creating recommendations based on data evidence
- Validating assumptions with statistical rigor
- Highlighting data quality issues or limitations

## Response Guidelines

When generating responses:

### Structure
- Begin with key findings summary
- Present data analysis with clear methodology
- Use tables and structured formats
- End with data-driven recommendations

### Style
- Be precise and objective
- Use statistical terminology correctly
- Support claims with numbers and evidence
- Acknowledge uncertainty and confidence levels

### Quality Standards
- Always cite data sources
- Show your analytical methodology
- Provide context for statistics
- Note any data limitations or biases

## Collaboration

When working with other agents:
- Provide quantitative backing for research findings
- Challenge assumptions with data evidence
- Validate strategic recommendations with metrics
- Offer numerical context for creative ideas

## Limitations

Be transparent about:
- Data quality issues in your analysis
- Statistical significance and confidence levels
- Assumptions made in your calculations
- Areas where more data would be beneficial

Remember: Your unique value comes from turning raw data into actionable insights through rigorous analysis.`;
}
```

---

## Input Enhancement

Input enhancement adds role-specific context to make the agent more focused:

### Basic Enhancement

```typescript
protected enhanceInput(input: string, context?: any): string {
  return `Task for [Your Role]: ${input}

Your focus should be on:
- [Focus area 1]
- [Focus area 2]
- [Focus area 3]

${context ? `Additional Context:\n${JSON.stringify(context, null, 2)}` : ''}`;
}
```

### Advanced Enhancement with Workflow Context

```typescript
protected enhanceInput(input: string, context?: any): string {
  let enhanced = `[YOUR ROLE] TASK\n\n`;
  enhanced += `Primary Objective: ${input}\n\n`;

  // Add role-specific instructions
  enhanced += `Focus Areas:\n`;
  enhanced += `- [Focus 1]: [Why it matters]\n`;
  enhanced += `- [Focus 2]: [Why it matters]\n`;
  enhanced += `- [Focus 3]: [Why it matters]\n\n`;

  // Include context if provided
  if (context) {
    if (context.previousResults) {
      enhanced += `Previous Agent Insights:\n`;
      enhanced += `${context.previousResults}\n\n`;
    }

    if (context.requirements) {
      enhanced += `Specific Requirements:\n`;
      enhanced += `${JSON.stringify(context.requirements, null, 2)}\n\n`;
    }

    if (context.constraints) {
      enhanced += `Constraints:\n`;
      enhanced += `${JSON.stringify(context.constraints, null, 2)}\n\n`;
    }
  }

  // Add output format guidelines
  enhanced += `Expected Output Format:\n`;
  enhanced += `- [Format requirement 1]\n`;
  enhanced += `- [Format requirement 2]\n`;
  enhanced += `- [Format requirement 3]\n`;

  return enhanced;
}
```

### Example: Data Analyst Input Enhancement

```typescript
protected enhanceInput(input: string, context?: any): string {
  let enhanced = `DATA ANALYSIS TASK\n\n`;
  enhanced += `Analysis Request: ${input}\n\n`;

  enhanced += `Analytical Focus:\n`;
  enhanced += `- Statistical Patterns: Identify trends, correlations, anomalies\n`;
  enhanced += `- Quantitative Metrics: Calculate relevant KPIs and measurements\n`;
  enhanced += `- Data Quality: Note any issues, gaps, or limitations\n`;
  enhanced += `- Predictive Insights: Project future trends based on current data\n\n`;

  if (context) {
    if (context.dataset) {
      enhanced += `Dataset Information:\n`;
      enhanced += `${JSON.stringify(context.dataset, null, 2)}\n\n`;
    }

    if (context.metrics) {
      enhanced += `Requested Metrics:\n`;
      enhanced += `${context.metrics.join(', ')}\n\n`;
    }

    if (context.timeframe) {
      enhanced += `Time Period: ${context.timeframe}\n\n`;
    }
  }

  enhanced += `Output Requirements:\n`;
  enhanced += `- Start with key statistical findings\n`;
  enhanced += `- Use tables for data presentation\n`;
  enhanced += `- Include confidence levels and margins of error\n`;
  enhanced += `- Cite all data sources\n`;
  enhanced += `- Note any assumptions or limitations\n`;

  return enhanced;
}
```

---

## Agent Configuration

### Database Schema

Update the Prisma schema if needed:

```prisma
// prisma/schema.prisma

model Agent {
  id              String    @id @default(cuid())
  name            String
  role            String    // 'researcher', 'strategist', etc.

  // Add custom fields for your agent type
  customField1    String?
  customField2    Int?
  customSettings  Json?     // Flexible JSON for agent-specific config

  // ... other fields
}
```

### Configuration Options

```typescript
interface CustomAgentConfig {
  id: string;
  name: string;
  model?: string;

  // Agent-specific configuration
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
  outputFormat?: 'markdown' | 'json' | 'plain';
  specialization?: string;
}

export class CustomAgent extends BaseAgent {
  private config: CustomAgentConfig;

  constructor(config: CustomAgentConfig) {
    super(config);
    this.config = config;
  }

  protected getSystemPrompt(): string {
    // Use config to customize prompt
    const depth = this.config.analysisDepth || 'detailed';

    return `You are a ${this.config.specialization || 'specialized'} agent.

Analysis Depth: ${depth}
Output Format: ${this.config.outputFormat || 'markdown'}

[Rest of prompt based on configuration...]`;
  }
}
```

---

## Testing Your Agent

### Unit Test

```typescript
// tests/unit/YourCustomAgent.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { YourCustomAgent } from '@/app/agents/YourCustomAgent';

describe('YourCustomAgent', () => {
  let agent: YourCustomAgent;

  beforeEach(() => {
    agent = new YourCustomAgent({
      id: 'test-custom-1',
      name: 'Test Custom Agent',
      model: 'claude-3-5-sonnet-20241022'
    });
  });

  it('should have correct role', () => {
    const info = agent.getInfo();
    expect(info.role).toBe('your-custom-role');
  });

  it('should generate system prompt', () => {
    const prompt = (agent as any).getSystemPrompt();
    expect(prompt).toContain('your role description');
  });

  it('should enhance input', () => {
    const input = 'Test task';
    const enhanced = (agent as any).enhanceInput(input);
    expect(enhanced).toContain('Test task');
    expect(enhanced).toContain('Focus Areas');
  });

  it('should execute successfully', async () => {
    // Mock Anthropic API call here
    const result = await agent.execute('Test input', {});
    expect(result.success).toBe(true);
  });
});
```

### Integration Test

```typescript
// tests/integration/custom-agent-api.test.ts
import { describe, it, expect } from 'vitest';

describe('Custom Agent API Integration', () => {
  it('should create custom agent via API', async () => {
    const response = await fetch('http://localhost:3000/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'My Custom Agent',
        role: 'your-custom-role',
        specialization: 'Custom tasks'
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.agent.role).toBe('your-custom-role');
  });

  it('should execute custom agent', async () => {
    // Create agent first
    const createResponse = await fetch('http://localhost:3000/api/agents', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Agent',
        role: 'your-custom-role'
      })
    });
    const { agent } = await createResponse.json();

    // Execute agent
    const execResponse = await fetch(
      `http://localhost:3000/api/agents/${agent.id}/run`,
      {
        method: 'POST',
        body: JSON.stringify({
          input: 'Test task',
          context: { test: true }
        })
      }
    );

    expect(execResponse.status).toBe(200);
    const result = await execResponse.json();
    expect(result.result.success).toBe(true);
  });
});
```

---

## Integrating into Departments

### Creating a Custom Department

```typescript
// lib/CustomDepartment.ts
import { Department } from './Department';
import { ResearcherAgent } from '@/app/agents/ResearcherAgent';
import { YourCustomAgent } from '@/app/agents/YourCustomAgent';
import type { DepartmentExecutionResult } from '@/types';

export class CustomDepartment extends Department {
  constructor() {
    super();
    this.requiredRoles = ['researcher', 'your-custom-role'];
  }

  async execute(
    input: string,
    context?: any
  ): Promise<DepartmentExecutionResult> {
    const steps: any[] = [];
    const startTime = Date.now();

    try {
      // Step 1: Research
      const researcher = this.getAgent('researcher') as ResearcherAgent;
      if (!researcher) {
        throw new Error('Researcher agent not found');
      }

      const researchResult = await researcher.execute(input, context);
      steps.push({
        stepNumber: 1,
        agentRole: 'researcher',
        agentId: researcher.getInfo().id,
        description: 'Initial research',
        input: input,
        output: researchResult.result,
        status: 'completed',
        executionTime: researchResult.executionTime
      });

      // Step 2: Custom Processing
      const customAgent = this.getAgent('your-custom-role') as YourCustomAgent;
      if (!customAgent) {
        throw new Error('Custom agent not found');
      }

      const customResult = await customAgent.execute(
        researchResult.result,
        { ...context, previousStep: 'research' }
      );
      steps.push({
        stepNumber: 2,
        agentRole: 'your-custom-role',
        agentId: customAgent.getInfo().id,
        description: 'Custom processing',
        input: researchResult.result,
        output: customResult.result,
        status: 'completed',
        executionTime: customResult.executionTime
      });

      // Compile final result
      const finalResult = this.compileFinalResult(steps);
      const totalTime = Date.now() - startTime;

      return {
        success: true,
        steps,
        finalResult,
        metadata: {
          departmentId: 'custom-department',
          totalExecutionTime: totalTime,
          timestamp: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        steps,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          departmentId: 'custom-department',
          totalExecutionTime: Date.now() - startTime,
          timestamp: new Date()
        }
      };
    }
  }
}
```

### Department API Route

```typescript
// app/api/departments/custom/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CustomDepartment } from '@/lib/CustomDepartment';
import { YourCustomAgent } from '@/app/agents/YourCustomAgent';
import { ResearcherAgent } from '@/app/agents/ResearcherAgent';

export async function POST(request: NextRequest) {
  try {
    const { query, options } = await request.json();

    // Initialize department
    const department = new CustomDepartment();

    // Create and register agents
    const researcher = new ResearcherAgent({
      id: 'researcher-1',
      name: 'Researcher',
      model: 'claude-3-5-sonnet-20241022'
    });

    const customAgent = new YourCustomAgent({
      id: 'custom-1',
      name: 'Custom Processor',
      model: 'claude-3-5-sonnet-20241022'
    });

    department.registerAgent(researcher);
    department.registerAgent(customAgent);

    // Execute workflow
    const result = await department.execute(query, options);

    return NextResponse.json({ result });

  } catch (error) {
    return NextResponse.json(
      { error: 'Workflow execution failed' },
      { status: 500 }
    );
  }
}
```

---

## Best Practices

### 1. Clear Role Definition

```typescript
// ✅ Good: Specific, focused role
class SecurityAnalystAgent extends BaseAgent {
  // Specializes in security analysis
}

// ❌ Bad: Too broad, unclear role
class GeneralPurposeAgent extends BaseAgent {
  // Does everything - no clear specialty
}
```

### 2. Focused System Prompts

```typescript
// ✅ Good: Detailed, specific instructions
protected getSystemPrompt(): string {
  return `You are a Security Analyst specializing in:
  - Vulnerability assessment
  - Threat modeling
  - Security best practices

  Your responses should:
  - Prioritize security implications
  - Cite security standards (OWASP, NIST, etc.)
  - Provide actionable remediation steps`;
}

// ❌ Bad: Vague, generic instructions
protected getSystemPrompt(): string {
  return `You are a helpful assistant.`;
}
```

### 3. Meaningful Input Enhancement

```typescript
// ✅ Good: Adds relevant context
protected enhanceInput(input: string, context?: any): string {
  return `Security Analysis Task: ${input}

  Focus on:
  - Known vulnerabilities
  - Attack vectors
  - Mitigation strategies

  ${context?.previousFindings ?
    `Previous Findings:\n${context.previousFindings}` : ''}`;
}

// ❌ Bad: Doesn't add value
protected enhanceInput(input: string): string {
  return input;  // Just returns input unchanged
}
```

### 4. Appropriate Abstractions

```typescript
// ✅ Good: Single responsibility
class DataAnalystAgent extends BaseAgent {
  protected analyzeDataset(data: any) {
    // Data analysis specific logic
  }
}

// ❌ Bad: Too many responsibilities
class SuperAgent extends BaseAgent {
  protected analyzeData() {}
  protected writeCode() {}
  protected designUI() {}
  protected manageDatabase() {}
  // Too many unrelated responsibilities
}
```

### 5. Error Handling

```typescript
// ✅ Good: Graceful error handling
async execute(input: string, context?: any) {
  try {
    return await super.execute(input, context);
  } catch (error) {
    console.error(`${this.name} execution failed:`, error);
    return {
      agentId: this.id,
      success: false,
      error: 'Execution failed',
      executionTime: 0,
      timestamp: new Date()
    };
  }
}

// ❌ Bad: No error handling
async execute(input: string, context?: any) {
  return await super.execute(input, context);
  // Errors propagate without handling
}
```

---

## Examples

### Example 1: Code Reviewer Agent

```typescript
// app/agents/CodeReviewerAgent.ts
import { BaseAgent } from './BaseAgent';

export class CodeReviewerAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are an expert Code Reviewer agent.

Role: Code Quality Analysis
Personality: Detail-oriented, constructive, educational
Specialization: Code review and best practices

Your responsibilities:
- Review code for bugs, security issues, and performance problems
- Suggest improvements following best practices
- Explain the reasoning behind your recommendations
- Prioritize critical issues over style preferences

When reviewing code:
- Start with high-severity issues (security, bugs)
- Then address medium-severity issues (performance, maintainability)
- Finally mention low-severity issues (style, conventions)
- Provide specific examples of improvements
- Explain the "why" behind each suggestion
- Be constructive and encouraging

Code Quality Checklist:
✓ Security vulnerabilities
✓ Logic errors and edge cases
✓ Performance bottlenecks
✓ Code maintainability
✓ Test coverage
✓ Documentation quality
✓ Naming conventions
✓ Code duplication`;
  }

  protected enhanceInput(input: string, context?: any): string {
    return `CODE REVIEW REQUEST\n\n${input}\n\n
Review Focus:
- Security: SQL injection, XSS, authentication issues
- Bugs: Logic errors, null pointer exceptions, race conditions
- Performance: O(n²) algorithms, unnecessary computations, memory leaks
- Maintainability: Complex functions, unclear naming, missing comments
- Testing: Edge cases, error handling, test coverage

${context?.language ? `Programming Language: ${context.language}\n` : ''}
${context?.framework ? `Framework: ${context.framework}\n` : ''}
${context?.priority ? `Priority Areas: ${context.priority}\n` : ''}

Output Format:
1. Summary (critical issues found)
2. Security Issues (if any)
3. Bugs and Logic Errors
4. Performance Concerns
5. Maintainability Improvements
6. Minor Suggestions
7. Positive Feedback (what's done well)`;
  }
}
```

### Example 2: Content Writer Agent

```typescript
// app/agents/ContentWriterAgent.ts
import { BaseAgent } from './BaseAgent';

export class ContentWriterAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a professional Content Writer agent.

Role: Content Creation and Copywriting
Personality: Creative, engaging, audience-focused
Specialization: Written content for various formats

Your capabilities:
- Blog posts and articles
- Marketing copy
- Technical documentation
- Social media content
- Email campaigns
- Product descriptions

Writing Principles:
1. Know your audience
2. Clear and concise communication
3. Engaging storytelling
4. SEO best practices
5. Strong calls-to-action
6. Consistent brand voice

Your writing should:
- Hook readers in the first paragraph
- Use active voice
- Break up text with subheadings
- Include relevant examples
- End with a clear takeaway or CTA
- Be free of jargon (unless appropriate for audience)`;
  }

  protected enhanceInput(input: string, context?: any): string {
    return `CONTENT WRITING TASK\n\n${input}\n\n
Target Audience: ${context?.audience || 'General audience'}
Tone: ${context?.tone || 'Professional and friendly'}
Word Count: ${context?.wordCount || '500-800 words'}
Format: ${context?.format || 'Blog post'}

SEO Keywords: ${context?.keywords?.join(', ') || 'To be determined'}

Content Requirements:
- Engaging headline
- Clear introduction with hook
- Well-structured body with subheadings
- Relevant examples or case studies
- Strong conclusion with CTA
- SEO optimized

${context?.additionalNotes ? `Additional Notes:\n${context.additionalNotes}` : ''}`;
  }
}
```

---

## Summary Checklist

When creating a new agent, ensure you:

- [ ] Extend `BaseAgent` class
- [ ] Implement `getSystemPrompt()` with clear role definition
- [ ] Implement `enhanceInput()` with meaningful context
- [ ] Add role to type definitions
- [ ] Add color scheme for visualization
- [ ] Update validation schemas
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Document the agent's purpose and usage
- [ ] Consider department integration
- [ ] Follow naming conventions
- [ ] Handle errors gracefully

---

## Additional Resources

- [BaseAgent Source Code](../app/agents/BaseAgent.ts)
- [Existing Agent Examples](../app/agents/)
- [Department Architecture](../lib/Department.ts)
- [API Documentation](./API.md)
- [Architecture Guide](./ARCHITECTURE.md)

Happy agent building! 🤖
