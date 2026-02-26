# 2D Grid Explorer

Interactive 2D grid with zoom and pan, built with Next.js and pixi.js.

## Features

- **50 × 50 cell grid** with a hard maximum boundary
- **Zoom** — scroll wheel or +/− buttons (15 % – 400 %)
- **Pan** — click and drag anywhere on the map
- **Coordinate display** — hover to see cell coordinates in real time
- **Two objects** — a square (Alpha) and a circle (Beta) placed on the grid
- **Reset view** — ⌂ button centres the map at 25 %

## Getting Started

### Docker Compose (recommended)

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

### Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Controls

| Action | Input |
|---|---|
| Pan | Click and drag |
| Zoom in | Scroll up / `+` button |
| Zoom out | Scroll down / `−` button |
| Reset view | `⌂` button (bottom-right) |

## Configuration

All constants live at the top of `app/components/Grid2D.tsx`.

### Grid

```ts
export const MAP_CONFIG = {
  COLS: 50,        // columns
  ROWS: 50,        // rows
  CELL_SIZE: 64,   // px per cell at zoom = 1
  MIN_ZOOM: 0.15,
  MAX_ZOOM: 4,
  ZOOM_STEP: 0.15,
}
```

### Objects

```ts
export const GRID_OBJECTS: GridObject[] = [
  { id: 'square-1', type: 'square', col: 8,  row: 8,  color: 0x6366f1, size: 4, label: 'Alpha' },
  { id: 'circle-1', type: 'circle', col: 30, row: 22, color: 0xf59e0b, size: 4, label: 'Beta'  },
]
```

## Tests

```bash
npm test
```

## Tech Stack

- [Next.js 16](https://nextjs.org/)
- [pixi.js 8](https://pixijs.com/) — WebGL 2D renderer
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)
