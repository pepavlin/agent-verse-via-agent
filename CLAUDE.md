# CLAUDE.md — Agent instructions for agent-verse-via-agent

## Project

**2D Grid Explorer** — Next.js 16 + pixi.js interactive 2D grid with zoom and pan.

## Stack

- Next.js 16 (`output: "standalone"`)
- React 19
- pixi.js 8 (WebGL renderer)
- Tailwind CSS 4
- Vitest + @testing-library/react

## Key commands

```bash
npm run dev      # start local dev server (port 3000)
npm run build    # production build
npm test         # run unit tests
npm run lint     # lint with ESLint

docker compose up --build   # build & run via Docker Compose
docker compose down         # stop
```

## Conventions

- All grid constants live in `app/components/Grid2D.tsx` (`MAP_CONFIG`, `GRID_OBJECTS`).
- Use refs for pixi state — avoid React re-renders for rendering.
- Temp files go in `/tmp` (gitignored).
- Docs go in `docs/` — keep `docs/architecture.md` up to date.
- Never modify anything under `.github/`.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- Do not push — only commit.

## Tests

Unit tests live in `tests/`. Run with `npm test`.
Always write tests for new logic. Follow existing Vitest + @testing-library style.
