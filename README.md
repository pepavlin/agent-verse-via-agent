# Agent Verse

Interactive 2D world with AI agents, built with Next.js and pixi.js. Users bring their own Anthropic API key — agents run real AI tasks in response to user commands.

## Features

- **50 × 50 cell grid** with animated stick-figure AI agents
- **Zoom** — scroll wheel or +/− buttons (15 % – 400 %)
- **Pan** — middle-mouse drag
- **Agent tasks** — click any agent, type a task, choose delivery mode (Wait / Inbox)
- **Real LLM execution** — uses Anthropic Claude with the user's own API key
- **Needs-user (human-in-the-loop)** — agent can pause and ask a clarifying question; user answers inline and the run resumes automatically
- **Inbox** — async task results delivered to a message feed
- **User authentication** — email + password login and registration
- **BYOK (Bring Your Own Key)** — users paste their Anthropic API key; it's stored AES-256-GCM encrypted server-side and never returned to the browser

## Getting Started

### Local development

1. Copy the environment template and fill in the required values:

```bash
cp .env.example .env.local
```

Required values in `.env.local`:

```env
DATABASE_URL=file:./prisma/dev.db
ENCRYPTION_KEY=<64 hex chars — generate with: openssl rand -hex 32>
NEXTAUTH_SECRET=<random secret — generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

2. Run database migrations:

```bash
npx prisma migrate deploy
# or for first-time setup:
npx prisma db push
```

3. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

### Docker Compose

```bash
docker compose up --build
```

> **Note:** Docker Compose currently uses the legacy PostgreSQL config. Update `DATABASE_URL` and add `ENCRYPTION_KEY` / `NEXTAUTH_SECRET` to the compose file for production use.

## Authentication

Users register with email and password. Sessions are managed server-side via NextAuth.js JWT strategy (30-day expiry). All routes are protected by `middleware.ts` — unauthenticated requests are automatically redirected to `/login`.

No email verification required for MVP.

## API Key Management (BYOK)

1. After login, click the settings button (gear icon) in the top-left corner.
2. Paste your Anthropic API key (starts with `sk-ant-`).
3. Optionally click **Otestovat klíč** to validate the key before saving.
4. Click **Uložit** — the key is encrypted with AES-256-GCM and stored in the database.
5. The key is shown only as a fingerprint (`sk-ant...xxxx`) — the plaintext is never returned to the browser.

To use a new key, open settings and click **Změnit**, then paste the new key.

## Controls

| Action | Input |
|---|---|
| Pan | Middle-mouse drag |
| Zoom in | Scroll up / `+` button |
| Zoom out | Scroll down / `−` button |
| Reset view | `⌂` button (bottom-right) |
| Open agent panel | Click on a walking agent |
| Run a task | Agent panel → task field → Spustit |
| Inbox | Message icon (top-right) |
| Settings | Gear icon (top-left) |

## Tests

```bash
npm test
```

## Tech Stack

- [Next.js 16](https://nextjs.org/)
- [pixi.js 8](https://pixijs.com/) — WebGL 2D renderer
- [NextAuth.js 4](https://next-auth.js.org/) — authentication
- [Prisma 5](https://www.prisma.io/) + SQLite — database
- [Anthropic SDK](https://www.npmjs.com/package/@anthropic-ai/sdk) — LLM integration
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)
