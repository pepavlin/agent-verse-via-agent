# Authentication & API Key Management

## Overview

Agent Verse uses NextAuth.js v4 for session management and AES-256-GCM encryption for user API key storage. Each user brings their own Anthropic API key (BYOK model), which is encrypted at rest and never returned to the client.

## Architecture

```
Browser                     Next.js Server              Database (SQLite)
  │                              │                             │
  │── POST /api/auth/[..] ──────►│ NextAuth credential check   │
  │◄── JWT cookie ──────────────│                             │
  │                              │                             │
  │── POST /api/user/api-key ───►│ encrypt(key) with AES-GCM  │
  │◄── { fingerprint } ─────────│─── INSERT ApiKey ──────────►│
  │                              │                             │
  │── POST /api/run ────────────►│ getSession() → userId       │
  │                              │─── SELECT ApiKey ──────────►│
  │                              │◄── encrypted key ───────────│
  │                              │ decrypt(key)                │
  │                              │─── Anthropic API call ────► LLM
  │◄── { result } ──────────────│◄── LLM response ────────────│
```

## Authentication Flow

**Registration:** `POST /api/user/register`
- Validates email + password (min 8 chars)
- Hashes password with bcrypt (12 rounds)
- Creates User record in SQLite

**Login:** NextAuth credentials provider
- Validates email + password hash
- Issues JWT cookie (30-day session)
- JWT contains `{ id, email, name }`

**Route protection:** `middleware.ts`
- All routes except `/login` and `/api/auth/*` require authentication
- Unauthenticated requests are redirected to `/login`

## API Key Encryption

**Algorithm:** AES-256-GCM (authenticated encryption)

**Key material:**
- Master key: 32-byte (256-bit) random value stored in `ENCRYPTION_KEY` env var
- Per-encryption IV: 16-byte random value generated at encrypt-time
- Auth tag: 16-byte GCM authentication tag

**Storage format (in DB):** `base64(iv):base64(authTag):base64(ciphertext)`

**Security properties:**
- Same plaintext key encrypts to different ciphertext each time (random IV)
- Tampering with any byte is detected (GCM authentication tag)
- Master key never stored in the database
- Plaintext key never returned to the browser
- API key logged only as fingerprint (`sk-ant...xxxx`)

## API Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth handler |
| `/api/user/register` | POST | — | Create new account |
| `/api/user/api-key` | GET | ✓ | Get fingerprint (not key) |
| `/api/user/api-key` | POST | ✓ | Save/replace API key |
| `/api/user/api-key` | DELETE | ✓ | Remove API key |
| `/api/user/api-key/test` | POST | ✓ | Validate key with Anthropic |
| `/api/run` | POST | ✓ | Execute agent task via LLM |

## LLM Execution

`POST /api/run` body:
```json
{
  "agentId": "agent-alice",
  "agentName": "Alice",
  "agentRole": "Explorer",
  "agentGoal": "optional",
  "agentPersona": "optional",
  "taskDescription": "Map the north sector"
}
```

The server:
1. Verifies the session
2. Loads and decrypts the user's API key
3. Calls `claude-opus-4-6` via Anthropic SDK
4. Returns `{ result: "..." }`

**No API key case (HTTP 402):**
```json
{
  "error": "no_api_key",
  "userMessage": "Pro použití agentů je potřeba nastavit API klíč."
}
```

The client opens the settings modal automatically.

## RunEngine Integration

The `RunEngine.startRun(runId, executor?)` method now accepts an optional async executor function. When an executor is provided (real LLM mode), it replaces the built-in mock timeout. The executor is called synchronously, and its promise drives the run lifecycle:

- Resolves → `run:completed` event
- Rejects → `run:failed` event with the error message

The mock path (no executor) remains intact for testing and demo purposes.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | SQLite file path, e.g. `file:./dev.db` |
| `ENCRYPTION_KEY` | ✓ | 64-char hex string (32 bytes) for AES-256-GCM |
| `NEXTAUTH_SECRET` | ✓ | Random secret for JWT signing |
| `NEXTAUTH_URL` | ✓ | Base URL of the app (e.g. `http://localhost:3000`) |

Generate secrets:
```bash
openssl rand -hex 32    # for ENCRYPTION_KEY
openssl rand -base64 32 # for NEXTAUTH_SECRET
```
