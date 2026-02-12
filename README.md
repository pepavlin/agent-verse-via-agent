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
   - Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   - Update the following variables in `.env`:
     - `ANTHROPIC_API_KEY`: Your Anthropic API key
     - `NEXTAUTH_SECRET`: A random secret for NextAuth (generate with `openssl rand -base64 32`)
     - `NEXTAUTH_URL`: Should be `http://localhost:3000` for local development
     - `DATABASE_URL`: Database connection string (default: `file:./dev.db`)
     - `PORT`: Application port (default: `3000`)

3. The database has already been initialized, but if you need to reset it:
```bash
npx prisma migrate dev
npx prisma generate
```

### Running the Application

#### Option 1: Development Server (Local)

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option 2: Docker Compose (Production)

For production deployment using Docker:

1. Make sure you have Docker and Docker Compose installed

2. Create a `.env` file (copy from `.env.example` if needed):
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
   - Set `ANTHROPIC_API_KEY` to your Anthropic API key
   - Set `NEXTAUTH_SECRET` to a secure random string
   - Set `NEXTAUTH_URL` to your production URL (e.g., `https://yourdomain.com`)
   - Set `PORT` to your desired port (default: `3000`)
   - Set `DATABASE_URL=file:/app/data/production.db` for Docker deployment

4. Build and start the containers:
```bash
docker-compose up -d
```

5. The application will be available at `http://localhost:PORT` (or your configured port)

6. View logs:
```bash
docker-compose logs -f
```

7. Stop the containers:
```bash
docker-compose down
```

8. To rebuild after code changes:
```bash
docker-compose up -d --build
```

**Note**: The database is persisted in a Docker volume, so your data will be preserved across container restarts.

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

Create a `.env` file based on `.env.example`:

```env
# Application Port
PORT=3000

# Database Configuration
# For Docker: file:/app/data/production.db
# For local: file:./dev.db
DATABASE_URL=file:./dev.db

# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**Security Note**: The `.env` file is excluded from git via `.gitignore` to protect your sensitive credentials.

## License

MIT
