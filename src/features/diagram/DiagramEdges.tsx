import { ViewportPortal } from '@xyflow/react'
import {
  edgeDefaults,
  type DiagramEdge,
  type DiagramNode,
} from '../../domain/diagram'
import {
  buildEdgePath,
  resolveEdgeEnds,
  strokeDashArray,
} from '../../domain/edge-path'

interface DiagramEdgesProps {
  edges: DiagramEdge[]
  nodes: DiagramNode[]
  selectedEdgeIds: string[]
  onSelect: (edgeId: string) => void
}

export function DiagramEdges({
  edges,
  nodes,
  selectedEdgeIds,
  onSelect,
}: DiagramEdgesProps) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  return (
    <ViewportPortal>
      <svg className="diagram-edges" aria-label="Diagram arrows">
        <defs>
          {/* One marker serves both ends: `auto-start-reverse` flips it when
              used as a start marker. `context-stroke` makes it follow whatever
              colour the line is, so a recoloured edge needs no second marker.
              `userSpaceOnUse` keeps the head a fixed size at any stroke width. */}
          <marker
            id="diagram-arrowhead"
            viewBox="0 0 11 8"
            markerWidth="11"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto-start-reverse"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M0,0.5 L11,4 L0,7.5 L1.8,4 z"
              fill="context-stroke"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
        {edges.map((edge) => {
          const ends = resolveEdgeEnds(edge, nodeById)
          if (!ends) return null

          const routing = edge.routing ?? edgeDefaults.routing
          const strokeWidth = edge.strokeWidth ?? edgeDefaults.strokeWidth
          const strokeStyle = edge.strokeStyle ?? edgeDefaults.strokeStyle
          const startArrow = edge.startArrow ?? edgeDefaults.startArrow
          const endArrow = edge.endArrow ?? edgeDefaults.endArrow

          const path = buildEdgePath(ends.source, ends.target, routing)
          const selected = selectedEdgeIds.includes(edge.id)

          return (
            <g
              key={edge.id}
              className={`diagram-edge${selected ? ' selected' : ''}`}
              data-edge-id={edge.id}
              onClick={(event) => {
                event.stopPropagation()
                onSelect(edge.id)
              }}
            >
              <path className="diagram-edge-hit" d={path} />
              {/* Hover and selection read as a halo rather than a thicker
                  line: the line's own colour is user data, so restyling it
                  would be invisible on a recoloured edge, and thickening it
                  would make selecting an edge change its apparent weight. */}
              <path
                className="diagram-edge-halo"
                d={path}
                strokeWidth={strokeWidth + 6}
              />
              <path
                className="diagram-edge-line"
                d={path}
                // An unset colour follows the theme, which is why it is a class
                // rather than an attribute; anything chosen is user data.
                style={edge.strokeColor ? { stroke: edge.strokeColor } : undefined}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDashArray(strokeStyle, strokeWidth)}
                markerStart={
                  startArrow === 'arrow' ? 'url(#diagram-arrowhead)' : undefined
                }
                markerEnd={
                  endArrow === 'arrow' ? 'url(#diagram-arrowhead)' : undefined
                }
              />
            </g>
          )
        })}
      </svg>
    </ViewportPortal>
  )
}
