import type { ReactNode } from 'react'
import type { DiagramNodeKind } from '../../domain/diagram'
import { specFor } from '../../domain/node-kinds'
import { kindIcons } from './tool-rail-items'

/**
 * Turns a CSS `clip-path: polygon(...)` into SVG points on a 100×100 box.
 *
 * The glyph and the shape on the canvas are then drawn from the same numbers,
 * so a picker button always depicts what it actually draws.
 */
function polygonPoints(clipPath: string): string {
  return (
    clipPath
      .replace(/^polygon\(|\)$/g, '')
      .split(',')
      .map((pair) =>
        pair
          .trim()
          .split(/\s+/)
          .map((value) => Number.parseFloat(value))
          .join(','),
      )
      .join(' ')
  )
}

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 7,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
}

/**
 * A shape's own outline, rather than an approximate icon.
 *
 * Architecture nodes keep their lucide icons — a server is not a geometry, and
 * a box outline would say nothing about it.
 */
export function ShapeGlyph({
  kind,
  size = 20,
}: {
  kind: DiagramNodeKind
  size?: number
}) {
  const spec = specFor(kind)

  if (spec.group === 'architecture' || kind === 'freehand') {
    const Icon = kindIcons[kind]
    return <Icon size={size} aria-hidden="true" />
  }

  const svg = (children: ReactNode) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )

  if (spec.polygon) {
    return svg(<polygon points={polygonPoints(spec.polygon)} {...STROKE} />)
  }

  switch (kind) {
    case 'ellipse':
      return svg(<ellipse cx="50" cy="50" rx="46" ry="34" {...STROKE} />)
    case 'diamond':
      return svg(<polygon points="50,6 94,50 50,94 6,50" {...STROKE} />)
    case 'roundedRectangle':
      return svg(
        <rect x="6" y="20" width="88" height="60" rx="18" {...STROKE} />,
      )
    case 'cylinder':
      return svg(
        <>
          <path d="M8 26v48c0 9 19 16 42 16s42-7 42-16V26" {...STROKE} />
          <ellipse cx="50" cy="26" rx="42" ry="16" {...STROKE} />
        </>,
      )
    case 'stickyNote':
      // A square with the corner turned up — the thing itself, not a page.
      return svg(
        <>
          <path d="M10 10h80v52L62 90H10z" {...STROKE} />
          <path d="M90 62H62v28" {...STROKE} />
        </>,
      )
    case 'frame':
      return svg(
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          rx="6"
          {...STROKE}
          strokeDasharray="16 12"
        />,
      )
    case 'text':
      return svg(
        <>
          <path d="M14 22h72" {...STROKE} />
          <path d="M50 22v56" {...STROKE} />
        </>,
      )
    default:
      return svg(<rect x="6" y="20" width="88" height="60" {...STROKE} />)
  }
}

/**
 * Rail glyphs for groups where no stock icon reads clearly at 20px.
 *
 * Drawn rather than borrowed: "shapes" as a stock icon is a cluster of
 * overlapping forms that turns to mush, lucide's `frame` is a hash, and
 * `waypoints` says nothing about joining two things together.
 */
function glyph(children: ReactNode, size: number) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/**
 * A square with a circle over its corner.
 *
 * Two large forms rather than three small ones: at 20px a square, circle and
 * triangle together collapse into a blob.
 */
export function ShapesGlyph({ size = 20 }: { size?: number }) {
  return glyph(
    <>
      <rect x="8" y="34" width="56" height="56" rx="6" {...STROKE} />
      <circle cx="66" cy="34" r="26" {...STROKE} />
    </>,
    size,
  )
}

/** Two boxes joined by an arrow — what a connector actually does. */
export function ConnectorGlyph({ size = 20 }: { size?: number }) {
  return glyph(
    <>
      <rect x="4" y="6" width="34" height="28" rx="4" {...STROKE} />
      <rect x="62" y="66" width="34" height="28" rx="4" {...STROKE} />
      <path d="M38 26q28 4 34 36" {...STROKE} />
      <path d="M64 54l8 12 12-4" {...STROKE} />
    </>,
    size,
  )
}
