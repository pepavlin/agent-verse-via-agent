# AgentVerse

A Next.js web application for creating and managing AI agents powered by Anthropic's Claude API.

## Features

- User authentication with NextAuth.js
- Create and manage multiple AI agents
- Chat interface with conversation history
- Support for different Claude models (Sonnet, Opus, Haiku)
- Responsive design with Tailwind CSS
- SQLite database with Prisma ORM

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Update the following variables in `.env`:
     - `ANTHROPIC_API_KEY`: Your Anthropic API key
     - `NEXTAUTH_SECRET`: A random secret for NextAuth (generate with `openssl rand -base64 32`)
     - `NEXTAUTH_URL`: Should be `http://localhost:3000` for local development

3. The database has already been initialized, but if you need to reset it:
```bash
npx prisma migrate dev
npx prisma generate
```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Register**: Create an account at `/register`
2. **Login**: Sign in at `/login`
3. **Dashboard**: View all your agents at `/dashboard`
4. **Create Agent**: Click "Create Agent" and fill in the details
5. **Chat**: Click on an agent to start a conversation

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: SQLite with Prisma
- **AI**: Anthropic Claude API

## Project Structure

```
agent-verse-via-agent/
├── app/
│   ├── api/            # API routes
│   ├── components/     # React components
│   ├── agents/         # Agent chat pages
│   ├── dashboard/      # Dashboard page
│   ├── login/          # Login page
│   └── register/       # Register page
├── lib/                # Utility functions
├── prisma/             # Database schema and migrations
└── types/              # TypeScript type definitions
```

## Environment Variables

The `.env` file includes the following variables:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```

## License

MIT
