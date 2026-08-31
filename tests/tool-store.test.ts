import { beforeEach, describe, expect, it } from 'vitest'
import {
  canvasModeFor,
  isSameTool,
  ownsCanvasDrag,
  SELECT_TOOL,
  useToolStore,
  type Tool,
} from '../src/stores/tool-store'
import type { DiagramNodeKind } from '../src/domain/diagram'

const shape = (kind: DiagramNodeKind): Tool => ({ kind: 'shape', shape: kind })

describe('canvasModeFor', () => {
  it('maps each tool to how the canvas should behave', () => {
    expect(canvasModeFor({ kind: 'select' })).toBe('select')
    expect(canvasModeFor({ kind: 'connector' })).toBe('connect')
    expect(canvasModeFor(shape('rectangle'))).toBe('draw')
    expect(canvasModeFor({ kind: 'pen', pen: 'marker' })).toBe('draw')
    expect(
      canvasModeFor({ kind: 'line', routing: 'straight', endArrow: 'arrow' }),
    ).toBe('draw')
  })

  it('only lets drawing tools claim a canvas drag', () => {
    expect(ownsCanvasDrag({ kind: 'select' })).toBe(false)
    expect(ownsCanvasDrag({ kind: 'connector' })).toBe(false)
    expect(ownsCanvasDrag(shape('ellipse'))).toBe(true)
  })
})

describe('isSameTool', () => {
  it('compares the variant, not just the kind', () => {
    expect(isSameTool(shape('rectangle'), shape('rectangle'))).toBe(true)
    expect(isSameTool(shape('rectangle'), shape('ellipse'))).toBe(false)
    expect(
      isSameTool({ kind: 'pen', pen: 'pen' }, { kind: 'pen', pen: 'marker' }),
    ).toBe(false)
    expect(
      isSameTool(
        { kind: 'line', routing: 'curved', endArrow: 'arrow' },
        { kind: 'line', routing: 'curved', endArrow: 'none' },
      ),
    ).toBe(false)
  })

  it('treats variant-free tools as equal by kind', () => {
    expect(isSameTool({ kind: 'select' }, { kind: 'select' })).toBe(true)
    expect(isSameTool({ kind: 'select' }, { kind: 'connector' })).toBe(false)
  })
})

describe('tool store', () => {
  beforeEach(() => {
    useToolStore.setState({
      tool: SELECT_TOOL,
      openFlyout: null,
      libraryOpen: false,
    })
  })

  it('picking the active tool again returns to Select', () => {
    const rectangle = shape('rectangle')

    useToolStore.getState().toggleTool(rectangle)
    expect(useToolStore.getState().tool).toEqual(rectangle)

    useToolStore.getState().toggleTool(rectangle)
    expect(useToolStore.getState().tool).toEqual(SELECT_TOOL)
  })

  it('switching to a different tool does not toggle off', () => {
    useToolStore.getState().toggleTool(shape('rectangle'))
    useToolStore.getState().toggleTool(shape('ellipse'))

    expect(useToolStore.getState().tool).toEqual(shape('ellipse'))
  })

  it('resetting clears the tool and any open flyout', () => {
    useToolStore.getState().setTool(shape('diamond'))
    useToolStore.getState().openFlyoutId('shapes')

    useToolStore.getState().resetTool()

    expect(useToolStore.getState().tool).toEqual(SELECT_TOOL)
    expect(useToolStore.getState().openFlyout).toBeNull()
  })

  it('opens one flyout at a time and closes on a second press', () => {
    const { toggleFlyout } = useToolStore.getState()

    toggleFlyout('shapes')
    expect(useToolStore.getState().openFlyout).toBe('shapes')

    toggleFlyout('lines')
    expect(useToolStore.getState().openFlyout).toBe('lines')

    toggleFlyout('lines')
    expect(useToolStore.getState().openFlyout).toBeNull()
  })

  it('remembers pen settings between uses', () => {
    useToolStore.getState().setPenColor('#bd2938')
    useToolStore.getState().setPenWidth(10)
    useToolStore.getState().setTool({ kind: 'pen', pen: 'highlighter' })

    expect(useToolStore.getState().penColor).toBe('#bd2938')
    expect(useToolStore.getState().penWidth).toBe(10)
  })
})

describe('tool store settings', () => {
  beforeEach(() => {
    useToolStore.setState({
      tool: SELECT_TOOL,
      openFlyout: null,
      libraryOpen: false,
      lastShape: 'rectangle',
      lastArchitecture: 'server',
      lastPen: 'pen',
    })
  })

  it('remembers the last shape and architecture node separately', () => {
    useToolStore.getState().setTool(shape('hexagon'))
    useToolStore.getState().setTool(shape('database'))

    expect(useToolStore.getState().lastShape).toBe('hexagon')
    expect(useToolStore.getState().lastArchitecture).toBe('database')
  })

  it('does not let a standalone kind overwrite the shape memory', () => {
    useToolStore.getState().setTool(shape('ellipse'))
    useToolStore.getState().setTool(shape('stickyNote'))

    expect(useToolStore.getState().lastShape).toBe('ellipse')
  })

  it('records line settings so the group button returns to them', () => {
    useToolStore
      .getState()
      .setTool({ kind: 'line', routing: 'elbow', endArrow: 'none' })

    expect(useToolStore.getState().lineRouting).toBe('elbow')
    expect(useToolStore.getState().lineArrow).toBe('none')
  })

  it('toggling through a group button still records the choice', () => {
    useToolStore.getState().toggleTool(shape('star'))
    expect(useToolStore.getState().lastShape).toBe('star')
  })

  it('opens and closes the library', () => {
    useToolStore.getState().setLibraryOpen(true)
    expect(useToolStore.getState().libraryOpen).toBe(true)
    useToolStore.getState().setLibraryOpen(false)
    expect(useToolStore.getState().libraryOpen).toBe(false)
  })

  it('closes the flyout on its own', () => {
    useToolStore.getState().openFlyoutId('pen')
    useToolStore.getState().closeFlyout()
    expect(useToolStore.getState().openFlyout).toBeNull()
  })

  it('keeps a sticky colour for the next note', () => {
    useToolStore.getState().setStickyColor('#dfe8ff')
    expect(useToolStore.getState().stickyColor).toBe('#dfe8ff')
  })
})
