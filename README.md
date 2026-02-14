# AgentVerse 🤖

<div align="center">

**A Modular Multi-Agent Collaboration System Powered by Claude AI**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Anthropic Claude](https://img.shields.io/badge/Anthropic-Claude-orange?style=flat)](https://www.anthropic.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture)

</div>

---

## 🌟 Overview

AgentVerse is an interactive web application that creates a universe of specialized AI agents working together to solve complex problems. Each agent has unique roles, personalities, and skills, collaborating through structured workflows to deliver comprehensive solutions.

### What Makes AgentVerse Special?

- **Specialized Agents**: Researcher, Strategist, Critic, and Ideator agents with distinct roles
- **Department Workflows**: Coordinate multiple agents for complex multi-step tasks
- **Interactive Visualization**: 2D canvas and PixiJS-powered agent universe
- **Real-time Collaboration**: Agents communicate and build on each other's work
- **Flexible Orchestration**: Single, pipeline, parallel, and collaborative execution patterns
- **Production Ready**: Built with Next.js, TypeScript, and enterprise-grade tooling

---

## ✨ Features

### Core Capabilities

- 🎭 **4 Specialized Agent Types** - Each with unique expertise and personality
- 🏢 **Department System** - Organize agents into collaborative teams
- 💬 **Agent Chat Interface** - Direct conversations with individual agents
- 🗨️ **Global Project Manager Chat** - Always-available floating chat for support and guidance
- 🔄 **Multi-Agent Workflows** - Sequential and parallel execution patterns
- 🎨 **Interactive Visualization** - 2D agent world with physics simulation
- 📊 **Workflow Analytics** - Track execution history and performance
- 🔐 **User Authentication** - Secure NextAuth.js-based authentication
- 💾 **Persistent Storage** - SQLite database with full conversation history

### Agent Types

| Agent | Role | Specialization |
|-------|------|----------------|
| 🔬 **Researcher** | Data Gathering | Thorough analysis, fact-finding, competitive intelligence |
| 🎯 **Strategist** | Planning | Strategic thinking, opportunity identification, risk assessment |
| 🔍 **Critic** | Evaluation | Quality assurance, gap analysis, constructive improvement |
| 💡 **Ideator** | Innovation | Creative solutions, brainstorming, innovative approaches |

### Available Departments

#### 🏪 Market Research Department
Comprehensive market analysis combining all four agent types:
1. **Research** - Gather market data and competitive intelligence
2. **Strategy** - Identify opportunities and strategic positioning
3. **Critique** - Evaluate risks, gaps, and weaknesses
4. **Innovation** - Propose creative solutions and differentiation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd agent-verse-via-agent

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY and NEXTAUTH_SECRET

# 4. Start the development server (database auto-initializes)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### First Steps

1. **Register** an account at `/register`
2. **Login** at `/login`
3. **Explore** the agents page to see available agent types
4. **Create** your first agent with a custom role and personality
5. **Chat** with individual agents or run department workflows
6. **Visualize** your agent universe at `/visualization`

---

## 📖 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design, components, and data flow
- **[API Documentation](docs/API.md)** - Complete REST API reference
- **[Developer Guide](docs/DEVELOPMENT.md)** - Setup, conventions, and best practices
- **[Agent Creation Guide](docs/CREATING_AGENTS.md)** - How to create custom agents
- **[Database Status Report](DATABASE_STATUS.md)** - Database schema and verification results
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Docker and production deployment

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │   Chat UI   │  │ Visualization│  │   Dashboard   │ │
│  └─────────────┘  └──────────────┘  └───────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ API Calls
┌────────────────────────┴────────────────────────────────┐
│                   Next.js API Routes                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Agent Orchestrator                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │ Pipeline │  │ Parallel │  │ Collaborative    │ │ │
│  │  │ Execution│  │ Execution│  │ Workflow         │ │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                  Agent Layer                             │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │ Researcher │  │ Strategist  │  │    Critic        │ │
│  └────────────┘  └─────────────┘  └──────────────────┘ │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │  Ideator   │  │ Coordinator │  │    Executor      │ │
│  └────────────┘  └─────────────┘  └──────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│              Anthropic Claude API                        │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Next.js 16 | UI framework with App Router |
| **Styling** | Tailwind CSS 4 | Utility-first styling |
| **Visualization** | PixiJS 8 | GPU-accelerated 2D graphics |
| **Backend** | Next.js API Routes | RESTful API endpoints |
| **AI** | Anthropic Claude | Agent intelligence |
| **Database** | SQLite + Prisma | Type-safe data persistence |
| **Auth** | NextAuth.js 5 | User authentication |
| **Validation** | Zod 4 | Schema validation |
| **Testing** | Vitest + Testing Library | Unit and integration tests |

---

## 📁 Project Structure

```
agent-verse-via-agent/
├── app/
│   ├── api/                      # API Routes
│   │   ├── agents/              # Agent management endpoints
│   │   ├── departments/         # Department workflow endpoints
│   │   ├── auth/                # Authentication endpoints
│   │   └── chat/                # Chat endpoints
│   ├── agents/                  # Agent pages
│   │   ├── [agentId]/          # Individual agent chat
│   │   ├── BaseAgent.ts        # Abstract base agent class
│   │   ├── ResearcherAgent.ts  # Researcher implementation
│   │   ├── StrategistAgent.ts  # Strategist implementation
│   │   ├── CriticAgent.ts      # Critic implementation
│   │   └── IdeatorAgent.ts     # Ideator implementation
│   ├── components/              # React components
│   │   ├── GameCanvas.tsx      # HTML5 Canvas visualization
│   │   ├── AgentVisualization.tsx  # PixiJS visualization
│   │   ├── CreateAgentModal.tsx    # Agent creation form
│   │   └── ...                 # Other components
│   ├── departments/             # Department pages
│   │   └── market-research/    # Market research workflow
│   ├── visualization/           # Visualization page
│   ├── game/                    # Game canvas page
│   ├── dashboard/               # User dashboard
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   └── page.tsx                 # Landing page
├── lib/
│   ├── orchestrator.ts          # Agent orchestration logic
│   ├── Department.ts            # Base department class
│   ├── MarketResearchDepartment.ts  # Market research department
│   ├── validation.ts            # Zod schemas
│   ├── error-handler.ts         # Error handling utilities
│   └── rate-limit.ts            # Rate limiting
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Database migrations
│   └── seed.ts                  # Seed data
├── types/
│   ├── index.ts                 # Core type definitions
│   └── visualization.ts         # Visualization types
├── tests/                        # Test files
├── docs/                         # Documentation
└── public/                       # Static assets
```

---

## 🎮 Usage Examples

### Creating a Custom Agent

```typescript
// Via API
POST /api/agents
{
  "name": "Research Assistant",
  "role": "researcher",
  "personality": "Detail-oriented and analytical",
  "specialization": "Market trends analysis",
  "model": "claude-3-5-sonnet-20241022",
  "color": "#3b82f6",
  "size": 25
}
```

### Running a Single Agent

```typescript
// Chat with an agent
POST /api/agents/{agentId}/run
{
  "input": "Analyze the competitive landscape for eco-friendly packaging",
  "context": {
    "industry": "packaging",
    "focus": "sustainability"
  }
}
```

### Executing a Department Workflow

```typescript
// Run market research
POST /api/departments/market-research/run
{
  "query": "E-commerce market for sustainable products in Europe",
  "options": {
    "targetMarket": "Europe",
    "competitors": ["CompanyA", "CompanyB"],
    "timeframe": "2024-2026"
  }
}
```

---

## 🔧 Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run test       # Run tests
npm run lint       # Lint code
npm run db:seed    # Seed database with sample data
```

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL="file:./dev.db"

# Anthropic API
ANTHROPIC_API_KEY="your_api_key_here"

# NextAuth
NEXTAUTH_SECRET="your_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Application
PORT=3000
```

### Docker Deployment

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Anthropic Claude](https://www.anthropic.com/) AI
- Powered by [Next.js](https://nextjs.org/)
- Visualization by [PixiJS](https://pixijs.com/)

---

<div align="center">

**[⬆ Back to Top](#agentverse-)**

Made with ❤️ by the AgentVerse Team

</div>
