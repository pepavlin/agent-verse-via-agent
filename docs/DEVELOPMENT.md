# AgentVerse Developer Guide

Complete guide for developers working on the AgentVerse project.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Code Conventions](#code-conventions)
- [Testing](#testing)
- [Database Management](#database-management)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

---

## Development Setup

### Prerequisites

- **Node.js**: 18.x or higher ([Download](https://nodejs.org/))
- **npm**: 9.x or higher (comes with Node.js)
- **Git**: Latest version
- **Anthropic API Key**: [Get one here](https://console.anthropic.com/)
- **Code Editor**: VS Code recommended

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd agent-verse-via-agent

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# Edit .env and add:
# - ANTHROPIC_API_KEY
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)

# 4. Initialize database
npx prisma generate
npx prisma migrate dev

# 5. Seed database (optional)
npx prisma db seed

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Environment Variables

Create a `.env` file with these variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# Anthropic API
ANTHROPIC_API_KEY="sk-ant-..."

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Application
PORT=3000
NODE_ENV="development"
```

---

## Project Structure

```
agent-verse-via-agent/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── agents/              # Agent endpoints
│   │   │   ├── route.ts         # GET /api/agents, POST /api/agents
│   │   │   └── [agentId]/
│   │   │       ├── route.ts     # GET /api/agents/:id
│   │   │       ├── run/
│   │   │       │   └── route.ts # POST /api/agents/:id/run
│   │   │       ├── status/
│   │   │       │   └── route.ts # GET /api/agents/:id/status
│   │   │       └── messages/
│   │   │           └── route.ts # GET/POST /api/agents/:id/messages
│   │   ├── departments/
│   │   │   └── market-research/
│   │   │       └── run/
│   │   │           └── route.ts # POST /api/departments/market-research/run
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts     # NextAuth.js handler
│   │   ├── register/
│   │   │   └── route.ts         # POST /api/register
│   │   └── chat/
│   │       └── route.ts         # POST /api/chat
│   │
│   ├── agents/                   # Agent System
│   │   ├── BaseAgent.ts         # Abstract base agent class
│   │   ├── ResearcherAgent.ts   # Researcher implementation
│   │   ├── StrategistAgent.ts   # Strategist implementation
│   │   ├── CriticAgent.ts       # Critic implementation
│   │   ├── IdeatorAgent.ts      # Ideator implementation
│   │   ├── [agentId]/
│   │   │   └── page.tsx         # Agent chat interface
│   │   └── page.tsx             # Agents list page
│   │
│   ├── components/               # React Components
│   │   ├── GameCanvas.tsx       # HTML5 Canvas visualization
│   │   ├── AgentVisualization.tsx  # PixiJS visualization
│   │   ├── CreateAgentModal.tsx    # Agent creation modal
│   │   ├── AgentCard.tsx        # Agent display card
│   │   ├── DepartmentCard.tsx   # Department display card
│   │   ├── AgentChatDialog.tsx  # Chat dialog component
│   │   ├── AgentSidebar.tsx     # Navigation sidebar
│   │   ├── AgentToolbar.tsx     # Action toolbar
│   │   ├── AgentStatusBar.tsx   # Status indicator
│   │   ├── ChatMessage.tsx      # Message component
│   │   ├── AuthForm.tsx         # Auth form component
│   │   └── Footer.tsx           # App footer
│   │
│   ├── components/               # Shared Components (root level)
│   │   └── DeployInfo.tsx       # Deploy date display
│   │
│   ├── departments/              # Department Pages
│   │   ├── market-research/
│   │   │   └── page.tsx         # Market research interface
│   │   └── page.tsx             # Departments list page
│   │
│   ├── visualization/            # Visualization Pages
│   │   └── page.tsx             # PixiJS visualization page
│   │
│   ├── game/                     # Game Canvas Page
│   │   └── page.tsx             # Canvas-based agent world
│   │
│   ├── dashboard/                # Dashboard
│   │   └── page.tsx             # User dashboard
│   │
│   ├── login/                    # Authentication Pages
│   │   └── page.tsx             # Login page
│   │
│   ├── register/
│   │   └── page.tsx             # Registration page
│   │
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── lib/                          # Utility Libraries
│   ├── orchestrator.ts          # Agent orchestration logic
│   ├── Department.ts            # Base department class
│   ├── MarketResearchDepartment.ts  # Market research implementation
│   ├── validation.ts            # Zod validation schemas
│   ├── error-handler.ts         # Error handling utilities
│   ├── rate-limit.ts            # Rate limiting implementation
│   ├── auth.ts                  # NextAuth configuration
│   └── prisma.ts                # Prisma client setup
│
├── types/                        # TypeScript Types
│   ├── index.ts                 # Core type definitions
│   └── visualization.ts         # Visualization types
│
├── prisma/                       # Database
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Migration files
│   └── seed.ts                  # Seed data script
│
├── tests/                        # Test Files
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
│
├── public/                       # Static Assets
│   ├── images/                  # Image files
│   └── build-info.json          # Build/deploy timestamp (auto-generated)

├── scripts/                      # Build Scripts
│   └── generate-build-info.js   # Generates build timestamp
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md          # Architecture guide
│   ├── API.md                   # API documentation
│   ├── DEVELOPMENT.md           # This file
│   └── CREATING_AGENTS.md       # Agent creation guide
│
└── Configuration Files
    ├── package.json             # Dependencies and scripts
    ├── tsconfig.json            # TypeScript config
    ├── next.config.ts           # Next.js config
    ├── tailwind.config.ts       # Tailwind CSS config
    ├── vitest.config.ts         # Vitest config
    ├── eslint.config.mjs        # ESLint config
    ├── .prettierrc              # Prettier config
    ├── Dockerfile               # Docker config
    └── docker-compose.yml       # Docker Compose config
```

---

## Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | Full-stack React framework |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Node.js** | 18+ | Runtime environment |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.x | Utility-first styling |
| **PixiJS** | 8.16.0 | 2D graphics rendering |
| **Lucide React** | Latest | Icon library |
| **React Hook Form** | 7.71.1 | Form management |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Prisma** | 7.4.0 | ORM and database toolkit |
| **NextAuth.js** | 5.0.0-beta.30 | Authentication |
| **Anthropic SDK** | 0.74.0 | Claude AI integration |
| **Zod** | 4.3.6 | Schema validation |
| **bcryptjs** | 2.4.3 | Password hashing |

### Database

| Technology | Purpose |
|------------|---------|
| **SQLite** | Development database |
| **PostgreSQL** | Production database (optional) |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | Latest | Unit testing framework |
| **Testing Library** | Latest | React component testing |
| **Playwright** | Latest | E2E testing (optional) |

### DevOps

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **GitHub Actions** | CI/CD (optional) |

---

## Code Conventions

### TypeScript

#### File Naming

- **Components**: PascalCase (`AgentCard.tsx`)
- **Utilities**: camelCase (`validation.ts`)
- **Types**: PascalCase (`index.ts`)
- **API Routes**: lowercase (`route.ts`)

#### Code Style

```typescript
// Use explicit types
function createAgent(data: CreateAgentInput): Promise<Agent> {
  // Implementation
}

// Use interfaces for objects
interface Agent {
  id: string;
  name: string;
  role: AgentRole;
}

// Use type aliases for unions
type AgentRole = 'researcher' | 'strategist' | 'critic' | 'ideator';

// Use enums sparingly (prefer union types)
enum Status {
  Active = 'active',
  Inactive = 'inactive'
}

// Prefer const assertions
const AGENT_ROLES = ['researcher', 'strategist', 'critic', 'ideator'] as const;
```

### React Components

```typescript
// Functional components with TypeScript
interface AgentCardProps {
  agent: Agent;
  onSelect?: (agentId: string) => void;
}

export function AgentCard({ agent, onSelect }: AgentCardProps) {
  return (
    <div className="agent-card">
      {/* Component JSX */}
    </div>
  );
}

// Use named exports
export { AgentCard };

// Avoid default exports except for pages
```

### Styling Conventions

```tsx
// Use Tailwind utility classes
<div className="flex items-center gap-4 p-4 rounded-lg bg-gray-100">
  {/* Content */}
</div>

// Group related utilities
<div className={`
  flex items-center justify-between
  p-4 rounded-lg
  bg-white shadow-md
  hover:shadow-lg
  transition-shadow
`}>
  {/* Content */}
</div>

// Use CSS variables for theming
:root {
  --color-primary: #3b82f6;
  --color-secondary: #a855f7;
}
```

### API Routes

```typescript
// app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAgentSchema } from '@/lib/validation';
import { handleError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // 3. Database query
    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id,
        ...(role && { role })
      }
    });

    // 4. Response
    return NextResponse.json({ agents });

  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validation
    const body = await request.json();
    const data = createAgentSchema.parse(body);

    // 3. Business logic
    const agent = await prisma.agent.create({
      data: {
        ...data,
        userId: session.user.id
      }
    });

    // 4. Response
    return NextResponse.json({ agent }, { status: 201 });

  } catch (error) {
    return handleError(error);
  }
}
```

### Error Handling

```typescript
// Use try-catch for async operations
try {
  const result = await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Friendly error message');
}

// Custom error classes
class AgentExecutionError extends Error {
  constructor(
    message: string,
    public agentId: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AgentExecutionError';
  }
}

// Centralized error handler
export function handleError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.errors },
      { status: 400 }
    );
  }

  if (error instanceof AgentExecutionError) {
    return NextResponse.json(
      { error: error.message, agentId: error.agentId },
      { status: 500 }
    );
  }

  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Async/Await Best Practices

