import {
  applyNodeChanges,
  type Connection,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import { nodeDefaults } from '../design-system/tokens'
import { specFor } from '../domain/node-kinds'
import {
  createBlankDocument,
  type FreehandStroke,
  type StrokePoint,
  type DiagramDocument,
  type DiagramEdge,
  type DiagramNode,
  type DiagramNodeKind,
} from '../domain/diagram'

export interface DiagramNodeData extends Record<string, unknown> {
  kind: DiagramNodeKind
  label: string
  fillColor: string
  strokeColor: string
  strokeWidth: number
  width: number
  height: number
  freehand?: FreehandStroke
}

export type FlowDiagramNode = Node<DiagramNodeData, 'diagramNode'>
type SaveState = 'loading' | 'saving' | 'saved' | 'error'
type InteractionLog = { id: string; time: string; message: string }

interface DiagramState {
  title: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  interactionLog: InteractionLog[]
  /** In-app clipboard. Deliberately not the system clipboard: reading that
   *  needs a permission prompt, and copying between boards is not a goal. */
  clipboard: { nodes: DiagramNode[]; edges: DiagramEdge[] }
  hydrated: boolean
  saveState: SaveState
  hydrate: (document: DiagramDocument | null) => void
  setSaveState: (saveState: SaveState) => void
  setTitle: (title: string) => void
  addNode: (kind: DiagramNodeKind) => void
  drawNode: (
    kind: DiagramNodeKind,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void
  /** A line drawn on the board, with either end optionally on a node. */
  addLine: (line: {
    from: StrokePoint
    to: StrokePoint
    fromNodeId?: string
    toNodeId?: string
    routing: NonNullable<DiagramEdge['routing']>
    endArrow: NonNullable<DiagramEdge['endArrow']>
  }) => void
  addFreehandNode: (stroke: {
    pen: FreehandStroke['pen']
    points: FreehandStroke['points']
    x: number
    y: number
    width: number
    height: number
    color: string
    strokeWidth: number
  }) => void
  /** Removes the freehand strokes the eraser passed over. */
  eraseNodes: (nodeIds: string[]) => void
  onNodesChange: (changes: NodeChange<FlowDiagramNode>[]) => void
  connect: (connection: Connection) => void
  logInteraction: (message: string) => void
  clearInteractionLog: () => void
  setSelection: (nodeIds: string[], edgeIds: string[]) => void
  selectAll: () => void
  clearSelection: () => void
  moveSelected: (deltaX: number, deltaY: number) => void
  deleteSelected: () => void
  duplicateSelected: () => void
  copySelected: () => void
  pasteClipboard: () => void
  removeNode: (nodeId: string) => void
  updateNodeLabel: (nodeId: string, label: string) => void
  resizeTextNode: (nodeId: string, width: number, height: number) => void
  updateSelectedEdge: (
    patch: Partial<
      Pick<
        DiagramEdge,
        | 'routing'
        | 'startArrow'
        | 'endArrow'
        | 'strokeColor'
        | 'strokeWidth'
        | 'strokeStyle'
      >
    >,
  ) => void
  updateSelectedNode: (
    patch: Partial<
      Pick<
        DiagramNode,
        | 'label'
        | 'fillColor'
        | 'strokeColor'
        | 'strokeWidth'
        | 'x'
        | 'y'
        | 'width'
        | 'height'
      >
    >,
  ) => void
}

const initialDocument = createBlankDocument()
const appendInteraction = (
  entries: InteractionLog[],
  message: string,
): InteractionLog[] => {
  const entry = {
    id: crypto.randomUUID(),
    time: new Date().toLocaleTimeString(),
    message,
  }
  console.info(`[Diagram Studio] ${entry.time} ${message}`)
  return [...entries, entry].slice(-12)
}
/** How far a duplicate or paste lands from its source. */
const PASTE_OFFSET = 24

/**
 * Clones nodes with fresh ids, plus any edge whose two ends are both in the
 * selection — an edge to something that was not copied has nothing to attach
 * to on the other side.
 */
const offsetPoint = (point: StrokePoint | undefined, offset: number) =>
  point ? { x: point.x + offset, y: point.y + offset } : undefined

const cloneSelection = (
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  offset: number,
): { nodes: DiagramNode[]; edges: DiagramEdge[] } => {
  const idByOriginal = new Map<string, string>()
  const clonedNodes = nodes.map((node) => {
    const id = crypto.randomUUID()
    idByOriginal.set(node.id, id)
    return { ...node, id, x: node.x + offset, y: node.y + offset }
  })
  const attachedEndSurvives = (end: string | undefined) =>
    end === undefined || idByOriginal.has(end)
  const clonedEdges = edges
    .filter(
      (edge) =>
        attachedEndSurvives(edge.source) && attachedEndSurvives(edge.target),
    )
    .map((edge) => ({
      ...edge,
      id: crypto.randomUUID(),
      source: edge.source ? idByOriginal.get(edge.source) : undefined,
      target: edge.target ? idByOriginal.get(edge.target) : undefined,
      sourcePoint: offsetPoint(edge.sourcePoint, offset),
      targetPoint: offsetPoint(edge.targetPoint, offset),
    }))
  return { nodes: clonedNodes, edges: clonedEdges }
}

const createNode = (
  kind: DiagramNodeKind,
  index: number,
  bounds?: { x: number; y: number; width: number; height: number },
): DiagramNode => {
  const spec = specFor(kind)
  return {
    id: crypto.randomUUID(),
    kind,
    x: bounds?.x ?? 120 + (index % 4) * 36,
    y: bounds?.y ?? 100 + (index % 5) * 34,
    width: bounds?.width ?? spec.width,
    height: bounds?.height ?? spec.height,
    label: spec.label,
    ...nodeDefaults,
    ...(spec.fill ? { fillColor: spec.fill } : {}),
    ...(spec.zIndex !== undefined ? { zIndex: spec.zIndex } : {}),
  }
}

export const toFlowNode = (
  node: DiagramNode,
  selectedNodeIds: string[],
): FlowDiagramNode => ({
  id: node.id,
  type: 'diagramNode',
  position: { x: node.x, y: node.y },
  style: { width: node.width, height: node.height },
  measured: { width: node.width, height: node.height },
  selected: selectedNodeIds.includes(node.id),
  // Frames carry a negative z so they sit behind the nodes they group.
  zIndex: node.zIndex,
  data: {
    kind: node.kind,
    label: node.label,
    fillColor: node.fillColor,
    strokeColor: node.strokeColor,
    strokeWidth: node.strokeWidth,
    // A freehand stroke is drawn from normalised points, so it needs the box
    // it is being drawn into.
    width: node.width,
    height: node.height,
    freehand: node.freehand,
  },
})

export const useDiagramStore = create<DiagramState>((set, get) => ({
  title: initialDocument.title,
  nodes: initialDocument.nodes,
  edges: initialDocument.edges,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  interactionLog: [],
  clipboard: { nodes: [], edges: [] },
  hydrated: false,
  saveState: 'loading',

  hydrate: (document) => {
    const nextDocument = document ?? createBlankDocument()
    const nodes = nextDocument.nodes.filter(
      (node) => node.kind !== 'text' || node.label.trim(),
    )
    const nodeIds = new Set(nodes.map((node) => node.id))
    set({
      title: nextDocument.title,
      nodes,
      // An attached end must still have its node; a pinned end always stands.
      edges: nextDocument.edges.filter(
        (edge) =>
          (edge.source === undefined || nodeIds.has(edge.source)) &&
          (edge.target === undefined || nodeIds.has(edge.target)),
      ),
      hydrated: true,
      saveState: 'saved',
    })
  },
  setSaveState: (saveState) => set({ saveState }),
  setTitle: (title) => set({ title }),
  addNode: (kind) =>
    set((state) => {
      const node = createNode(kind, state.nodes.length)
      return {
        nodes: [...state.nodes, node],
        selectedNodeIds: [node.id],
        selectedEdgeIds: [],
      }
    }),
  drawNode: (kind, x, y, width, height) =>
    set((state) => {
      const node = createNode(kind, state.nodes.length, {
        x,
        y,
        width,
        height,
      })
      return {
        nodes: [...state.nodes, node],
        selectedNodeIds: [node.id],
        selectedEdgeIds: [],
      }
    }),
  addLine: (line) =>
    set((state) => {
      const id = crypto.randomUUID()
      const edge: DiagramEdge = {
        id,
        routing: line.routing,
        endArrow: line.endArrow,
        // An end dropped on a node attaches to it; otherwise it stays put.
        source: line.fromNodeId,
        target: line.toNodeId,
        sourcePoint: line.fromNodeId ? undefined : line.from,
        targetPoint: line.toNodeId ? undefined : line.to,
      }
      return {
        edges: [...state.edges, edge],
        selectedNodeIds: [],
        selectedEdgeIds: [id],
        interactionLog: appendInteraction(state.interactionLog, 'Line drawn'),
      }
    }),
  addFreehandNode: (stroke) =>
    set((state) => {
      const node: DiagramNode = {
        id: crypto.randomUUID(),
        kind: 'freehand',
        x: stroke.x,
        y: stroke.y,
        width: stroke.width,
        height: stroke.height,
        label: '',
        fillColor: 'transparent',
        strokeColor: stroke.color,
        strokeWidth: stroke.strokeWidth,
        freehand: { pen: stroke.pen, points: stroke.points },
      }
      return {
        nodes: [...state.nodes, node],
        interactionLog: appendInteraction(
          state.interactionLog,
          `Drew a ${stroke.pen} stroke`,
        ),
      }
    }),
  eraseNodes: (nodeIds) =>
    set((state) => {
      const removed = new Set(nodeIds)
      if (removed.size === 0) return state
      const nodes = state.nodes.filter((node) => !removed.has(node.id))
      if (nodes.length === state.nodes.length) return state
      return {
        nodes,
        selectedNodeIds: state.selectedNodeIds.filter((id) => !removed.has(id)),
        interactionLog: appendInteraction(
          state.interactionLog,
          `Erased ${state.nodes.length - nodes.length} stroke(s)`,
        ),
      }
    }),
  onNodesChange: (changes) =>
    set((state) => {
      const meaningfulChanges = changes.filter(
        (change) => change.type !== 'dimensions' || change.setAttributes,
      )
      if (meaningfulChanges.length === 0) return state
      const flowNodes = state.nodes.map((node) =>
        toFlowNode(node, state.selectedNodeIds),
      )
      const nextFlowNodes = applyNodeChanges(meaningfulChanges, flowNodes)
      const nodeById = new Map(state.nodes.map((node) => [node.id, node]))
      const dimensionsById = new Map<string, { width: number; height: number }>()
      meaningfulChanges.forEach((change) => {
        if (change.type === 'dimensions' && change.dimensions) {
          dimensionsById.set(change.id, change.dimensions)
        }
      })
      let nodes = nextFlowNodes.map((flowNode) => {
        const previous = nodeById.get(flowNode.id)!
        const dimensions = dimensionsById.get(flowNode.id)
        return {
          ...previous,
          x: flowNode.position.x,
          y: flowNode.position.y,
          width: dimensions?.width ?? flowNode.width ?? previous.width,
          height: dimensions?.height ?? flowNode.height ?? previous.height,
        }
      })
      const movedSelectedNodes = meaningfulChanges.filter(
        (change) =>
          change.type === 'position' &&
          state.selectedNodeIds.includes(change.id),
      )
      if (state.selectedNodeIds.length > 1 && movedSelectedNodes.length === 1) {
        const movedChange = movedSelectedNodes[0]
        if (movedChange.type !== 'position') return { nodes }
        const movedId = movedChange.id
        const previous = nodeById.get(movedId)
        const moved = nodes.find((node) => node.id === movedId)
        if (previous && moved) {
          const deltaX = moved.x - previous.x
          const deltaY = moved.y - previous.y
          nodes = nodes.map((node) =>
            node.id !== movedId && state.selectedNodeIds.includes(node.id)
              ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
              : node,
          )
        }
      }
      const remainingIds = new Set(nodes.map((node) => node.id))
      return {
        nodes,
        edges: state.edges.filter(
          (edge) =>
            (edge.source === undefined || remainingIds.has(edge.source)) &&
            (edge.target === undefined || remainingIds.has(edge.target)),
        ),
        selectedNodeIds: nextFlowNodes
          .filter((node) => node.selected)
          .map((node) => node.id),
      }
    }),
  connect: (connection) => {
    if (!connection.source || !connection.target) {
      set((state) => ({
        interactionLog: appendInteraction(
          state.interactionLog,
          'Arrow rejected: source or target connector is missing',
        ),
      }))
      return
    }
    set((state) => {
      const id = crypto.randomUUID()
      const sourceLabel =
        state.nodes.find((node) => node.id === connection.source)?.label ??
        connection.source
      const targetLabel =
        state.nodes.find((node) => node.id === connection.target)?.label ??
        connection.target
      return {
        edges: [
          ...state.edges,
          {
            id,
            source: connection.source!,
            target: connection.target!,
            sourceHandle:
              connection.sourceHandle?.replace(/^(source|target)-/, '') ??
              'right',
            targetHandle:
              connection.targetHandle?.replace(/^(source|target)-/, '') ??
              'left',
          },
        ],
        selectedNodeIds: [],
        selectedEdgeIds: [id],
        interactionLog: appendInteraction(
          state.interactionLog,
          `Arrow created by drag: ${sourceLabel} -> ${targetLabel}`,
        ),
      }
    })
  },
  logInteraction: (message) =>
    set((state) => ({
      interactionLog: appendInteraction(state.interactionLog, message),
    })),
  clearInteractionLog: () => set({ interactionLog: [] }),
  setSelection: (selectedNodeIds, selectedEdgeIds) =>
    set((state) => {
      const nodesUnchanged =
        state.selectedNodeIds.length === selectedNodeIds.length &&
        state.selectedNodeIds.every((id, index) => id === selectedNodeIds[index])
      const edgesUnchanged =
        state.selectedEdgeIds.length === selectedEdgeIds.length &&
        state.selectedEdgeIds.every((id, index) => id === selectedEdgeIds[index])
      return nodesUnchanged && edgesUnchanged
        ? state
        : { selectedNodeIds, selectedEdgeIds }
    }),
  selectAll: () =>
    set((state) => ({
      selectedNodeIds: state.nodes.map((node) => node.id),
      selectedEdgeIds: state.edges.map((edge) => edge.id),
      interactionLog: appendInteraction(
        state.interactionLog,
        `Selected all ${state.nodes.length} node(s)`,
      ),
    })),
  clearSelection: () =>
    set((state) =>
      state.selectedNodeIds.length === 0 && state.selectedEdgeIds.length === 0
        ? state
        : { selectedNodeIds: [], selectedEdgeIds: [] },
    ),
  duplicateSelected: () =>
    set((state) => {
      const sourceNodes = state.nodes.filter((node) =>
        state.selectedNodeIds.includes(node.id),
      )
      if (sourceNodes.length === 0) return state
      const copy = cloneSelection(sourceNodes, state.edges, PASTE_OFFSET)
      return {
        nodes: [...state.nodes, ...copy.nodes],
        edges: [...state.edges, ...copy.edges],
        selectedNodeIds: copy.nodes.map((node) => node.id),
        selectedEdgeIds: [],
        interactionLog: appendInteraction(
          state.interactionLog,
          `Duplicated ${copy.nodes.length} node(s)`,
        ),
      }
    }),
  copySelected: () =>
    set((state) => {
      const nodes = state.nodes.filter((node) =>
        state.selectedNodeIds.includes(node.id),
      )
      if (nodes.length === 0) return state
      const nodeIds = new Set(nodes.map((node) => node.id))
      return {
        clipboard: {
          nodes,
          // Only edges wholly inside the copy: an edge to something that was
          // not copied has nothing to attach to on the other side.
          edges: state.edges.filter(
            (edge) =>
              edge.source !== undefined &&
              edge.target !== undefined &&
              nodeIds.has(edge.source) &&
              nodeIds.has(edge.target),
          ),
        },
        interactionLog: appendInteraction(
          state.interactionLog,
          `Copied ${nodes.length} node(s)`,
        ),
      }
    }),
  pasteClipboard: () =>
    set((state) => {
      if (state.clipboard.nodes.length === 0) return state
      const copy = cloneSelection(
        state.clipboard.nodes,
        state.clipboard.edges,
        PASTE_OFFSET,
      )
      return {
        nodes: [...state.nodes, ...copy.nodes],
        edges: [...state.edges, ...copy.edges],
        selectedNodeIds: copy.nodes.map((node) => node.id),
        selectedEdgeIds: [],
        // Repeated pastes cascade instead of stacking on one spot.
        clipboard: copy,
        interactionLog: appendInteraction(
          state.interactionLog,
          `Pasted ${copy.nodes.length} node(s)`,
        ),
      }
    }),
  moveSelected: (deltaX, deltaY) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        state.selectedNodeIds.includes(node.id)
          ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
          : node,
      ),
    })),
  deleteSelected: () => {
    const { selectedNodeIds, selectedEdgeIds } = get()
    const removedNodes = new Set(selectedNodeIds)
    set((state) => ({
      nodes: state.nodes.filter((node) => !removedNodes.has(node.id)),
      edges: state.edges.filter(
        (edge) =>
          !selectedEdgeIds.includes(edge.id) &&
          !(edge.source !== undefined && removedNodes.has(edge.source)) &&
          !(edge.target !== undefined && removedNodes.has(edge.target)),
      ),
      selectedNodeIds: [],
      selectedEdgeIds: [],
      interactionLog: appendInteraction(
        state.interactionLog,
        `Deleted ${selectedNodeIds.length} node(s) and ${selectedEdgeIds.length} arrow(s)`,
      ),
    }))
  },
  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
      selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
      interactionLog: appendInteraction(
        state.interactionLog,
        'Empty text box discarded',
      ),
    })),
  updateNodeLabel: (nodeId, label) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, label } : node,
      ),
    })),
  resizeTextNode: (nodeId, width, height) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, width, height } : node,
      ),
    })),
  updateSelectedEdge: (patch) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        state.selectedEdgeIds.includes(edge.id) ? { ...edge, ...patch } : edge,
      ),
    })),
  updateSelectedNode: (patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        state.selectedNodeIds.includes(node.id) ? { ...node, ...patch } : node,
      ),
    })),
}))
