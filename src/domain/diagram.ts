export type DiagramNodeKind =
  | 'text'
  | 'rectangle'
  | 'roundedRectangle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'parallelogram'
  | 'cylinder'
  | 'hexagon'
  | 'star'
  | 'stickyNote'
  | 'frame'
  | 'freehand'
  | 'client'
  | 'server'
  | 'database'
  | 'queue'
  | 'cloud'

export type PenKind = 'pen' | 'marker' | 'highlighter'

export interface StrokePoint {
  x: number
  y: number
}

export interface FreehandStroke {
  pen: PenKind
  /**
   * Points normalised to 0–1 within the node's box, so the existing resize
   * handles scale a stroke without the data being touched.
   */
  points: StrokePoint[]
}

export interface DiagramNode {
  id: string
  kind: DiagramNodeKind
  x: number
  y: number
  width: number
  height: number
  label: string
  fillColor: string
  strokeColor: string
  strokeWidth: number
  /** Frames sit behind everything else; omitted means the default layer. */
  zIndex?: number
  /** Only present on `freehand` nodes. */
  freehand?: FreehandStroke
}

/** How an edge is routed between its two endpoints. */
export type EdgeRouting = 'curved' | 'straight' | 'elbow'
export type ArrowHead = 'none' | 'arrow'
export type StrokeStyle = 'solid' | 'dashed' | 'dotted'

export interface DiagramEdge {
  id: string
  /**
   * The node an end is attached to. Absent on a free-standing line, which
   * pins that end to `sourcePoint` / `targetPoint` instead — that is the whole
   * difference between a connector and a line you drew on the board.
   */
  source?: string
  target?: string
  sourceHandle?: string | null
  targetHandle?: string | null
  sourcePoint?: StrokePoint
  targetPoint?: StrokePoint

  /* Every style below is optional so documents written before edges were
     stylable keep loading unchanged; `edgeDefaults` supplies the rest. */
  routing?: EdgeRouting
  startArrow?: ArrowHead
  endArrow?: ArrowHead
  strokeWidth?: number
  strokeStyle?: StrokeStyle
  /** Omitted means "follow the theme" — the one style that is not user data,
   *  so an edge stays visible when the board switches to dark. */
  strokeColor?: string
}

/** Applied wherever an edge leaves a style unset. */
export const edgeDefaults = {
  routing: 'curved',
  startArrow: 'none',
  endArrow: 'arrow',
  strokeWidth: 2,
  strokeStyle: 'solid',
} as const satisfies Partial<DiagramEdge>

/** Bumped when new element kinds landed; v1 documents migrate on load. */
export const DOCUMENT_VERSION = 2

export interface DiagramDocument {
  id: string
  title: string
  version: number
  updatedAt: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export function createBlankDocument(): DiagramDocument {
  return {
    id: 'current-diagram',
    title: 'Untitled diagram',
    version: DOCUMENT_VERSION,
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
  }
}
