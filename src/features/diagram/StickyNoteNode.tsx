import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { NodeResizer, NodeToolbar, type NodeProps } from '@xyflow/react'
import { AlignCenter, AlignLeft, AlignRight, Bold, Copy, Palette, Pencil, RectangleHorizontal, Square, Trash2 } from 'lucide-react'
import { IconButton, SwatchPicker, stickySwatches } from '../../design-system'
import {
  type FlowDiagramNode,
  useDiagramStore,
} from '../../stores/diagram-store'
import { fittedStickyFontSize } from '../../domain/sticky-note'
import { isTypeToEditKey } from '../shortcuts/use-shortcuts'

/** A sticky is one domain node and one resize surface; its text never detaches. */
export function StickyNoteNode({
  id,
  data,
  selected,
}: NodeProps<FlowDiagramNode>) {
  const [editing, setEditing] = useState(selected && !data.label)
  const [colorsOpen, setColorsOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const measure = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(20)
  const editHistoryActive = useRef(false)
  const beginHistoryGroup = useDiagramStore((state) => state.beginHistoryGroup)
  const endHistoryGroup = useDiagramStore((state) => state.endHistoryGroup)
  const textStyle = data.sticky ?? { fontSize: 'auto', textAlign: 'left', bold: false }
  const updateNodeLabel = useDiagramStore((state) => state.updateNodeLabel)
  const updateSelectedNode = useDiagramStore((state) => state.updateSelectedNode)
  const duplicateSelected = useDiagramStore((state) => state.duplicateSelected)
  const deleteSelected = useDiagramStore((state) => state.deleteSelected)
  const singleSelection = useDiagramStore((state) => state.selectedNodeIds.length === 1)
  const stopCanvasInteraction = (event: PointerEvent<HTMLTextAreaElement>) =>
    event.stopPropagation()

  const startEditing = () => {
    if (!editHistoryActive.current) {
      beginHistoryGroup()
      editHistoryActive.current = true
    }
    setEditing(true)
  }

  useLayoutEffect(() => {
    if (!editing || !selected) return
    if (!editHistoryActive.current) {
      beginHistoryGroup()
      editHistoryActive.current = true
    }
    return () => {
      editHistoryActive.current = false
      endHistoryGroup()
    }
  }, [editing, selected, beginHistoryGroup, endHistoryGroup])

  useEffect(() => {
    if (selected && singleSelection && !root.current?.contains(document.activeElement)) {
      root.current?.focus({ preventScroll: true })
    }
  }, [selected, singleSelection])

  useLayoutEffect(() => {
    let active = true
    const fit = () => {
      const element = measure.current
      if (!active || !element) return
      setFontSize(fittedStickyFontSize((size) => {
        element.style.fontSize = `${size}px`
        return element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth
      }))
    }
    fit()
    void document.fonts.ready.then(fit)
    return () => { active = false }
  }, [data.label, data.width, data.height, textStyle.bold, textStyle.textAlign])

  return (
    <div
      ref={root}
      tabIndex={0}
      className="sticky-note"
      data-sticky-note="true"
      data-type-to-edit={selected && singleSelection ? 'true' : undefined}
      aria-label="Sticky note"
      onClick={(event) => {
        if (!editing && event.currentTarget.contains(event.target as Node)) root.current?.focus({ preventScroll: true })
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || !selected || !singleSelection || !isTypeToEditKey(event.nativeEvent)) return
        event.preventDefault()
        event.stopPropagation()
        startEditing()
        if (event.key !== 'Enter') updateNodeLabel(id, data.label + event.key)
      }}
      style={{
        backgroundColor: data.fillColor,
        color: data.strokeColor,
        fontSize: textStyle.fontSize === 'auto' ? fontSize : textStyle.fontSize,
        textAlign: textStyle.textAlign,
        fontWeight: textStyle.bold ? 700 : 500,
      }}
    >
      <NodeToolbar isVisible={selected && singleSelection} offset={16}>
        <div className="sticky-toolbar nodrag nopan" role="toolbar" aria-label="Sticky note controls">
          <IconButton label="Edit note" icon={<Pencil size={17} />} onClick={startEditing} tooltipPlacement="top" />
          <select
            className="sticky-toolbar__font ds-input"
            aria-label="Note font size"
            value={textStyle.fontSize}
            onChange={(event) => updateSelectedNode({ sticky: { ...textStyle, fontSize: event.target.value === 'auto' ? 'auto' : Number(event.target.value) } })}
          >
            <option value="auto">Auto</option>
            {[12, 14, 16, 18, 20, 24, 32, 48, 64, 96].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <IconButton label="Bold note text" icon={<Bold size={17} />} active={textStyle.bold} aria-pressed={textStyle.bold} onClick={() => updateSelectedNode({ sticky: { ...textStyle, bold: !textStyle.bold } })} tooltipPlacement="top" />
          <div role="group" aria-label="Note text alignment" className="sticky-toolbar__segment">
            {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([alignment, Icon]) => (
              <IconButton key={alignment} label={`Align note text ${alignment}`} icon={<Icon size={17} />} active={textStyle.textAlign === alignment} aria-pressed={textStyle.textAlign === alignment} onClick={() => updateSelectedNode({ sticky: { ...textStyle, textAlign: alignment } })} tooltipPlacement="top" />
            ))}
          </div>
          <div role="group" aria-label="Note shape" className="sticky-toolbar__segment">
            <IconButton label="Square note" icon={<Square size={17} />} active={data.width === data.height} aria-pressed={data.width === data.height} onClick={() => updateSelectedNode({ height: data.width })} tooltipPlacement="top" />
            <IconButton label="Rectangular note" icon={<RectangleHorizontal size={17} />} active={data.width > data.height} aria-pressed={data.width > data.height} onClick={() => updateSelectedNode({ height: Math.max(88, Math.round(data.width * 2 / 3)) })} tooltipPlacement="top" />
          </div>
          <IconButton label="Note color" icon={<Palette size={17} />} active={colorsOpen} aria-expanded={colorsOpen} onClick={() => setColorsOpen(!colorsOpen)} tooltipPlacement="top" />
          <IconButton label="Duplicate note" icon={<Copy size={17} />} onClick={duplicateSelected} tooltipPlacement="top" />
          <IconButton label="Delete note" icon={<Trash2 size={17} />} onClick={deleteSelected} tooltipPlacement="top" />
          {colorsOpen && (
            <div className="sticky-toolbar__colors">
              <SwatchPicker label="Note colors" value={data.fillColor} options={stickySwatches} onSelect={(fillColor) => { updateSelectedNode({ fillColor }); setColorsOpen(false) }} />
            </div>
          )}
        </div>
      </NodeToolbar>
      <NodeResizer
        isVisible={selected}
        minWidth={88}
        minHeight={88}
        lineClassName="node-resizer-line"
        handleClassName="node-resizer-handle"
      />
      <div ref={measure} className="sticky-note__measure" aria-hidden="true">{data.label + '\u200b'}</div>
      {editing && selected ? (
        <textarea
          autoFocus
          onFocus={(event) => event.currentTarget.setSelectionRange(event.currentTarget.value.length, event.currentTarget.value.length)}
          className="sticky-note__editor nodrag nopan nowheel"
          aria-label="Sticky note text"
          maxLength={3000}
          value={data.label}
          onChange={(event) => updateNodeLabel(id, event.target.value)}
          onBlur={() => setEditing(false)}
          onPointerDown={stopCanvasInteraction}
          onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
            if (
              event.key === 'Enter' &&
              (event.metaKey || event.ctrlKey)
            ) {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') {
              event.stopPropagation()
              event.currentTarget.blur()
              root.current?.focus({ preventScroll: true })
            }
          }}
        />
      ) : (
        <div
          className="sticky-note__text"
          onDoubleClick={(event) => {
            event.stopPropagation()
            startEditing()
          }}
        >
          {data.label}
        </div>
      )}
    </div>
  )
}