import { describe, it, expect } from 'vitest'
import { MAP_CONFIG, GRID_OBJECTS } from '../app/components/Grid2D'

describe('MAP_CONFIG', () => {
  it('has positive dimensions', () => {
    expect(MAP_CONFIG.COLS).toBeGreaterThan(0)
    expect(MAP_CONFIG.ROWS).toBeGreaterThan(0)
    expect(MAP_CONFIG.CELL_SIZE).toBeGreaterThan(0)
  })

  it('zoom bounds are valid', () => {
    expect(MAP_CONFIG.MIN_ZOOM).toBeGreaterThan(0)
    expect(MAP_CONFIG.MAX_ZOOM).toBeGreaterThan(MAP_CONFIG.MIN_ZOOM)
  })

  it('ZOOM_STEP fits within range', () => {
    expect(MAP_CONFIG.ZOOM_STEP).toBeLessThan(MAP_CONFIG.MAX_ZOOM - MAP_CONFIG.MIN_ZOOM)
  })
})

describe('GRID_OBJECTS', () => {
  it('has at least one object', () => {
    expect(GRID_OBJECTS.length).toBeGreaterThan(0)
  })

  it('all objects are within map bounds', () => {
    for (const obj of GRID_OBJECTS) {
      expect(obj.col).toBeGreaterThanOrEqual(0)
      expect(obj.col + obj.size).toBeLessThanOrEqual(MAP_CONFIG.COLS)
      expect(obj.row).toBeGreaterThanOrEqual(0)
      expect(obj.row + obj.size).toBeLessThanOrEqual(MAP_CONFIG.ROWS)
    }
  })

  it('all objects have valid types', () => {
    for (const obj of GRID_OBJECTS) {
      expect(['square', 'circle']).toContain(obj.type)
    }
  })

  it('all objects have unique ids', () => {
    const ids = GRID_OBJECTS.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all objects have positive size', () => {
    for (const obj of GRID_OBJECTS) {
      expect(obj.size).toBeGreaterThan(0)
    }
  })
})
