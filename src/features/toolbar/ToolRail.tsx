import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { IconButton } from '../../design-system'
import type { DiagramNodeKind } from '../../domain/diagram'
import { specFor } from '../../domain/node-kinds'
import {
  isSameTool,
  useToolStore,
  type FlyoutId,
  type Tool,
} from '../../stores/tool-store'
import { groupIcons } from './tool-rail-items'
import { ToolFlyout } from './ToolFlyout'
import { ConnectorGlyph, ShapeGlyph, ShapesGlyph } from './ShapeGlyph'

interface RailEntry {
  id: string
  label: string
  shortcut?: string
  /** A node, not a component: the rail mixes stock icons with drawn glyphs. */
  icon: ReactNode
  tool: Tool
  /** Groups open a flyout as well as selecting their remembered tool. */
  flyout?: FlyoutId
  /** Starts a new group in the rail. */
  startsGroup?: boolean
}

/**
 * The floating tool rail.
 *
 * Every button resolves to a `Tool`; the rail never tracks "which tool is
 * active" itself. The accent pill is a single element that slides to whichever
 * button is active, measured from the DOM so the dividers and group sizes
 * cannot put it out of step.
 */
export function ToolRail() {
  const tool = useToolStore((state) => state.tool)
  const openFlyout = useToolStore((state) => state.openFlyout)
  const toggleTool = useToolStore((state) => state.toggleTool)
  const setTool = useToolStore((state) => state.setTool)
  const toggleFlyout = useToolStore((state) => state.toggleFlyout)
  const closeFlyout = useToolStore((state) => state.closeFlyout)
  const lastShape = useToolStore((state) => state.lastShape)
  const lastArchitecture = useToolStore((state) => state.lastArchitecture)
  const lastPen = useToolStore((state) => state.lastPen)
  const lineRouting = useToolStore((state) => state.lineRouting)
  const lineArrow = useToolStore((state) => state.lineArrow)

  const gridRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<{
    x: number
    y: number
    size: number
  } | null>(null)
  const [animate, setAnimate] = useState(false)

  const shapeTool: Tool = { kind: 'shape', shape: lastShape }
  const architectureTool: Tool = { kind: 'shape', shape: lastArchitecture }
  const penTool: Tool = { kind: 'pen', pen: lastPen }
  const lineTool: Tool = {
    kind: 'line',
    routing: lineRouting,
    endArrow: lineArrow,
  }

  const entries: RailEntry[] = [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      icon: <groupIcons.select size={20} />,
      tool: { kind: 'select' },
    },
    {
      id: 'shapes',
      label: 'Shapes',
      shortcut: 'R',
      icon: <ShapesGlyph />,
      tool: shapeTool,
      flyout: 'shapes',
      startsGroup: true,
    },
    {
      id: 'lines',
      label: 'Lines',
      shortcut: 'L',
      // The one icon that follows its setting, because "line" and "arrow" are
      // different things to draw rather than two members of a group.
      icon:
        lineArrow === 'arrow' ? (
          <groupIcons.lineArrow size={20} />
        ) : (
          <groupIcons.line size={20} />
        ),
      tool: lineTool,
      flyout: 'lines',
    },
    {
      id: 'connector',
      label: 'Connector',
      shortcut: 'A',
      icon: <ConnectorGlyph />,
      tool: { kind: 'connector' },
    },
    {
      id: 'sticky',
      label: 'Sticky note',
      shortcut: 'N',
      icon: <ShapeGlyph kind="stickyNote" />,
      tool: { kind: 'shape', shape: 'stickyNote' },
      flyout: 'sticky',
      startsGroup: true,
    },
    {
      id: 'frame',
      label: 'Frame',
      shortcut: 'F',
      icon: <ShapeGlyph kind="frame" />,
      tool: { kind: 'shape', shape: 'frame' },
    },
    {
      id: 'text',
      label: 'Text',
      shortcut: 'T',
      icon: <groupIcons.text size={20} />,
      tool: { kind: 'shape', shape: 'text' },
    },
    {
      id: 'pen',
      label: 'Draw',
      shortcut: 'P',
      icon: <groupIcons.pen size={20} />,
      tool: penTool,
      flyout: 'pen',
    },
    {
      id: 'architecture',
      label: 'Architecture',
      shortcut: 'I',
      icon: <groupIcons.architecture size={20} />,
      tool: architectureTool,
      flyout: 'architecture',
      startsGroup: true,
    },
  ]

  // Measured rather than computed from an index: the rail has dividers and a
  // group whose icon changes, so arithmetic would drift.
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const active = grid.querySelector<HTMLElement>('button[data-active="true"]')
    if (!active) {
      setIndicator(null)
      return
    }
    const gridBox = grid.getBoundingClientRect()
    const box = active.getBoundingClientRect()
    setIndicator({
      x: box.left - gridBox.left,
      y: box.top - gridBox.top,
      size: box.width,
    })
  }, [tool, lastShape, lastArchitecture, lastPen])

  // Skip the animation on first paint, or the pill flies in from the corner.
  useLayoutEffect(() => {
    if (!indicator || animate) return
    const frame = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(frame)
  }, [animate, indicator])

  const activeEntry = entries.find((entry) => isSameTool(entry.tool, tool))

  const press = (entry: RailEntry) => {
    if (entry.flyout) {
      // A group button selects its remembered tool and reveals the rest.
      setTool(entry.tool)
      toggleFlyout(entry.flyout)
      return
    }
    closeFlyout()
    toggleTool(entry.tool)
  }

  return (
    <div className="tool-rail-anchor">
      <aside className="chrome-card tool-panel" aria-label="Diagram tools">
        <div className="tool-grid" ref={gridRef}>
          {indicator ? (
            <span
              aria-hidden="true"
              className={`tool-indicator${animate ? ' tool-indicator--animated' : ''}`}
              style={{
                width: indicator.size,
                height: indicator.size,
                transform: `translate(${indicator.x}px, ${indicator.y}px)`,
              }}
            />
          ) : null}

          {entries.map((entry) => {
            const isActive = activeEntry?.id === entry.id
            return (
              <Fragment key={entry.id}>
                {/* A sibling of the slots, not a child of one: nested in a slot
                    it shared a line with the button and knocked it off the
                    grid. */}
                {entry.startsGroup ? (
                  <span className="tool-divider" aria-hidden="true" />
                ) : null}
                <span
                  className={`tool-slot${entry.flyout ? ' tool-slot--group' : ''}`}
                  data-active={isActive}
                >
                  <IconButton
                    size="lg"
                    label={entry.label}
                    shortcut={entry.shortcut}
                    tooltipPlacement="right"
                    icon={entry.icon}
                    data-active={isActive}
                    aria-pressed={isActive}
                    aria-expanded={
                      entry.flyout ? openFlyout === entry.flyout : undefined
                    }
                    onClick={() => press(entry)}
                  />
                </span>
              </Fragment>
            )
          })}
        </div>
      </aside>

      <ToolFlyout />
    </div>
  )
}

/** Shared by the flyout and the library so a shape button looks the same in both. */
export function ShapeButton({
  kind,
  active,
  onPick,
}: {
  kind: DiagramNodeKind
  active: boolean
  onPick: (kind: DiagramNodeKind) => void
}) {
  const spec = specFor(kind)
  return (
    <button
      type="button"
      className={`shape-button${active ? ' shape-button--active' : ''}`}
      aria-pressed={active}
      onClick={() => onPick(kind)}
    >
      <ShapeGlyph kind={kind} />
      <span>{spec.label || kind}</span>
    </button>
  )
}
