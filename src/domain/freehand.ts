import type { StrokePoint } from './diagram'

export interface StrokeBounds {
  x: number
  y: number
  width: number
  height: number
}

/** Smallest box a stroke fits in, with room for the stroke's own thickness. */
export function strokeBounds(
  points: StrokePoint[],
  strokeWidth: number,
): StrokeBounds {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const padding = strokeWidth / 2 + 2
  const minX = Math.min(...xs) - padding
  const minY = Math.min(...ys) - padding
  return {
    x: minX,
    y: minY,
    // A perfectly straight stroke has zero extent on one axis; keep the box
    // usable so it can still be selected and resized.
    width: Math.max(1, Math.max(...xs) + padding - minX),
    height: Math.max(1, Math.max(...ys) + padding - minY),
  }
}

/** Maps captured points into 0–1 within their box, so resizing scales them. */
export function normaliseStroke(
  points: StrokePoint[],
  bounds: StrokeBounds,
): StrokePoint[] {
  return points.map((point) => ({
    x: (point.x - bounds.x) / bounds.width,
    y: (point.y - bounds.y) / bounds.height,
  }))
}

/**
 * Adds a sample only once the pointer has actually travelled.
 *
 * Pointer events fire far faster than a stroke changes shape; without this a
 * short flick stores hundreds of near-identical points and the saved document
 * grows for no visible gain.
 */
export function appendPoint(
  points: StrokePoint[],
  point: StrokePoint,
  minDistance = 2,
): StrokePoint[] {
  const last = points.at(-1)
  if (last && Math.hypot(point.x - last.x, point.y - last.y) < minDistance) {
    return points
  }
  return [...points, point]
}

const round = (value: number) => Math.round(value * 100) / 100

/**
 * Turns normalised points into an SVG path scaled to a box.
 *
 * Quadratic segments through the midpoints of consecutive samples, which
 * smooths the polyline without needing to fit real splines — the same trick
 * most sketch tools use.
 */
export function strokePathData(
  points: StrokePoint[],
  width: number,
  height: number,
): string {
  if (points.length === 0) return ''

  const at = (point: StrokePoint) => ({
    x: round(point.x * width),
    y: round(point.y * height),
  })

  const first = at(points[0])
  // A tap is a dot: with a round linecap a zero-length line paints one.
  if (points.length === 1) return `M ${first.x} ${first.y} L ${first.x} ${first.y}`
  if (points.length === 2) {
    const second = at(points[1])
    return `M ${first.x} ${first.y} L ${second.x} ${second.y}`
  }

  let path = `M ${first.x} ${first.y}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = at(points[index])
    const next = at(points[index + 1])
    const midX = round((current.x + next.x) / 2)
    const midY = round((current.y + next.y) / 2)
    path += ` Q ${current.x} ${current.y}, ${midX} ${midY}`
  }
  const last = at(points[points.length - 1])
  return `${path} L ${last.x} ${last.y}`
}

/** Stroke rendering that differs by pen. */
export const penStyles = {
  pen: { widthScale: 1, opacity: 1, blend: 'normal' },
  marker: { widthScale: 2.2, opacity: 1, blend: 'normal' },
  // Multiply keeps whatever is underneath readable through the ink.
  highlighter: { widthScale: 4, opacity: 0.38, blend: 'multiply' },
} as const
