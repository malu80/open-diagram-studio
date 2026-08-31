import { create } from 'zustand'
import type {
  ArrowHead,
  DiagramNodeKind,
  EdgeRouting,
} from '../domain/diagram'
import { strokeSwatches } from '../design-system/tokens'
import { specFor } from '../domain/node-kinds'

export type PenType = 'pen' | 'marker' | 'highlighter' | 'eraser'

/**
 * What the pointer does on the canvas.
 *
 * One union rather than the three booleans this replaced. Every interaction
 * decision — React Flow's props, which flyout is open, what a drag creates —
 * reads from here, so a tool can never look active without behaving that way.
 */
export type Tool =
  | { kind: 'select' }
  | { kind: 'connector' }
  /** Covers every draggable node: shapes, text, sticky notes, frames, icons. */
  | { kind: 'shape'; shape: DiagramNodeKind }
  | { kind: 'line'; routing: EdgeRouting; endArrow: ArrowHead }
  | { kind: 'pen'; pen: PenType }

/** Which rail group has its flyout showing. */
export type FlyoutId = 'shapes' | 'lines' | 'sticky' | 'pen' | 'architecture'

export type CanvasMode = 'select' | 'connect' | 'draw'

/** How React Flow should behave for a tool. */
export function canvasModeFor(tool: Tool): CanvasMode {
  switch (tool.kind) {
    case 'select':
      return 'select'
    case 'connector':
      return 'connect'
    default:
      return 'draw'
  }
}

/** True when a drag on the canvas belongs to the tool rather than the board. */
export function ownsCanvasDrag(tool: Tool): boolean {
  return canvasModeFor(tool) === 'draw'
}

export const SELECT_TOOL: Tool = { kind: 'select' }

/** Two tools are the same choice if their kind and their variant match. */
export function isSameTool(a: Tool, b: Tool): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'shape' && b.kind === 'shape') return a.shape === b.shape
  if (a.kind === 'pen' && b.kind === 'pen') return a.pen === b.pen
  if (a.kind === 'line' && b.kind === 'line') {
    return a.routing === b.routing && a.endArrow === b.endArrow
  }
  return true
}

interface ToolState {
  tool: Tool
  openFlyout: FlyoutId | null
  libraryOpen: boolean

  /** Remembered across uses, so picking the pen again keeps your last ink. */
  penColor: string
  penWidth: number
  stickyColor: string

  /* What each rail group returns to when its button is pressed. Pressing
     "Shapes" should give you the shape you last drew, not always a rectangle. */
  lastShape: DiagramNodeKind
  lastArchitecture: DiagramNodeKind
  lastPen: PenType
  lineRouting: EdgeRouting
  lineArrow: ArrowHead

  setTool: (tool: Tool) => void
  /** Picking the active tool again returns to Select. */
  toggleTool: (tool: Tool) => void
  resetTool: () => void
  openFlyoutId: (id: FlyoutId) => void
  toggleFlyout: (id: FlyoutId) => void
  closeFlyout: () => void
  setLibraryOpen: (open: boolean) => void
  setPenColor: (color: string) => void
  setPenWidth: (width: number) => void
  setStickyColor: (color: string) => void
}

export const useToolStore = create<ToolState>((set, get) => ({
  tool: SELECT_TOOL,
  openFlyout: null,
  libraryOpen: false,
  penColor: strokeSwatches[0].value,
  penWidth: 4,
  stickyColor: '#fbeecb',

  lastShape: 'rectangle',
  lastArchitecture: 'server',
  lastPen: 'pen',
  lineRouting: 'straight',
  lineArrow: 'arrow',

  // Recording the choice here rather than at each call site means every route
  // into a tool — rail, flyout, library, keyboard — updates the memory.
  setTool: (tool) =>
    set(() => {
      if (tool.kind === 'shape') {
        const group = specFor(tool.shape).group
        if (group === 'architecture') {
          return { tool, lastArchitecture: tool.shape }
        }
        if (group === 'shape') return { tool, lastShape: tool.shape }
      }
      if (tool.kind === 'pen') return { tool, lastPen: tool.pen }
      if (tool.kind === 'line') {
        return { tool, lineRouting: tool.routing, lineArrow: tool.endArrow }
      }
      return { tool }
    }),
  toggleTool: (tool) => {
    if (isSameTool(get().tool, tool)) {
      set({ tool: SELECT_TOOL })
      return
    }
    get().setTool(tool)
  },
  resetTool: () => set({ tool: SELECT_TOOL, openFlyout: null }),
  openFlyoutId: (id) => set({ openFlyout: id }),
  toggleFlyout: (id) =>
    set((state) => ({ openFlyout: state.openFlyout === id ? null : id })),
  closeFlyout: () => set({ openFlyout: null }),
  setLibraryOpen: (libraryOpen) => set({ libraryOpen }),
  setPenColor: (penColor) => set({ penColor }),
  setPenWidth: (penWidth) => set({ penWidth }),
  setStickyColor: (stickyColor) => set({ stickyColor }),
}))
