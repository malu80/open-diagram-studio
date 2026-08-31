import {
  Box,
  Circle,
  Cloud,
  Database,
  Diamond,
  Hexagon,
  Highlighter,
  Monitor,
  MousePointer2,
  Pencil,
  PenTool,
  RectangleHorizontal,
  Server,
  Shapes,
  SquareDashed,
  Star,
  StickyNote,
  Triangle,
  Type,
  Waypoints,
  Eraser,
  Cylinder,
  Spline,
  Frame,
  Layers,
  Network,
  Slash,
  MoveUpRight,
  type LucideIcon,
} from 'lucide-react'
import type { DiagramNodeKind } from '../../domain/diagram'
import type { PenType } from '../../stores/tool-store'

/** Icon for every node kind, used by the rail, the flyouts and the library. */
export const kindIcons: Record<DiagramNodeKind, LucideIcon> = {
  text: Type,
  rectangle: RectangleHorizontal,
  roundedRectangle: Box,
  ellipse: Circle,
  diamond: Diamond,
  triangle: Triangle,
  parallelogram: Spline,
  cylinder: Cylinder,
  hexagon: Hexagon,
  star: Star,
  stickyNote: StickyNote,
  frame: SquareDashed,
  freehand: Pencil,
  client: Monitor,
  server: Server,
  database: Database,
  queue: Layers,
  cloud: Cloud,
}

export const penIcons: Record<PenType, LucideIcon> = {
  pen: Pencil,
  marker: PenTool,
  highlighter: Highlighter,
  eraser: Eraser,
}

export const penLabels: Record<PenType, string> = {
  pen: 'Pen',
  marker: 'Marker',
  highlighter: 'Highlighter',
  eraser: 'Eraser',
}

/**
 * Rail icons.
 *
 * Each one is a stable picture of what the group *is*, not of whichever member
 * you used last: the group's members already show their own state inside the
 * flyout, and a button whose picture changes is a button you cannot learn.
 */
export const groupIcons = {
  select: MousePointer2,
  // A circle, square and triangle together — reads as "shapes", not "a shape".
  shapes: Shapes,
  // A plain diagonal line; the arrow variant swaps in MoveUpRight.
  line: Slash,
  lineArrow: MoveUpRight,
  // Nodes joined by a path, which is what a connector does.
  connector: Waypoints,
  sticky: StickyNote,
  frame: Frame,
  text: Type,
  pen: Pencil,
  // A node graph, distinct from the Server icon one of its members uses.
  architecture: Network,
} as const
