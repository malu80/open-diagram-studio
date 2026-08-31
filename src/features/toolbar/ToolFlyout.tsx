import { LayoutGrid } from 'lucide-react'
import {
  Button,
  Field,
  RangeInput,
  SegmentedControl,
  SwatchPicker,
  fillSwatches,
  strokeSwatches,
} from '../../design-system'
import type { DiagramNodeKind } from '../../domain/diagram'
import { basicShapes, kindsInGroup } from '../../domain/node-kinds'
import { useToolStore, type PenType } from '../../stores/tool-store'
import { penIcons, penLabels } from './tool-rail-items'
import { ShapeButton } from './ToolRail'

const PEN_TYPES: PenType[] = ['pen', 'marker', 'highlighter', 'eraser']

/**
 * The panel that opens beside the rail for whichever group is expanded.
 *
 * One component rather than one per group: they share the card, the heading
 * and the dismissal behaviour, and only their contents differ.
 */
export function ToolFlyout() {
  const openFlyout = useToolStore((state) => state.openFlyout)
  const tool = useToolStore((state) => state.tool)
  const setTool = useToolStore((state) => state.setTool)
  const setLibraryOpen = useToolStore((state) => state.setLibraryOpen)
  const closeFlyout = useToolStore((state) => state.closeFlyout)
  const penColor = useToolStore((state) => state.penColor)
  const penWidth = useToolStore((state) => state.penWidth)
  const setPenColor = useToolStore((state) => state.setPenColor)
  const setPenWidth = useToolStore((state) => state.setPenWidth)
  const stickyColor = useToolStore((state) => state.stickyColor)
  const setStickyColor = useToolStore((state) => state.setStickyColor)
  const lineRouting = useToolStore((state) => state.lineRouting)
  const lineArrow = useToolStore((state) => state.lineArrow)

  if (!openFlyout) return null

  const activeShape = tool.kind === 'shape' ? tool.shape : null
  const pickShape = (shape: DiagramNodeKind) => setTool({ kind: 'shape', shape })

  return (
    <div className="chrome-card tool-flyout" role="group" aria-label="Tool options">
      {openFlyout === 'shapes' ? (
        <>
          <p className="ds-eyebrow">Basic shapes</p>
          <div className="shape-grid">
            {basicShapes().map((kind) => (
              <ShapeButton
                key={kind}
                kind={kind}
                active={activeShape === kind}
                onPick={pickShape}
              />
            ))}
          </div>
          <Button
            variant="secondary"
            block
            icon={<LayoutGrid size={14} />}
            onClick={() => {
              setLibraryOpen(true)
              closeFlyout()
            }}
          >
            More shapes
          </Button>
        </>
      ) : null}

      {openFlyout === 'lines' ? (
        <>
          <p className="ds-eyebrow">Line</p>
          <SegmentedControl
            label="Line ends"
            value={lineArrow}
            options={[
              { value: 'arrow', label: 'Arrow' },
              { value: 'none', label: 'Plain' },
            ]}
            onChange={(endArrow) =>
              setTool({ kind: 'line', routing: lineRouting, endArrow })
            }
          />
          <p className="ds-eyebrow">Route</p>
          <SegmentedControl
            label="Line routing"
            value={lineRouting}
            options={[
              { value: 'straight', label: 'Straight' },
              { value: 'curved', label: 'Curved' },
              { value: 'elbow', label: 'Elbow' },
            ]}
            onChange={(routing) =>
              setTool({ kind: 'line', routing, endArrow: lineArrow })
            }
          />
        </>
      ) : null}

      {openFlyout === 'sticky' ? (
        <>
          <p className="ds-eyebrow">Note colour</p>
          <SwatchPicker
            label="Sticky note colour"
            value={stickyColor}
            options={fillSwatches}
            onSelect={setStickyColor}
          />
        </>
      ) : null}

      {openFlyout === 'pen' ? (
        <>
          <p className="ds-eyebrow">Pen</p>
          <div className="pen-grid">
            {PEN_TYPES.map((pen) => {
              const Icon = penIcons[pen]
              const active = tool.kind === 'pen' && tool.pen === pen
              return (
                <button
                  key={pen}
                  type="button"
                  className={`shape-button${active ? ' shape-button--active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setTool({ kind: 'pen', pen })}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{penLabels[pen]}</span>
                </button>
              )
            })}
          </div>

          {/* The eraser removes whole strokes, so ink settings do not apply. */}
          {tool.kind === 'pen' && tool.pen === 'eraser' ? (
            <p className="flyout-hint">
              Erases whole strokes. Drawings are shapes, not pixels.
            </p>
          ) : (
            <>
              <p className="ds-eyebrow">Ink</p>
              <SwatchPicker
                label="Ink colour"
                value={penColor}
                options={strokeSwatches}
                onSelect={setPenColor}
              />
              <Field
                htmlFor="pen-width"
                label={
                  <span className="field-label-row">
                    Thickness
                    <span className="field-value ds-numeric">{penWidth}</span>
                  </span>
                }
              >
                <RangeInput
                  id="pen-width"
                  min={1}
                  max={16}
                  value={penWidth}
                  onChange={(event) => setPenWidth(Number(event.target.value))}
                />
              </Field>
            </>
          )}
        </>
      ) : null}

      {openFlyout === 'architecture' ? (
        <>
          <p className="ds-eyebrow">Architecture</p>
          <div className="shape-grid">
            {kindsInGroup('architecture').map((kind) => (
              <ShapeButton
                key={kind}
                kind={kind}
                active={activeShape === kind}
                onPick={pickShape}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
