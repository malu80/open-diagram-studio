import { describe, expect, it } from 'vitest'
import { isTypeToEditKey } from '../src/features/shortcuts/use-shortcuts'

describe('type-to-edit shortcut precedence', () => {
  const event = { key: 'r', metaKey: false, ctrlKey: false, altKey: false, isComposing: false }

  it('lets selected notes receive printable keys and Enter', () => {
    for (const key of ['r', 'N', ' ', '1', '.', 'Enter']) {
      expect(isTypeToEditKey({ ...event, key })).toBe(true)
    }
  })

  it('preserves command shortcuts, navigation, deletion, and composition', () => {
    for (const key of ['Escape', 'ArrowLeft', 'Backspace', 'Delete', 'Tab']) {
      expect(isTypeToEditKey({ ...event, key })).toBe(false)
    }
    for (const modifier of ['metaKey', 'ctrlKey', 'altKey', 'isComposing']) {
      expect(isTypeToEditKey({ ...event, [modifier]: true })).toBe(false)
    }
  })
})