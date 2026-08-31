import { z } from 'zod'
import {
  DOCUMENT_VERSION,
  createBlankDocument,
  type DiagramDocument,
  type DiagramNodeKind,
} from './diagram'
import { nodeKindSpecs } from './node-kinds'

// Derived from the kind table, so a new kind is accepted by the schema the
// moment it is described there.
const nodeKinds = Object.keys(nodeKindSpecs) as [
  DiagramNodeKind,
  ...DiagramNodeKind[],
]

const strokePoint = z.object({ x: z.number(), y: z.number() })

const freehandStroke = z.object({
  pen: z.enum(['pen', 'marker', 'highlighter']),
  points: z.array(strokePoint),
})

const node = z.object({
  id: z.string(),
  kind: z.enum(nodeKinds),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  label: z.string(),
  fillColor: z.string(),
  strokeColor: z.string(),
  strokeWidth: z.number(),
  zIndex: z.number().optional(),
  freehand: freehandStroke.optional(),
})

const edge = z.object({
  id: z.string(),
  // Absent on a free-standing line, which pins that end to a point instead.
  source: z.string().optional(),
  target: z.string().optional(),
  sourceHandle: z.string().nullish(),
  targetHandle: z.string().nullish(),
  sourcePoint: strokePoint.optional(),
  targetPoint: strokePoint.optional(),
  routing: z.enum(['curved', 'straight', 'elbow']).optional(),
  startArrow: z.enum(['none', 'arrow']).optional(),
  endArrow: z.enum(['none', 'arrow']).optional(),
  strokeWidth: z.number().optional(),
  strokeStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
  strokeColor: z.string().optional(),
})

/** The envelope is strict; its contents are filtered element by element. */
const envelope = z.object({
  id: z.string(),
  title: z.string(),
  version: z.number(),
  updatedAt: z.string(),
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
})

/**
 * Validates a stored document and brings it up to the current version.
 *
 * Elements are checked one at a time and bad ones dropped, rather than
 * rejecting the whole board: a single unreadable node should cost you that
 * node, not everything you have drawn. A node of a kind this build does not
 * know would otherwise render as an unstyled box.
 *
 * Returns `null` when the document is not recognisable at all, which the
 * caller treats as "start fresh".
 */
export function parseDocument(value: unknown): DiagramDocument | null {
  const parsed = envelope.safeParse(value)
  if (!parsed.success) return null

  const nodes = parsed.data.nodes
    .map((candidate) => node.safeParse(candidate))
    .filter((result) => result.success)
    .map((result) => result.data)

  const nodeIds = new Set(nodes.map((item) => item.id))
  const edges = parsed.data.edges
    .map((candidate) => edge.safeParse(candidate))
    .filter((result) => result.success)
    .map((result) => result.data)
    // An attached end whose node did not survive has nothing to attach to;
    // a pinned end always stands on its own.
    .filter(
      (item) =>
        (item.source === undefined || nodeIds.has(item.source)) &&
        (item.target === undefined || nodeIds.has(item.target)),
    )
    // Every end must resolve somehow, or there is nothing to draw between.
    .filter(
      (item) =>
        (item.source !== undefined || item.sourcePoint !== undefined) &&
        (item.target !== undefined || item.targetPoint !== undefined),
    )

  return {
    id: parsed.data.id,
    title: parsed.data.title,
    // Everything added since v1 is optional, so migrating forward is just
    // restamping the version.
    version: DOCUMENT_VERSION,
    updatedAt: parsed.data.updatedAt,
    nodes,
    edges,
  }
}

/** Parses, or hands back an empty board rather than throwing. */
export function parseDocumentOrBlank(value: unknown): DiagramDocument {
  return parseDocument(value) ?? createBlankDocument()
}
