// ---------------------------------------------------------------------------
// Map configuration — no pixi.js dependency, safe to import in tests
// ---------------------------------------------------------------------------

export const MAP_CONFIG = {
  /** Number of columns */
  COLS: 50,
  /** Number of rows */
  ROWS: 50,
  /** Pixel size of one cell at zoom = 1 */
  CELL_SIZE: 64,
  /** Minimum zoom (most zoomed out) */
  MIN_ZOOM: 0.15,
  /** Maximum zoom (most zoomed in) */
  MAX_ZOOM: 4,
  /** Zoom step used by +/- buttons */
  ZOOM_STEP: 0.15,
} as const

// ---------------------------------------------------------------------------
// Objects placed on the grid
// ---------------------------------------------------------------------------

export interface GridObject {
  id: string
  type: 'square' | 'circle'
  /** Column of the top-left corner (0-based) */
  col: number
  /** Row of the top-left corner (0-based) */
  row: number
  /** Fill colour as 0xRRGGBB */
  color: number
  /** Size in cells (both width and height) */
  size: number
  label: string
}

export const GRID_OBJECTS: GridObject[] = []

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Total map size in pixels at zoom = 1 */
export function worldSize(): { w: number; h: number } {
  return {
    w: MAP_CONFIG.COLS * MAP_CONFIG.CELL_SIZE,
    h: MAP_CONFIG.ROWS * MAP_CONFIG.CELL_SIZE,
  }
}