```typescript
// Always handle promise rejections
const result = await operation().catch(error => {
  console.error('Operation failed:', error);
  return defaultValue;
});

// Parallel operations
const [agents, departments, tasks] = await Promise.all([
  getAgents(),
  getDepartments(),
  getTasks()
]);

// Sequential when order matters
const research = await researchAgent.execute(input);
const strategy = await strategistAgent.execute(research.result);
const critique = await criticAgent.execute(strategy.result);
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- path/to/test.test.ts
```

### Unit Tests

```typescript
// tests/unit/orchestrator.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AgentOrchestrator } from '@/lib/orchestrator';
import { ResearcherAgent } from '@/app/agents/ResearcherAgent';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;
  let agent: ResearcherAgent;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
    agent = new ResearcherAgent({
      id: 'test-1',
      name: 'Test Researcher',
      model: 'claude-3-5-sonnet-20241022'
    });
  });

  it('should register agent', () => {
    orchestrator.registerAgent(agent);
    const registered = orchestrator.getAgent('test-1');
    expect(registered).toBe(agent);
  });

  it('should execute agent', async () => {
    orchestrator.registerAgent(agent);
    const result = await orchestrator.executeAgent(
      'test-1',
      'Test input',
      {}
    );
    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// tests/integration/api.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/agents/route';

describe('Agent API', () => {
  it('should create agent', async () => {
    const request = new Request('http://localhost:3000/api/agents', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Agent',
        role: 'researcher'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.agent).toBeDefined();
    expect(data.agent.name).toBe('Test Agent');
  });
});
```

