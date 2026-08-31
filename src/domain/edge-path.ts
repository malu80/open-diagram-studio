import type { DiagramEdge, DiagramNode, StrokePoint } from './diagram'

/** A connection point plus the direction the line leaves the shape. */
export interface EdgePoint {
  x: number
  y: number
  dx: number
  dy: number
}

/** Where an edge meets a node, given the handle it is attached to. */
export function edgeEndpoint(
  node: DiagramNode,
  handle: string | null | undefined,
): EdgePoint {
  const side = handle?.replace(/^(source|target)-/, '') ?? 'right'
  switch (side) {
    case 'top':
      return { x: node.x + node.width / 2, y: node.y, dx: 0, dy: -1 }
    case 'bottom':
      return { x: node.x + node.width / 2, y: node.y + node.height, dx: 0, dy: 1 }
    case 'left':
      return { x: node.x, y: node.y + node.height / 2, dx: -1, dy: 0 }
    default:
      return { x: node.x + node.width, y: node.y + node.height / 2, dx: 1, dy: 0 }
  }
}

/**
 * An end that is pinned to the board rather than to a node.
 *
 * It has no shape to leave, so its direction points at the other end — which
 * is what keeps a curved free-standing line bowing sensibly instead of
 * doubling back.
 */
export function pinnedEndpoint(
  point: StrokePoint,
  toward: StrokePoint,
): EdgePoint {
  const dx = toward.x - point.x
  const dy = toward.y - point.y
  const length = Math.hypot(dx, dy)
  if (length === 0) return { x: point.x, y: point.y, dx: 1, dy: 0 }
  return { x: point.x, y: point.y, dx: dx / length, dy: dy / length }
}

/**
 * Works out both ends of an edge, whichever mix of attached and pinned it is.
 *
 * Returns `null` when an attached end has lost its node — the edge has nothing
 * to draw between.
 */
export function resolveEdgeEnds(
  edge: DiagramEdge,
  nodeById: Map<string, DiagramNode>,
): { source: EdgePoint; target: EdgePoint } | null {
  const sourceNode = edge.source ? nodeById.get(edge.source) : undefined
  const targetNode = edge.target ? nodeById.get(edge.target) : undefined
  if (edge.source && !sourceNode) return null
  if (edge.target && !targetNode) return null

  const sourceAnchor =
    sourceNode !== undefined
      ? edgeEndpoint(sourceNode, edge.sourceHandle)
      : edge.sourcePoint
  const targetAnchor =
    targetNode !== undefined
      ? edgeEndpoint(targetNode, edge.targetHandle)
      : edge.targetPoint
  if (!sourceAnchor || !targetAnchor) return null

  return {
    source:
      sourceNode !== undefined
        ? (sourceAnchor as EdgePoint)
        : pinnedEndpoint(sourceAnchor, targetAnchor),
    target:
      targetNode !== undefined
        ? (targetAnchor as EdgePoint)
        : pinnedEndpoint(targetAnchor, sourceAnchor),
  }
}

const round = (value: number) => Math.round(value * 100) / 100

/**
 * How far a curve's control point reaches. Scaled to the gap so short
 * connections stay taut and long ones still bow, and clamped so neither
 * extreme loops back on itself.
 */
function curveReach(source: EdgePoint, target: EdgePoint): number {
  const distance = Math.hypot(target.x - source.x, target.y - source.y)
  return Math.max(48, Math.min(140, distance / 2))
}

function curvedPath(source: EdgePoint, target: EdgePoint): string {
  const reach = curveReach(source, target)
  const c1x = round(source.x + source.dx * reach)
  const c1y = round(source.y + source.dy * reach)
  const c2x = round(target.x + target.dx * reach)
  const c2y = round(target.y + target.dy * reach)
  return `M ${round(source.x)} ${round(source.y)} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${round(target.x)} ${round(target.y)}`
}

function straightPath(source: EdgePoint, target: EdgePoint): string {
  return `M ${round(source.x)} ${round(source.y)} L ${round(target.x)} ${round(target.y)}`
}

/**
 * Right-angled route. The first segment continues the direction the line
 * leaves the shape, so the elbow never starts by cutting back across the node
 * it just came from.
 */
function elbowPath(source: EdgePoint, target: EdgePoint): string {
  const start = `M ${round(source.x)} ${round(source.y)}`
  if (source.dx !== 0) {
    const midX = round((source.x + target.x) / 2)
    return `${start} L ${midX} ${round(source.y)} L ${midX} ${round(target.y)} L ${round(target.x)} ${round(target.y)}`
  }
  const midY = round((source.y + target.y) / 2)
  return `${start} L ${round(source.x)} ${midY} L ${round(target.x)} ${midY} L ${round(target.x)} ${round(target.y)}`
}

/** Builds the `d` attribute for an edge in the requested routing. */
export function buildEdgePath(
  source: EdgePoint,
  target: EdgePoint,
  routing: NonNullable<DiagramEdge['routing']> = 'curved',
): string {
  switch (routing) {
    case 'straight':
      return straightPath(source, target)
    case 'elbow':
      return elbowPath(source, target)
    default:
      return curvedPath(source, target)
  }
}

/** SVG `stroke-dasharray` for a stroke style, scaled to the stroke width. */
export function strokeDashArray(
  style: NonNullable<DiagramEdge['strokeStyle']> = 'solid',
  width = 2,
): string | undefined {
  switch (style) {
    case 'dashed':
      return `${width * 4} ${width * 3}`
    case 'dotted':
      return `0.1 ${width * 2.5}`
    default:
      return undefined
  }
}
