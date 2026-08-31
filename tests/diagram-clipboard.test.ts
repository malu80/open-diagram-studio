import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DiagramEdge, DiagramNode } from '../src/domain/diagram'
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
  strokeColor: '#2e3442',
  strokeWidth: 2,
  ...overrides,
})

const makeEdge = (id: string, source: string, target: string): DiagramEdge => ({
  id,
  source,
  target,
})

const reset = (
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  selectedNodeIds: string[] = [],
) =>
  useDiagramStore.setState({
    nodes,
    edges,
    selectedNodeIds,
    selectedEdgeIds: [],
    clipboard: { nodes: [], edges: [] },
    interactionLog: [],
  })

describe('selection commands', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  it('selects every node and edge', () => {
    reset([makeNode('a'), makeNode('b')], [makeEdge('e1', 'a', 'b')])

    useDiagramStore.getState().selectAll()

    expect(useDiagramStore.getState().selectedNodeIds).toEqual(['a', 'b'])
    expect(useDiagramStore.getState().selectedEdgeIds).toEqual(['e1'])
  })

  it('clears the selection', () => {
    reset([makeNode('a')], [], ['a'])

    useDiagramStore.getState().clearSelection()

    expect(useDiagramStore.getState().selectedNodeIds).toEqual([])
    expect(useDiagramStore.getState().selectedEdgeIds).toEqual([])
  })

  it('leaves state untouched when there is nothing to clear', () => {
    reset([makeNode('a')], [])
    const before = useDiagramStore.getState()

    useDiagramStore.getState().clearSelection()

    expect(useDiagramStore.getState()).toBe(before)
  })
})

describe('duplicate', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  it('offsets the copy and selects it', () => {
    reset([makeNode('a', { x: 100, y: 200 })], [], ['a'])

    useDiagramStore.getState().duplicateSelected()

    const { nodes, selectedNodeIds } = useDiagramStore.getState()
    expect(nodes).toHaveLength(2)
    const copy = nodes[1]
    expect(copy.id).not.toBe('a')
    expect(copy.x).toBe(124)
    expect(copy.y).toBe(224)
    expect(selectedNodeIds).toEqual([copy.id])
  })

  it('carries over an edge whose two ends are both copied', () => {
    reset(
      [makeNode('a'), makeNode('b')],
      [makeEdge('e1', 'a', 'b')],
      ['a', 'b'],
    )

    useDiagramStore.getState().duplicateSelected()

    const { nodes, edges } = useDiagramStore.getState()
    expect(edges).toHaveLength(2)
    const copiedEdge = edges[1]
    expect(copiedEdge.id).not.toBe('e1')
    expect(copiedEdge.source).toBe(nodes[2].id)
    expect(copiedEdge.target).toBe(nodes[3].id)
  })

  it('drops an edge that leaves the selection', () => {
    reset([makeNode('a'), makeNode('b')], [makeEdge('e1', 'a', 'b')], ['a'])

    useDiagramStore.getState().duplicateSelected()

    expect(useDiagramStore.getState().edges).toHaveLength(1)
  })

  it('does nothing with an empty selection', () => {
    reset([makeNode('a')], [])
    const before = useDiagramStore.getState()

    useDiagramStore.getState().duplicateSelected()

    expect(useDiagramStore.getState()).toBe(before)
  })
})

describe('copy and paste', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  it('pastes an offset copy of what was copied', () => {
    reset([makeNode('a', { x: 0, y: 0 })], [], ['a'])

    useDiagramStore.getState().copySelected()
    useDiagramStore.getState().pasteClipboard()

    const { nodes, selectedNodeIds } = useDiagramStore.getState()
    expect(nodes).toHaveLength(2)
    expect(nodes[1].x).toBe(24)
    expect(selectedNodeIds).toEqual([nodes[1].id])
  })

  it('cascades repeated pastes instead of stacking them', () => {
    reset([makeNode('a', { x: 0, y: 0 })], [], ['a'])

    const store = useDiagramStore.getState()
    store.copySelected()
    store.pasteClipboard()
    store.pasteClipboard()

    const xs = useDiagramStore.getState().nodes.map((node) => node.x)
    expect(xs).toEqual([0, 24, 48])
  })

  it('copies nothing when nothing is selected', () => {
    reset([makeNode('a')], [])

    useDiagramStore.getState().copySelected()

    expect(useDiagramStore.getState().clipboard.nodes).toHaveLength(0)
  })

  it('pastes nothing from an empty clipboard', () => {
    reset([makeNode('a')], [])
    const before = useDiagramStore.getState()

    useDiagramStore.getState().pasteClipboard()

    expect(useDiagramStore.getState()).toBe(before)
  })
})

describe('edge styling', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  it('applies a patch to every selected edge only', () => {
    reset([makeNode('a'), makeNode('b')], [
      makeEdge('e1', 'a', 'b'),
      makeEdge('e2', 'b', 'a'),
    ])
    useDiagramStore.setState({ selectedEdgeIds: ['e1'] })

    useDiagramStore.getState().updateSelectedEdge({
      routing: 'elbow',
      strokeWidth: 4,
    })

    const [first, second] = useDiagramStore.getState().edges
    expect(first).toMatchObject({ routing: 'elbow', strokeWidth: 4 })
    expect(second.routing).toBeUndefined()
    expect(second.strokeWidth).toBeUndefined()
  })

  it('clears a colour back to the theme default', () => {
    reset([makeNode('a'), makeNode('b')], [makeEdge('e1', 'a', 'b')])
    useDiagramStore.setState({ selectedEdgeIds: ['e1'] })

    useDiagramStore.getState().updateSelectedEdge({ strokeColor: '#2f4ae6' })
    expect(useDiagramStore.getState().edges[0].strokeColor).toBe('#2f4ae6')

    useDiagramStore.getState().updateSelectedEdge({ strokeColor: undefined })
    expect(useDiagramStore.getState().edges[0].strokeColor).toBeUndefined()
  })
})
