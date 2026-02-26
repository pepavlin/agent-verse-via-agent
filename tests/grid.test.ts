import { describe, it, expect } from 'vitest'
import { MAP_CONFIG, GRID_OBJECTS, worldSize } from '../app/components/grid-config'

// ---------------------------------------------------------------------------
// MAP_CONFIG
// ---------------------------------------------------------------------------

describe('MAP_CONFIG', () => {
  it('has positive grid dimensions', () => {
    expect(MAP_CONFIG.COLS).toBeGreaterThan(0)
    expect(MAP_CONFIG.ROWS).toBeGreaterThan(0)
    expect(MAP_CONFIG.CELL_SIZE).toBeGreaterThan(0)
  })

  it('has valid zoom range', () => {
    expect(MAP_CONFIG.MIN_ZOOM).toBeGreaterThan(0)
    expect(MAP_CONFIG.MAX_ZOOM).toBeGreaterThan(MAP_CONFIG.MIN_ZOOM)
  })

  it('ZOOM_STEP is smaller than the full zoom range', () => {
    expect(MAP_CONFIG.ZOOM_STEP).toBeGreaterThan(0)
    expect(MAP_CONFIG.ZOOM_STEP).toBeLessThan(MAP_CONFIG.MAX_ZOOM - MAP_CONFIG.MIN_ZOOM)
  })
})

// ---------------------------------------------------------------------------
// worldSize()
// ---------------------------------------------------------------------------

describe('worldSize', () => {
  it('returns correct pixel dimensions', () => {
    const { w, h } = worldSize()
    expect(w).toBe(MAP_CONFIG.COLS * MAP_CONFIG.CELL_SIZE)
    expect(h).toBe(MAP_CONFIG.ROWS * MAP_CONFIG.CELL_SIZE)
  })

  it('returns positive values', () => {
    const { w, h } = worldSize()
    expect(w).toBeGreaterThan(0)
    expect(h).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// GRID_OBJECTS
// ---------------------------------------------------------------------------

describe('GRID_OBJECTS', () => {
  it('contains at least one object', () => {
    expect(GRID_OBJECTS.length).toBeGreaterThan(0)
  })

  it('every object has a unique id', () => {
    const ids = GRID_OBJECTS.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every object has a valid type', () => {
    const valid = ['square', 'circle']
    for (const obj of GRID_OBJECTS) {
      expect(valid).toContain(obj.type)
    }
  })

  it('every object has a positive size', () => {
    for (const obj of GRID_OBJECTS) {
      expect(obj.size).toBeGreaterThan(0)
    }
  })

  it('every object fits within the map bounds', () => {
    for (const obj of GRID_OBJECTS) {
      expect(obj.col).toBeGreaterThanOrEqual(0)
      expect(obj.row).toBeGreaterThanOrEqual(0)
      expect(obj.col + obj.size).toBeLessThanOrEqual(MAP_CONFIG.COLS)
      expect(obj.row + obj.size).toBeLessThanOrEqual(MAP_CONFIG.ROWS)
    }
  })

  it('every object has a non-empty label', () => {
    for (const obj of GRID_OBJECTS) {
      expect(obj.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('every object has a valid hex colour', () => {
    for (const obj of GRID_OBJECTS) {
      expect(obj.color).toBeGreaterThanOrEqual(0x000000)
      expect(obj.color).toBeLessThanOrEqual(0xffffff)
    }
  })
})
