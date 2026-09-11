import { useEffect, useRef } from 'react'
import {
  chordSeparator,
  isApplePlatform,
  keyLabel,
  modifierLabel,
  shiftLabel,
} from './platform'

export interface ShortcutBinding {
  /**
   * Lowercased `KeyboardEvent.key` — 'v', 'escape', 'arrowleft', '+'.
   * Pass an array to bind several keys to one action.
   */
  key: string | string[]
  /** Requires the platform's primary modifier — Cmd on Apple, Ctrl elsewhere.
   *  Omitted means the modifier must be absent, so `Cmd+V` never fires the
   *  plain `V` binding. */
  mod?: boolean
  /** `true` requires Shift, `false` forbids it, omitted ignores it. */
  shift?: boolean
  run: (event: KeyboardEvent) => void
  /** Defaults to true. */
  preventDefault?: boolean
  /** Stops the event reaching other listeners, including React Flow's. */
  stopPropagation?: boolean
  /** Allow the binding to fire while a text field has focus. Off by default,
   *  so typing "r" into a label never swaps the active tool. */
  allowInTextField?: boolean
  /** Shown in the shortcuts dialog. Bindings without one stay hidden. */
  title?: string
  /** Groups the binding in the dialog, e.g. "Tools". */
  group?: string
  /** Overrides which key is displayed, for bindings that accept several. */
  display?: string
}

const TEXT_FIELD = 'input, textarea, select, [contenteditable="true"]'

export function isTypeToEditKey(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'isComposing'>): boolean {
  return !event.metaKey && !event.ctrlKey && !event.altKey && !event.isComposing &&
    (event.key.length === 1 || event.key === 'Enter')
}

function isTextField(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.matches(TEXT_FIELD)
}

function matches(binding: ShortcutBinding, event: KeyboardEvent): boolean {
  const keys = Array.isArray(binding.key) ? binding.key : [binding.key]
  if (!keys.includes(event.key.toLowerCase())) return false

  // Cmd and Ctrl are not interchangeable: on a Mac, Ctrl+D must not fire the
  // binding written for Cmd+D, and vice versa on Windows.
  const apple = isApplePlatform()
  const primary = apple ? event.metaKey : event.ctrlKey
  const secondary = apple ? event.ctrlKey : event.metaKey
  if (Boolean(binding.mod) !== primary) return false
  if (secondary) return false

  if (binding.shift !== undefined && binding.shift !== event.shiftKey) {
    return false
  }
  return true
}

/** Renders a binding the way the current platform writes it. */
export function formatBinding(binding: ShortcutBinding): string {
  const key =
    binding.display ??
    (Array.isArray(binding.key) ? binding.key[0] : binding.key)
  const parts: string[] = []
  if (binding.mod) parts.push(modifierLabel())
  if (binding.shift) parts.push(shiftLabel())
  parts.push(keyLabel(key))
  return parts.join(chordSeparator())
}

/**
 * Central keyboard registry.
 *
 * One capture-phase listener owns every binding, so ordering is explicit and
 * a shortcut can stop React Flow's own handlers from also firing. Bindings are
 * read from a ref, so passing a fresh array each render costs nothing.
 */
export function useShortcuts(bindings: ShortcutBinding[]): void {
  const latest = useRef(bindings)

  // Written in an effect rather than during render: a ref must not be mutated
  // while rendering. Runs after every render, so the listener below always
  // sees the current closures.
  useEffect(() => {
    latest.current = bindings
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement &&
          event.target.matches('[data-type-to-edit]') && isTypeToEditKey(event)) return
      const inTextField = isTextField(event.target)
      for (const binding of latest.current) {
        if (inTextField && !binding.allowInTextField) continue
        if (!matches(binding, event)) continue
        if (binding.preventDefault !== false) event.preventDefault()
        if (binding.stopPropagation) event.stopPropagation()
        binding.run(event)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])
}
