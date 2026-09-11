/**
 * Design tokens that JavaScript needs.
 *
 * Anything the browser can resolve stays in tokens.css. This file only
 * mirrors values that must be read by code — canvas rendering colours
 * handed to React Flow / html-to-image, animation durations passed to
 * imperative APIs, and the swatch palette the inspector renders.
 */

/** Reads a design token off the document root at runtime. */
export function readToken(name: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return value || fallback
}

/** Durations in milliseconds, mirroring --ds-duration-*. */
export const duration = {
  instant: 80,
  fast: 120,
  base: 180,
  slow: 260,
  slower: 400,
} as const

/** Canvas colours that React Flow needs as plain strings. */
export const canvasTokens = {
  dot: '--ds-color-canvas-dot',
  background: '--ds-color-canvas',
  edge: '--ds-color-edge',
  selection: '--ds-color-selection',
  nodeFill: '--ds-color-node-fill',
  nodeStroke: '--ds-color-node-stroke',
} as const

/** Fill swatches offered in the inspector, in ramp order. */
export const fillSwatches = [
  { name: 'White', token: '--ds-swatch-white', value: '#ffffff' },
  { name: 'Slate', token: '--ds-swatch-slate', value: '#eef1f6' },
  { name: 'Blue', token: '--ds-swatch-blue', value: '#dfe8ff' },
  { name: 'Teal', token: '--ds-swatch-teal', value: '#d6f0ea' },
  { name: 'Green', token: '--ds-swatch-green', value: '#ddf1e0' },
  { name: 'Yellow', token: '--ds-swatch-yellow', value: '#fbeecb' },
  { name: 'Orange', token: '--ds-swatch-orange', value: '#fde3d2' },
  { name: 'Red', token: '--ds-swatch-red', value: '#fbdfe2' },
  { name: 'Purple', token: '--ds-swatch-purple', value: '#eae1fb' },
  { name: 'Pink', token: '--ds-swatch-pink', value: '#fadff0' },
] as const

/** Bright, legible paper colours reserved for sticky notes. */
export const stickySwatches = [
  { name: 'Light yellow', value: '#fff9b1' },
  { name: 'Yellow', value: '#f5d128' },
  { name: 'Orange', value: '#ff9d48' },
  { name: 'Red', value: '#f24726' },
  { name: 'Light pink', value: '#f5b7d2' },
  { name: 'Pink', value: '#ea94bb' },
  { name: 'Violet', value: '#b384bb' },
  { name: 'Light blue', value: '#a2d5f2' },
  { name: 'Blue', value: '#6cc5ec' },
  { name: 'Cyan', value: '#a6e3e3' },
  { name: 'Light green', value: '#d5f692' },
  { name: 'Green', value: '#7ac673' },
  { name: 'Mint', value: '#9fe8c3' },
  { name: 'Lavender', value: '#d0c2f0' },
  { name: 'Gray', value: '#e6e6e6' },
  { name: 'White', value: '#ffffff' },
] as const

/** Stroke swatches, tuned to stay legible against every fill above. */
export const strokeSwatches = [
  { name: 'Ink', value: '#2e3442' },
  { name: 'Slate', value: '#5c6478' },
  { name: 'Blue', value: '#2f4ae6' },
  { name: 'Teal', value: '#0f8f86' },
  { name: 'Green', value: '#0d8850' },
  { name: 'Amber', value: '#a86a11' },
  { name: 'Red', value: '#bd2938' },
  { name: 'Purple', value: '#6b3fc4' },
] as const

/**
 * What a freshly drawn node looks like.
 *
 * These are literals rather than `readToken` calls because they are written
 * into the saved document: they must not change when the theme does, or a
 * board drawn in dark mode would come back unreadable in light mode.
 */
export const nodeDefaults = {
  fillColor: '#ffffff',
  strokeColor: '#2e3442',
  strokeWidth: 2,
} as const

export type FillSwatch = (typeof fillSwatches)[number]
export type StickySwatch = (typeof stickySwatches)[number]
export type StrokeSwatch = (typeof strokeSwatches)[number]
