# 2D Grid Explorer

An interactive 2D grid built with Next.js and pixi.js.

## Features

- **2D grid** with configurable size (default: 100×100 cells)
- **Zoom** – scroll wheel or +/− buttons (10% – 500%)
- **Pan** – click and drag
- **Objects** – a square and a circle placed on the grid
- **Boundary** – map has a hard maximum size; panning is clamped

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Controls

| Action | Input |
|--------|-------|
| Pan | Click and drag |
| Zoom in/out | Mouse wheel |
| Zoom buttons | + / − in bottom-right |
| Reset view | ⌂ button |

## Configuration

Edit `app/components/Grid2D.tsx`:

```ts
export const MAP_CONFIG = {
  COLS: 100,        // map width in cells
  ROWS: 100,        // map height in cells
  CELL_SIZE: 40,    // pixels per cell at zoom=1
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  ZOOM_STEP: 0.2,
}
```

Add or modify objects in `GRID_OBJECTS`:

```ts
export const GRID_OBJECTS: GridObject[] = [
  { id: 'square-1', type: 'square', col: 20, row: 15, color: 0x6366f1, size: 2, label: 'Square A' },
  { id: 'circle-1', type: 'circle', col: 60, row: 40, color: 0x22d3ee, size: 2, label: 'Circle B' },
]
```

## Tests

```bash
npm test
```

## Tech Stack

- [Next.js 16](https://nextjs.org/)
- [pixi.js 8](https://pixijs.com/) – WebGL 2D renderer
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)
