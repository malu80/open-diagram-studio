import { useState, type KeyboardEvent } from 'react'
import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from '@xyflow/react'
import {
  Cloud,
  Database,
  Monitor,
  Server,
  Waypoints,
} from 'lucide-react'
import {
  type FlowDiagramNode,
  useDiagramStore,
} from '../../stores/diagram-store'
import { penStyles, strokePathData } from '../../domain/freehand'
import { specFor } from '../../domain/node-kinds'

const architectureIcons = {
  client: Monitor,
  server: Server,
  database: Database,
  queue: Waypoints,
  cloud: Cloud,
}

const connectorPositions = [
  ['top', Position.Top],
  ['right', Position.Right],
  ['bottom', Position.Bottom],
  ['left', Position.Left],
] as const

/**
 * A freehand stroke. Its own node type in everything but name: no label, no
 * fill, no connectors — just the path, scaled into whatever box the resize
 * handles give it.
 */
function FreehandNode({ id, data, selected }: NodeProps<FlowDiagramNode>) {
  const stroke = data.freehand
  if (!stroke) return null
  const pen = penStyles[stroke.pen]

  return (
    <div className="diagram-node diagram-node--freehand">
      <NodeResizer
        isVisible={selected}
        minWidth={8}
        minHeight={8}
        lineClassName="node-resizer-line"
        handleClassName="node-resizer-handle"
      />
      <svg
        className="freehand-canvas"
        viewBox={`0 0 ${data.width} ${data.height}`}
        preserveAspectRatio="none"
      >
        <path
          // The eraser hit-tests through elementsFromPoint and looks for this.
          data-freehand-id={id}
          d={strokePathData(stroke.points, data.width, data.height)}
          fill="none"
          stroke={data.strokeColor}
          strokeWidth={data.strokeWidth * pen.widthScale}
          strokeOpacity={pen.opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ mixBlendMode: pen.blend }}
        />
      </svg>
    </div>
  )
}

export function DiagramNode(props: NodeProps<FlowDiagramNode>) {
  if (props.data.kind === 'freehand') return <FreehandNode {...props} />
  return <ShapeNode {...props} />
}

function ShapeNode({ id, data, selected }: NodeProps<FlowDiagramNode>) {
  const spec = specFor(data.kind)
  const [editing, setEditing] = useState(
    (data.kind === 'text' || data.kind === 'stickyNote') && selected,
  )
  const updateNodeLabel = useDiagramStore((state) => state.updateNodeLabel)
  const removeNode = useDiagramStore((state) => state.removeNode)
  const resizeTextNode = useDiagramStore((state) => state.resizeTextNode)
  const Icon =
    data.kind in architectureIcons
      ? architectureIcons[data.kind as keyof typeof architectureIcons]
      : null

  return (
    <div
      className={`diagram-node diagram-node--${data.kind}`}
      style={
        data.kind === 'text' || data.kind === 'stickyNote'
          ? { color: data.strokeColor }
          : undefined
      }
    >
      <NodeResizer
        isVisible={selected}
        minWidth={data.kind === 'text' ? 80 : 88}
        minHeight={data.kind === 'text' ? 32 : 56}
        lineClassName="node-resizer-line"
        handleClassName="node-resizer-handle"
      />
      {/* React Flow owns the connect interaction, including click-to-connect
          and its own `connectingfrom`/`connectingto` state classes. */}
      {connectorPositions.map(([side, position]) => (
        <Handle
          key={side}
          id={side}
          className="connector-handle"
          type="source"
          position={position}
          title={`Connect from ${side}`}
        />
      ))}
      {spec.polygon ? (
        // Clipping cuts a CSS border off, so the outline is a stroke-coloured
        // plate with the fill inset on top of it.
        <div
          className={`node-shape node-shape--${data.kind}`}
          style={{
            backgroundColor: data.strokeColor,
            clipPath: spec.polygon,
          }}
        >
          <div
            className="node-shape-fill"
            style={{
              backgroundColor: data.fillColor,
              clipPath: spec.polygon,
              inset: data.strokeWidth,
            }}
          />
        </div>
      ) : (
        <div
          className={`node-shape node-shape--${data.kind}`}
          style={
            // Outline-only kinds have no border of their own: for text and
            // sticky notes the stroke colour is the *text* colour. A frame has
            // neither — it is a boundary drawn entirely by the stylesheet, and
            // setting a fill inline here would beat that.
            spec.noFill
              ? undefined
              : spec.outlineOnly
                ? { backgroundColor: data.fillColor }
                : {
                    backgroundColor: data.fillColor,
                    borderColor: data.strokeColor,
                    borderWidth: data.strokeWidth,
                  }
          }
        />
      )}
      <div className="node-content">
        {Icon && !editing ? (
          <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
        ) : null}
        {editing ? (
          <textarea
            autoFocus
            className="node-label-input nodrag nopan nowheel"
            aria-label="Node text"
            value={data.label}
            placeholder="Type something"
            onChange={(event) => {
              const value = event.target.value
              updateNodeLabel(id, value)
              if (data.kind === 'text') {
                const lines = value.split('\n')
                const longestLine = Math.max(
                  1,
                  ...lines.map((line) => line.length),
                )
                resizeTextNode(
                  id,
                  Math.min(640, Math.max(80, longestLine * 10 + 20)),
                  Math.min(400, Math.max(40, lines.length * 23 + 16)),
                )
              }
            }}
            onBlur={() => {
              // An empty text box is a mis-click, not content. Sticky notes
              // stay: an empty one is still a visible object you placed.
              if (data.kind === 'text' && !data.label.trim()) {
                removeNode(id)
                return
              }
              setEditing(false)
            }}
            onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.blur()
              }
              if (event.key === 'Escape') {
                event.currentTarget.blur()
              }
            }}
          />
        ) : (
          <span
            className="node-label"
            onDoubleClick={() => setEditing(true)}
          >
            {data.label ||
              (data.kind === 'stickyNote' || data.kind === 'text'
                ? 'Double-click to type'
                : '')}
          </span>
        )}
      </div>
    </div>
  )
}
