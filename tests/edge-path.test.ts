import { describe, expect, it } from 'vitest'
import {
  buildEdgePath,
  edgeEndpoint,
  resolveEdgeEnds,
  strokeDashArray,
} from '../src/domain/edge-path'
import type { DiagramNode } from '../src/domain/diagram'

const node: DiagramNode = {
  id: 'n',
  kind: 'rectangle',
  x: 100,
  y: 200,
  width: 200,
  height: 100,
  label: 'n',
  fillColor: '#ffffff',
  strokeColor: '#2e3442',
  strokeWidth: 2,
}

describe('edgeEndpoint', () => {
  it('finds each side of a node and the direction the line leaves it', () => {
    expect(edgeEndpoint(node, 'top')).toEqual({ x: 200, y: 200, dx: 0, dy: -1 })
    expect(edgeEndpoint(node, 'bottom')).toEqual({ x: 200, y: 300, dx: 0, dy: 1 })
    expect(edgeEndpoint(node, 'left')).toEqual({ x: 100, y: 250, dx: -1, dy: 0 })
    expect(edgeEndpoint(node, 'right')).toEqual({ x: 300, y: 250, dx: 1, dy: 0 })
  })

  it('strips the source/target prefix React Flow adds', () => {
    expect(edgeEndpoint(node, 'source-top')).toEqual(edgeEndpoint(node, 'top'))
    expect(edgeEndpoint(node, 'target-left')).toEqual(edgeEndpoint(node, 'left'))
  })

  it('falls back to the right side for a missing handle', () => {
    expect(edgeEndpoint(node, null)).toEqual(edgeEndpoint(node, 'right'))
    expect(edgeEndpoint(node, undefined)).toEqual(edgeEndpoint(node, 'right'))
  })
})

describe('buildEdgePath', () => {
  const source = { x: 0, y: 0, dx: 1, dy: 0 }
  const target = { x: 400, y: 200, dx: -1, dy: 0 }

  it('draws a straight line between the two points', () => {
    expect(buildEdgePath(source, target, 'straight')).toBe('M 0 0 L 400 200')
  })

  it('curves out along each endpoint direction', () => {
    const path = buildEdgePath(source, target, 'curved')
    expect(path).toMatch(/^M 0 0 C /)
    // Control points reach along +x from the source and -x into the target.
    expect(path).toContain('C 140 0, 260 200')
  })

  it('defaults to curved', () => {
    expect(buildEdgePath(source, target)).toBe(
      buildEdgePath(source, target, 'curved'),
    )
  })

  it('leaves a horizontal endpoint horizontally when elbowed', () => {
    expect(buildEdgePath(source, target, 'elbow')).toBe(
      'M 0 0 L 200 0 L 200 200 L 400 200',
    )
  })

  it('leaves a vertical endpoint vertically when elbowed', () => {
    expect(
      buildEdgePath({ x: 0, y: 0, dx: 0, dy: 1 }, { x: 400, y: 200, dx: 0, dy: -1 }, 'elbow'),
    ).toBe('M 0 0 L 0 100 L 400 100 L 400 200')
  })

  it('keeps short connections taut rather than looping', () => {
    const path = buildEdgePath(
      { x: 0, y: 0, dx: 1, dy: 0 },
      { x: 10, y: 0, dx: -1, dy: 0 },
      'curved',
    )
    // Reach is clamped to a 48 minimum, not half of a 10px gap.
    expect(path).toContain('C 48 0, -38 0')
  })
})

describe('strokeDashArray', () => {
  it('has no pattern when solid', () => {
    expect(strokeDashArray('solid', 2)).toBeUndefined()
    expect(strokeDashArray()).toBeUndefined()
  })

  it('scales the pattern with the stroke width', () => {
    expect(strokeDashArray('dashed', 2)).toBe('8 6')
    expect(strokeDashArray('dashed', 4)).toBe('16 12')
  })

  it('uses round caps for dots by drawing zero-length dashes', () => {
    expect(strokeDashArray('dotted', 2)).toBe('0.1 5')
  })
})

describe('resolveEdgeEnds', () => {
  const nodes = new Map([['n', node]])

  it('resolves an edge attached at both ends', () => {
    const ends = resolveEdgeEnds(
      { id: 'e', source: 'n', target: 'n', sourceHandle: 'right', targetHandle: 'left' },
      nodes,
    )
    expect(ends?.source).toEqual({ x: 300, y: 250, dx: 1, dy: 0 })
    expect(ends?.target).toEqual({ x: 100, y: 250, dx: -1, dy: 0 })
  })

  it('points a pinned end at the other end so a curve bows sensibly', () => {
    const ends = resolveEdgeEnds(
      {
        id: 'e',
        sourcePoint: { x: 0, y: 0 },
        targetPoint: { x: 100, y: 0 },
      },
      nodes,
    )
    expect(ends?.source).toEqual({ x: 0, y: 0, dx: 1, dy: 0 })
    expect(ends?.target).toEqual({ x: 100, y: 0, dx: -1, dy: 0 })
  })

  it('handles a line attached at one end and pinned at the other', () => {
    const ends = resolveEdgeEnds(
      { id: 'e', source: 'n', sourceHandle: 'right', targetPoint: { x: 500, y: 250 } },
      nodes,
    )
    expect(ends?.source).toEqual({ x: 300, y: 250, dx: 1, dy: 0 })
    expect(ends?.target).toEqual({ x: 500, y: 250, dx: -1, dy: 0 })
  })

  it('gives up when an attached end has lost its node', () => {
    expect(
      resolveEdgeEnds({ id: 'e', source: 'gone', target: 'n' }, nodes),
    ).toBeNull()
  })

  it('gives up when an end resolves to nothing at all', () => {
    expect(resolveEdgeEnds({ id: 'e', source: 'n' }, nodes)).toBeNull()
  })

  it('survives a zero-length line without dividing by zero', () => {
    const ends = resolveEdgeEnds(
      { id: 'e', sourcePoint: { x: 5, y: 5 }, targetPoint: { x: 5, y: 5 } },
      nodes,
    )
    expect(ends?.source.dx).toBe(1)
    expect(ends?.source.dy).toBe(0)
  })
})