### Component Tests

```typescript
// tests/unit/AgentCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentCard } from '@/app/components/AgentCard';

describe('AgentCard', () => {
  const mockAgent = {
    id: '1',
    name: 'Test Agent',
    role: 'researcher' as const,
    description: 'Test description'
  };

  it('renders agent name', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  it('renders agent role', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('researcher')).toBeInTheDocument();
  });
});
```

---

## Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_agent_color

# Apply migrations
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

### Database Verification

Verify database status and test operations:

```bash
# Check database status and table counts
node verify-db.mjs

# Run comprehensive database operations test
node test-db-operations.mjs

# Check migration status
npx prisma migrate status
```

### Schema Changes

```prisma
// prisma/schema.prisma

// 1. Add new field
model Agent {
  id          String   @id @default(cuid())
  name        String
  newField    String?  // Add optional field
}

// 2. Create migration
// npx prisma migrate dev --name add_new_field

// 3. Update TypeScript types
// npm run prisma generate
```

### Seeding Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password'
    }
  });

  // Create test agents
  await prisma.agent.createMany({
    data: [
      {
        name: 'Research Assistant',
        role: 'researcher',
        userId: user.id
      },
      {
        name: 'Strategy Advisor',
        role: 'strategist',
        userId: user.id
      }
    ]
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Debugging

### VS Code Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Debugging Tips

```typescript
// Console logging
console.log('Debug:', variable);
console.error('Error:', error);
console.table(arrayOfObjects);

// Debugger statement
debugger;  // Pauses execution in browser dev tools

// React DevTools
// Install React DevTools browser extension

// Network debugging
// Use browser Network tab to inspect API calls

// Database debugging
// Use Prisma Studio: npx prisma studio
```

### Common Issues

#### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

#### Prisma Client Not Generated

```bash
npx prisma generate
```

#### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Performance Optimization

### Database

```typescript
// Use select to limit fields
const agents = await prisma.agent.findMany({
  select: {
    id: true,
    name: true,
    role: true
    // Don't fetch unnecessary fields
  }
});

// Use indexes
model Agent {
  id     String @id @default(cuid())
  userId String
  role   String

  @@index([userId])
  @@index([role])
}

// Batch operations
await prisma.agent.createMany({
  data: [agent1, agent2, agent3]
});
```

### React

```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);

// Lazy load components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### API Routes

```typescript
// Stream long responses
export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const result = await longRunningOperation();
      controller.enqueue(new TextEncoder().encode(result));
      controller.close();
    }
  });

  return new Response(stream);
}

