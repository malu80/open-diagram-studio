import { describe, expect, it } from 'vitest'
import { resolveDrawRect, shouldConstrain } from '../src/domain/drawing'

describe('resolveDrawRect', () => {
  it('measures a drag down and to the right', () => {
    expect(resolveDrawRect(10, 20, 110, 80)).toEqual({
      left: 10,
      top: 20,
      width: 100,
      height: 60,
    })
  })

  it('keeps the origin corner fixed when dragging up and to the left', () => {
    expect(resolveDrawRect(110, 80, 10, 20)).toEqual({
      left: 10,
      top: 20,
      width: 100,
      height: 60,
    })
  })

  it('squares off to the longer axis when constrained', () => {
    expect(resolveDrawRect(0, 0, 100, 40, true)).toEqual({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    })
  })

  it('grows a constrained shape toward the drag direction', () => {
    expect(resolveDrawRect(100, 100, 40, 20, true)).toEqual({
      left: 20,
      top: 20,
      width: 80,
      height: 80,
    })
  })

  it('collapses a click with no movement to zero', () => {
    expect(resolveDrawRect(50, 50, 50, 50)).toEqual({
      left: 50,
      top: 50,
      width: 0,
      height: 0,
    })
  })
})

describe('shouldConstrain', () => {
  it('constrains any shape while Shift is held', () => {
    expect(shouldConstrain('rectangle', true)).toBe(true)
    expect(shouldConstrain('ellipse', true)).toBe(true)
  })

  it('leaves shapes free otherwise', () => {
    expect(shouldConstrain('rectangle', false)).toBe(false)
  })

  it('always squares off a diamond', () => {
    expect(shouldConstrain('diamond', false)).toBe(true)
  })

  it('allows a sticky note to be drawn as a rectangle', () => {
    expect(shouldConstrain('stickyNote', false)).toBe(false)
  })
})
