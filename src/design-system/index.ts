/**
 * Diagram Studio design system — public entry point.
 *
 * Import styles once at the app root:
 *   import 'src/design-system/styles.css'
 *
 * Import components from here, never from the files directly, so the
 * internal layout can change without touching call sites.
 */
export { Button, type ButtonProps, type ButtonVariant, type ControlSize } from './components/Button'
export { IconButton, type IconButtonProps } from './components/IconButton'
export { Tooltip, type TooltipProps, type TooltipPlacement } from './components/Tooltip'
export {
  Field,
  TextInput,
  ColorInput,
  RangeInput,
  SwatchPicker,
  type FieldProps,
  type TextInputProps,
  type SwatchPickerProps,
} from './components/Field'
export { Panel, PanelHeader, PanelSection, type PanelProps } from './components/Panel'
export { Toolbar, Divider, type ToolbarProps } from './components/Toolbar'
export {
  StatusDot,
  Badge,
  Kbd,
  Spinner,
  EmptyState,
  type StatusTone,
  type SpinnerProps,
  type EmptyStateProps,
} from './components/Feedback'
export {
  SegmentedControl,
  type SegmentedOption,
  type SegmentedControlProps,
} from './components/SegmentedControl'
export {
  readToken,
  duration,
  canvasTokens,
  fillSwatches,
  nodeDefaults,
  stickySwatches,
  strokeSwatches,
  type FillSwatch,
  type StickySwatch,
  type StrokeSwatch,
} from './tokens'