// Cache responses
export const revalidate = 60;  // Cache for 60 seconds
```

---

## Troubleshooting

### TypeScript Errors

```bash
# Check types
npm run type-check

# Clear TypeScript cache
rm -rf .next
rm tsconfig.tsbuildinfo
```

### Build Errors

```bash
# Clean build
rm -rf .next

# Rebuild
npm run build
```

### Database Errors

```bash
# Check connection
npx prisma db pull

# Reset database
npx prisma migrate reset

# Check migrations
npx prisma migrate status
```

### Authentication Issues

```bash
# Regenerate NEXTAUTH_SECRET
openssl rand -base64 32

# Clear session cookies in browser
# Check NEXTAUTH_URL matches your domain
```

---

## Deploy Date Display

The application automatically displays the last deployment date on the homepage footer.

### How It Works

The deploy date feature uses a build-time script to generate a timestamp:

1. **Build Script** (`scripts/generate-build-info.js`):
   - Runs automatically before every build via the `prebuild` npm script
   - Generates `public/build-info.json` with current ISO timestamp
   - Example output:
   ```json
   {
     "deployDate": "2026-02-13T21:14:00.413Z"
   }
   ```

2. **DeployInfo Component** (`components/DeployInfo.tsx`):
   - Client-side component that fetches `build-info.json`
   - Formats timestamp to Czech format: `DD.MM.YYYY v HH:MM`
   - Uses Czech timezone (`Europe/Prague`)
   - Styled to match the app's purple/pink gradient theme

3. **Integration**:
   - Component is added to the footer of the main page (`app/page.tsx`)
   - Displays as: "Poslední deploy: 13.02.2026 v 21:14"

### Files Involved

```
scripts/generate-build-info.js    # Generates timestamp
components/DeployInfo.tsx          # Display component
public/build-info.json            # Generated timestamp (git-ignored)
package.json                       # Includes prebuild script
```

### Testing

```bash
# Build generates new timestamp
npm run build

# Check generated file
cat public/build-info.json

# Test locally
npm run dev
# Visit http://localhost:3000
```

### Customization

To change the date format or timezone, edit `components/DeployInfo.tsx`:

```typescript
// Change timezone
timeZone: 'Europe/Prague'  // Change to your timezone

// Change format
const formatter = new Intl.DateTimeFormat('cs-CZ', options);
```

---

## Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build image
docker build -t agentverse .

# Run container
docker run -p 3000:3000 --env-file .env agentverse

# Or use Docker Compose
docker-compose up -d
```

### Environment Variables (Production)

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
ANTHROPIC_API_KEY="sk-ant-..."
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

---

## Best Practices Summary

1. ✅ Use TypeScript for type safety
2. ✅ Write tests for critical functionality
3. ✅ Validate input with Zod schemas
4. ✅ Handle errors gracefully
5. ✅ Use Prisma for database operations
6. ✅ Follow React best practices
7. ✅ Optimize performance
8. ✅ Document your code
9. ✅ Use version control (Git)
10. ✅ Follow the project structure

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Getting Help

- Check existing documentation
- Search GitHub issues
- Ask in team chat
- Create new issue with details

Happy coding! 🚀
