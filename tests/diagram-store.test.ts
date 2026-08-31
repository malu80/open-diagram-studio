import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DiagramDocument, DiagramNode } from '../src/domain/diagram'
import { useDiagramStore } from '../src/stores/diagram-store'

const makeNode = (
  id: string,
  overrides: Partial<DiagramNode> = {},
): DiagramNode => ({
  id,
  kind: 'rectangle',
  x: 10,
  y: 20,
  width: 156,
  height: 84,
  label: id,
  fillColor: '#ffffff',
  strokeColor: '#31352f',
  strokeWidth: 2,
  ...overrides,
})

describe('diagram store', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    useDiagramStore.setState({
      title: 'Untitled diagram',
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      interactionLog: [],
      hydrated: true,
      saveState: 'saved',
    })
  })

  it('draws a selected node and commits its resized dimensions', () => {
    useDiagramStore.getState().drawNode('rectangle', 40, 60, 156, 84)

    const created = useDiagramStore.getState().nodes[0]
    expect(created).toMatchObject({
      kind: 'rectangle',
      x: 40,
      y: 60,
      width: 156,
      height: 84,
      label: 'Rectangle',
    })
    expect(useDiagramStore.getState().selectedNodeIds).toEqual([created.id])

    useDiagramStore.getState().onNodesChange([
      {
        id: created.id,
        type: 'dimensions',
        dimensions: { width: 256, height: 134 },
        setAttributes: true,
      },
    ])

    expect(useDiagramStore.getState().nodes[0]).toMatchObject({
      width: 256,
      height: 134,
    })
  })

  it('ignores passive measurements that should not change controlled dimensions', () => {
    useDiagramStore.getState().drawNode('rectangle', 40, 60, 156, 84)
    const created = useDiagramStore.getState().nodes[0]

    useDiagramStore.getState().onNodesChange([
      {
        id: created.id,
        type: 'dimensions',
        dimensions: { width: 300, height: 200 },
        setAttributes: false,
      },
    ])

    expect(useDiagramStore.getState().nodes[0]).toMatchObject({
      width: 156,
      height: 84,
    })
  })

  it('uses shape-specific defaults when adding nodes', () => {
    useDiagramStore.getState().addNode('text')
    useDiagramStore.getState().addNode('diamond')

    const [text, diamond] = useDiagramStore.getState().nodes
    expect(text).toMatchObject({
      kind: 'text',
      label: '',
      width: 200,
      height: 40,
    })
    expect(diamond).toMatchObject({
      kind: 'diamond',
      label: 'Decision',
      width: 120,
      height: 120,
    })
    expect(useDiagramStore.getState().selectedNodeIds).toEqual([diamond.id])
  })

  it('removes blank text and orphaned arrows while hydrating', () => {
    const document: DiagramDocument = {
      id: 'current-diagram',
      title: 'Recovered diagram',
      version: 1,
      updatedAt: '2026-08-29T00:00:00.000Z',
      nodes: [
        makeNode('shape'),
        makeNode('blank', { kind: 'text', label: '   ' }),
      ],
      edges: [
        { id: 'orphan', source: 'shape', target: 'blank' },
      ],
    }

    useDiagramStore.getState().hydrate(document)

    expect(useDiagramStore.getState()).toMatchObject({
      title: 'Recovered diagram',
      nodes: [expect.objectContaining({ id: 'shape' })],
      edges: [],
      hydrated: true,
      saveState: 'saved',
    })
  })

  it('moves every selected node and leaves other nodes unchanged', () => {
    useDiagramStore.setState({
      nodes: [makeNode('first'), makeNode('second'), makeNode('other')],
      selectedNodeIds: ['first', 'second'],
    })

    useDiagramStore.getState().moveSelected(10, -5)

    expect(useDiagramStore.getState().nodes).toEqual([
      expect.objectContaining({ id: 'first', x: 20, y: 15 }),
      expect.objectContaining({ id: 'second', x: 20, y: 15 }),
      expect.objectContaining({ id: 'other', x: 10, y: 20 }),
    ])
  })

  it('propagates a React Flow drag delta to the rest of a selected group', () => {
    useDiagramStore.setState({
      nodes: [makeNode('first'), makeNode('second'), makeNode('other')],
      selectedNodeIds: ['first', 'second'],
    })

    useDiagramStore.getState().onNodesChange([
      {
        id: 'first',
        type: 'position',
        position: { x: 35, y: 50 },
        dragging: true,
      },
    ])

    expect(useDiagramStore.getState().nodes).toEqual([
      expect.objectContaining({ id: 'first', x: 35, y: 50 }),
      expect.objectContaining({ id: 'second', x: 35, y: 50 }),
      expect.objectContaining({ id: 'other', x: 10, y: 20 }),
    ])
  })

  it('normalizes handles for a drag-created arrow', () => {
    useDiagramStore.setState({
      nodes: [makeNode('source'), makeNode('target')],
    })

    useDiagramStore.getState().connect({
      source: 'source',
      target: 'target',
      sourceHandle: 'source-bottom',
      targetHandle: 'target-top',
    })

    expect(useDiagramStore.getState().edges[0]).toMatchObject({
      source: 'source',
      target: 'target',
      sourceHandle: 'bottom',
      targetHandle: 'top',
    })
  })

  it('rejects an incomplete arrow without changing existing edges', () => {
    useDiagramStore.getState().connect({
      source: null,
      target: 'target',
      sourceHandle: null,
      targetHandle: null,
    })

    const state = useDiagramStore.getState()
    expect(state.edges).toEqual([])
    expect(state.interactionLog.at(-1)?.message).toContain('Arrow rejected')
  })

  it('deletes selected nodes and their connected arrows', () => {
    useDiagramStore.setState({
      nodes: [makeNode('source'), makeNode('target')],
      edges: [{ id: 'edge', source: 'source', target: 'target' }],
      selectedNodeIds: ['source'],
      selectedEdgeIds: [],
    })

    useDiagramStore.getState().deleteSelected()

    expect(useDiagramStore.getState()).toMatchObject({
      nodes: [expect.objectContaining({ id: 'target' })],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
    })
  })

  it('removes an empty text node and its attached arrows', () => {
    useDiagramStore.setState({
      nodes: [
        makeNode('text', { kind: 'text', label: '' }),
        makeNode('shape'),
      ],
      edges: [{ id: 'edge', source: 'text', target: 'shape' }],
      selectedNodeIds: ['text'],
    })

    useDiagramStore.getState().removeNode('text')

    expect(useDiagramStore.getState()).toMatchObject({
      nodes: [expect.objectContaining({ id: 'shape' })],
      edges: [],
      selectedNodeIds: [],
    })
  })

  it('updates text content and its auto-sized bounds', () => {
    useDiagramStore.setState({
      nodes: [makeNode('text', { kind: 'text', label: '' })],
    })

    useDiagramStore.getState().updateNodeLabel('text', 'API Gateway')
    useDiagramStore.getState().resizeTextNode('text', 130, 40)

    expect(useDiagramStore.getState().nodes[0]).toMatchObject({
      label: 'API Gateway',
      width: 130,
      height: 40,
    })
  })

  it('updates the appearance of every selected node', () => {
    useDiagramStore.setState({
      nodes: [makeNode('first'), makeNode('second'), makeNode('other')],
      selectedNodeIds: ['first', 'second'],
    })

    useDiagramStore.getState().updateSelectedNode({
      fillColor: '#eef2ff',
      strokeWidth: 4,
    })

    const [first, second, other] = useDiagramStore.getState().nodes
    expect(first).toMatchObject({ fillColor: '#eef2ff', strokeWidth: 4 })
    expect(second).toMatchObject({ fillColor: '#eef2ff', strokeWidth: 4 })
    expect(other).toMatchObject({ fillColor: '#ffffff', strokeWidth: 2 })
  })

  it('keeps only the twelve newest activity entries and can clear them', () => {
    for (let index = 1; index <= 14; index += 1) {
      useDiagramStore.getState().logInteraction(`Event ${index}`)
    }

    expect(useDiagramStore.getState().interactionLog).toHaveLength(12)
    expect(useDiagramStore.getState().interactionLog[0].message).toBe('Event 3')

    useDiagramStore.getState().clearInteractionLog()
    expect(useDiagramStore.getState().interactionLog).toEqual([])
  })

})
