import type { DiagramNodeKind } from './diagram'

/** Which part of the toolbar a kind belongs to. */
export type NodeGroup = 'shape' | 'architecture' | 'standalone'

export interface NodeKindSpec {
  group: NodeGroup
  /** Shown in the flyout without opening the full library. */
  basic?: boolean
  /** Label a freshly created node starts with. Empty means "type here". */
  label: string
  width: number
  height: number
  /** Squared off even without Shift — a diamond or a star reads wrong otherwise. */
  alwaysSquare?: boolean
  /** Overrides the default white fill. */
  fill?: string
  /** Frames sit behind everything else. */
  zIndex?: number
  /** No border of its own — the stroke colour means something else. */
  outlineOnly?: boolean
  /** No fill either. A frame is a boundary, not a surface. */
  noFill?: boolean
  /**
   * A CSS `clip-path` for shapes a box cannot make. Clipping also cuts the
   * border off, so these render as a stroke-coloured plate with an inset
   * fill on top rather than using a real CSS border.
   */
  polygon?: string
}

const architecture = (label: string): NodeKindSpec => ({
  group: 'architecture',
  label,
  width: 156,
  height: 84,
})

/**
 * Everything that differs between node kinds, in one table.
 *
 * Keeping it here rather than in the store means the drawing tools, the
 * toolbar and the shape library all describe a kind the same way.
 */
export const nodeKindSpecs: Record<DiagramNodeKind, NodeKindSpec> = {
  text: {
    group: 'standalone',
    label: '',
    width: 200,
    height: 40,
    outlineOnly: true,
  },
  rectangle: {
    group: 'shape',
    basic: true,
    label: 'Rectangle',
    width: 156,
    height: 84,
  },
  roundedRectangle: {
    group: 'shape',
    basic: true,
    label: 'Rounded rectangle',
    width: 156,
    height: 84,
  },
  ellipse: {
    group: 'shape',
    basic: true,
    label: 'Ellipse',
    width: 156,
    height: 84,
  },
  diamond: {
    group: 'shape',
    basic: true,
    label: 'Decision',
    width: 120,
    height: 120,
    alwaysSquare: true,
  },
  triangle: {
    group: 'shape',
    label: 'Triangle',
    width: 130,
    height: 110,
    polygon: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  },
  parallelogram: {
    group: 'shape',
    label: 'Process',
    width: 170,
    height: 84,
    polygon: 'polygon(18% 0%, 100% 0%, 82% 100%, 0% 100%)',
  },
  // A barrel, which a real CSS border can draw — no clipping needed.
  cylinder: { group: 'shape', label: 'Store', width: 130, height: 120 },
  hexagon: {
    group: 'shape',
    label: 'Hexagon',
    width: 150,
    height: 90,
    polygon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  },
  star: {
    group: 'shape',
    label: 'Star',
    width: 120,
    height: 120,
    alwaysSquare: true,
    polygon:
      'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  },
  stickyNote: {
    group: 'standalone',
    label: '',
    width: 180,
    height: 180,
    fill: '#fbeecb',
  },
  frame: {
    group: 'standalone',
    label: 'Frame',
    width: 520,
    height: 340,
    zIndex: -1,
    outlineOnly: true,
    noFill: true,
  },
  freehand: {
    group: 'standalone',
    label: '',
    width: 120,
    height: 120,
    outlineOnly: true,
  },
  client: architecture('Client'),
  server: architecture('Server'),
  database: architecture('Database'),
  queue: architecture('Queue'),
  cloud: architecture('Cloud'),
}

const allKinds = Object.keys(nodeKindSpecs) as DiagramNodeKind[]

/** Every kind in a toolbar group, in table order. */
export function kindsInGroup(group: NodeGroup): DiagramNodeKind[] {
  return allKinds.filter((kind) => nodeKindSpecs[kind].group === group)
}

/** The handful of shapes the flyout shows before you open the library. */
export function basicShapes(): DiagramNodeKind[] {
  return allKinds.filter((kind) => nodeKindSpecs[kind].basic === true)
}

export function specFor(kind: DiagramNodeKind): NodeKindSpec {
  return nodeKindSpecs[kind]
}

/** Kinds that carry a text label the user can edit in place. */
export function hasEditableLabel(kind: DiagramNodeKind): boolean {
  return kind !== 'freehand'
}
