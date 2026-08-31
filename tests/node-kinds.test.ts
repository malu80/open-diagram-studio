import { describe, expect, it } from 'vitest'
import {
  basicShapes,
  hasEditableLabel,
  kindsInGroup,
  nodeKindSpecs,
  specFor,
} from '../src/domain/node-kinds'
import type { DiagramNodeKind } from '../src/domain/diagram'

describe('node kind table', () => {
  it('describes every kind the domain declares', () => {
    const kinds = Object.keys(nodeKindSpecs) as DiagramNodeKind[]
    kinds.forEach((kind) => {
      const spec = specFor(kind)
      expect(spec.width).toBeGreaterThan(0)
      expect(spec.height).toBeGreaterThan(0)
      expect(spec.group).toBeTruthy()
    })
  })

  it('puts every kind in exactly one toolbar group', () => {
    const total =
      kindsInGroup('shape').length +
      kindsInGroup('architecture').length +
      kindsInGroup('standalone').length
    expect(total).toBe(Object.keys(nodeKindSpecs).length)
  })

  it('lists the five architecture kinds', () => {
    expect(kindsInGroup('architecture')).toEqual([
      'client',
      'server',
      'database',
      'queue',
      'cloud',
    ])
  })

  it('offers a short list of basic shapes, all of them shapes', () => {
    const basics = basicShapes()
    expect(basics.length).toBeGreaterThan(0)
    expect(basics.length).toBeLessThan(kindsInGroup('shape').length)
    basics.forEach((kind) => expect(specFor(kind).group).toBe('shape'))
  })

  it('squares off the shapes that read wrong otherwise', () => {
    expect(specFor('diamond').alwaysSquare).toBe(true)
    expect(specFor('star').alwaysSquare).toBe(true)
    expect(specFor('rectangle').alwaysSquare).toBeUndefined()
  })

  it('gives a frame no fill of its own', () => {
    expect(specFor('frame').noFill).toBe(true)
    expect(specFor('rectangle').noFill).toBeUndefined()
  })

  it('has no label to edit on a freehand stroke', () => {
    expect(hasEditableLabel('freehand')).toBe(false)
    expect(hasEditableLabel('stickyNote')).toBe(true)
  })

  it('every clipped shape declares a polygon', () => {
    ;(['triangle', 'parallelogram', 'hexagon', 'star'] as const).forEach(
      (kind) => expect(specFor(kind).polygon).toContain('polygon('),
    )
  })
})
