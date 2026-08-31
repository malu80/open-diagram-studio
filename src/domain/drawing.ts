import type { DiagramNodeKind } from './diagram'
import { specFor } from './node-kinds'

/**
 * Turning a drag into a shape.
 *
 * Kept out of the component so the preview the user sees and the node that
 * gets committed are computed by the same code — if they drifted apart, shapes
 * would land somewhere other than where they were drawn.
 */

export interface DrawRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Resolves a drag between two points into a rectangle.
 *
 * With `constrain` (Shift held) the rectangle is squared off to the longer
 * drag axis, which is what makes a rectangle a perfect square and an ellipse a
 * perfect circle. The corner opposite the drag origin stays under the pointer,
 * so dragging up and left still grows the shape in that direction.
 */
export function resolveDrawRect(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  constrain = false,
): DrawRect {
  let width = Math.abs(currentX - startX)
  let height = Math.abs(currentY - startY)

  if (constrain) {
    const side = Math.max(width, height)
    width = side
    height = side
  }

  return {
    left: currentX < startX ? startX - width : startX,
    top: currentY < startY ? startY - height : startY,
    width,
    height,
  }
}

/**
 * True when this drag should be squared off — either because Shift is held or
 * because the shape reads as wrong on unequal axes. The per-kind rule lives in
 * the node-kind table so every tool agrees on it.
 */
export function shouldConstrain(
  kind: DiagramNodeKind,
  shiftHeld: boolean,
): boolean {
  return shiftHeld || specFor(kind).alwaysSquare === true
}
