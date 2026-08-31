import { describe, expect, it } from 'vitest'
import {
  parseDocument,
  parseDocumentOrBlank,
} from '../src/domain/document-schema'
import { DOCUMENT_VERSION } from '../src/domain/diagram'

const v1Node = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  kind: 'rectangle',
  x: 0,
  y: 0,
  width: 156,
  height: 84,
  label: id,
  fillColor: '#ffffff',
  strokeColor: '#31352f',
  strokeWidth: 2,
  ...overrides,
})

const v1Document = (overrides: Record<string, unknown> = {}) => ({
  id: 'current-diagram',
  title: 'Old board',
  version: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
  nodes: [v1Node('a'), v1Node('b')],
  edges: [{ id: 'e1', source: 'a', target: 'b' }],
  ...overrides,
})

describe('parseDocument', () => {
  it('migrates a v1 document without losing anything', () => {
    const result = parseDocument(v1Document())

    expect(result).not.toBeNull()
    expect(result!.version).toBe(DOCUMENT_VERSION)
    expect(result!.title).toBe('Old board')
    expect(result!.nodes).toHaveLength(2)
    expect(result!.edges).toHaveLength(1)
  })

  it('keeps the styles added since v1', () => {
    const result = parseDocument(
      v1Document({
        version: DOCUMENT_VERSION,
        nodes: [v1Node('a', { zIndex: -1 }), v1Node('b')],
        edges: [
          {
            id: 'e1',
            source: 'a',
            target: 'b',
            routing: 'elbow',
            strokeStyle: 'dashed',
            strokeColor: '#2f4ae6',
            strokeWidth: 5,
          },
        ],
      }),
    )

    expect(result!.nodes[0].zIndex).toBe(-1)
    expect(result!.edges[0]).toMatchObject({
      routing: 'elbow',
      strokeStyle: 'dashed',
      strokeWidth: 5,
    })
  })

  it('keeps a freehand stroke intact', () => {
    const result = parseDocument(
      v1Document({
        nodes: [
          v1Node('s', {
            kind: 'freehand',
            freehand: { pen: 'marker', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
          }),
        ],
        edges: [],
      }),
    )

    expect(result!.nodes[0].freehand).toEqual({
      pen: 'marker',
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    })
  })

  it('drops a node of a kind this build does not know', () => {
    const result = parseDocument(
      v1Document({ nodes: [v1Node('a'), v1Node('x', { kind: 'hologram' })] }),
    )

    expect(result!.nodes.map((node) => node.id)).toEqual(['a'])
  })

  it('drops an edge whose node did not survive', () => {
    const result = parseDocument(
      v1Document({ nodes: [v1Node('a'), v1Node('b', { kind: 'hologram' })] }),
    )

    expect(result!.edges).toHaveLength(0)
  })

  it('drops a malformed node without losing the rest of the board', () => {
    const result = parseDocument(
      v1Document({
        nodes: [v1Node('a'), { id: 'broken', kind: 'rectangle' }],
        edges: [],
      }),
    )

    expect(result!.nodes.map((node) => node.id)).toEqual(['a'])
  })

  it('rejects something that is not a document at all', () => {
    expect(parseDocument(null)).toBeNull()
    expect(parseDocument({ nope: true })).toBeNull()
    expect(parseDocument('a string')).toBeNull()
  })
})

describe('parseDocumentOrBlank', () => {
  it('falls back to an empty board rather than throwing', () => {
    const result = parseDocumentOrBlank({ nope: true })

    expect(result.nodes).toEqual([])
    expect(result.version).toBe(DOCUMENT_VERSION)
  })
})
