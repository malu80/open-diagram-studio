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

  it('duplicates a sticky note as one complete element', () => {
    reset(
      [
        makeNode('sticky', {
          kind: 'stickyNote',
          width: 180,
          height: 180,
          label: 'One useful idea',
          fillColor: '#fff9b1',
          strokeColor: '#2e3442',
        }),
      ],
      [],
      ['sticky'],
    )

    useDiagramStore.getState().duplicateSelected()

    const copy = useDiagramStore.getState().nodes[1]
    expect(copy).toMatchObject({
      kind: 'stickyNote',
      x: 34,
      y: 68,
      width: 180,
      height: 180,
      label: 'One useful idea',
      fillColor: '#fff9b1',
      strokeColor: '#2e3442',
    })
  })

  it('cascades sticky duplicates with exposed edges instead of reusing a stack position', () => {
    reset([makeNode('sticky', { kind: 'stickyNote', x: 100, y: 200, width: 240, height: 120 })], [], ['sticky'])
    const store = useDiagramStore.getState()
    store.duplicateSelected()
    store.duplicateSelected()
    store.setSelection(['sticky'], [])
    store.duplicateSelected()

    const { nodes, selectedNodeIds } = useDiagramStore.getState()
    expect(nodes.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 100, y: 200 },
      { x: 124, y: 248 },
      { x: 148, y: 296 },
      { x: 172, y: 344 },
    ])
    expect(nodes.map((node) => node.zIndex ?? 0)).toEqual([0, 1, 2, 3])
    expect(selectedNodeIds).toEqual([nodes[3].id])
  })

  it('places the new sticky above existing layers while allowing intentional overlap', () => {
    reset([
      makeNode('sticky', { kind: 'stickyNote', x: 100, y: 100, width: 180, height: 180, zIndex: 20 }),
      makeNode('frame', { kind: 'frame', x: 124, y: 148, width: 1000, height: 1000, zIndex: -1 }),
      makeNode('other', { kind: 'stickyNote', x: 110, y: 120, zIndex: 99 }),
    ], [], ['sticky'])

    useDiagramStore.getState().duplicateSelected()

    expect(useDiagramStore.getState().nodes[3]).toMatchObject({ x: 124, y: 148, zIndex: 100 })
  })

  it('keeps a multi-note layout and its connectors together in the offset stack', () => {
    reset([
      makeNode('first', { kind: 'stickyNote', x: 100, y: 100, height: 180 }),
      makeNode('second', { kind: 'stickyNote', x: 320, y: 140, height: 120 }),
    ], [makeEdge('edge', 'first', 'second')], ['first', 'second'])
    const store = useDiagramStore.getState()
    store.clearHistory()
    store.duplicateSelected()

    const { nodes, edges } = useDiagramStore.getState()
    expect(nodes[2]).toMatchObject({ x: 124, y: 148 })
    expect(nodes[3]).toMatchObject({ x: 344, y: 188 })
    expect(edges[1]).toMatchObject({ source: nodes[2].id, target: nodes[3].id })
    store.undo()
    expect(useDiagramStore.getState().nodes).toHaveLength(2)
    store.redo()
    expect(useDiagramStore.getState().nodes).toEqual(nodes)
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

  it('pastes sticky text and styling with the note', () => {
    reset(
      [
        makeNode('sticky', {
          kind: 'stickyNote',
          label: 'Keep me attached',
          fillColor: '#a6e3e3',
        }),
      ],
      [],
      ['sticky'],
    )

    useDiagramStore.getState().copySelected()
    useDiagramStore.getState().pasteClipboard()

    expect(useDiagramStore.getState().nodes[1]).toMatchObject({
      kind: 'stickyNote',
      label: 'Keep me attached',
      fillColor: '#a6e3e3',
    })
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
