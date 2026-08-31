import { describe, expect, it } from 'vitest'
import {
  appendPoint,
  normaliseStroke,
  strokeBounds,
  strokePathData,
} from '../src/domain/freehand'

describe('strokeBounds', () => {
  it('wraps the points with room for the stroke thickness', () => {
    const bounds = strokeBounds([{ x: 10, y: 10 }, { x: 30, y: 50 }], 4)
    expect(bounds).toEqual({ x: 6, y: 6, width: 28, height: 48 })
  })

  it('keeps a perfectly straight stroke selectable', () => {
    const bounds = strokeBounds([{ x: 0, y: 0 }, { x: 100, y: 0 }], 0)
    expect(bounds.height).toBeGreaterThan(0)
  })

  it('handles an empty stroke', () => {
    expect(strokeBounds([], 4)).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })
})

describe('normaliseStroke', () => {
  it('maps points into 0–1 inside their box', () => {
    const points = [{ x: 10, y: 20 }, { x: 110, y: 70 }]
    const bounds = { x: 10, y: 20, width: 100, height: 50 }
    expect(normaliseStroke(points, bounds)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ])
  })
})

describe('appendPoint', () => {
  it('drops a sample that has barely moved', () => {
    const points = [{ x: 0, y: 0 }]
    expect(appendPoint(points, { x: 1, y: 0 }, 2)).toBe(points)
  })

  it('keeps a sample once the pointer has travelled', () => {
    const points = [{ x: 0, y: 0 }]
    expect(appendPoint(points, { x: 5, y: 0 }, 2)).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
    ])
  })

  it('always keeps the first sample', () => {
    expect(appendPoint([], { x: 3, y: 3 })).toEqual([{ x: 3, y: 3 }])
  })
})

describe('strokePathData', () => {
  it('paints a tap as a dot', () => {
    expect(strokePathData([{ x: 0.5, y: 0.5 }], 100, 100)).toBe('M 50 50 L 50 50')
  })

  it('joins two points with a line', () => {
    expect(
      strokePathData([{ x: 0, y: 0 }, { x: 1, y: 1 }], 100, 50),
    ).toBe('M 0 0 L 100 50')
  })

  it('smooths three or more points through their midpoints', () => {
    const path = strokePathData(
      [{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0 }],
      100,
      100,
    )
    expect(path).toBe('M 0 0 Q 50 100, 75 50 L 100 0')
  })

  it('scales with the box, which is what makes resize work', () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }]
    expect(strokePathData(points, 200, 100)).toBe('M 0 0 L 200 100')
  })

  it('has nothing to draw for an empty stroke', () => {
    expect(strokePathData([], 100, 100)).toBe('')
  })
})
