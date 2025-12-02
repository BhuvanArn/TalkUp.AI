/**
 * Props for the NavSelector component.
 *
 * Provides the pieces of data and callbacks required to render and control
 * a navigation selector that can expand/collapse.
 *
 * @property label - The visible label or title for the selector (used for display and accessibility).
 * @property color - Accent color for the selector (any valid CSS color string or design token).
 * @property isExpanded - True when the selector is currently expanded; false when collapsed.
 * @property onToggle - Function invoked to toggle the expanded/collapsed state (no arguments).
 * @property isCollapsed - Optional explicit collapsed state; when present, can be used to override or indicate
 *                         a forced collapsed appearance separate from isExpanded.
 */
export interface NavSelectorProps {
  label: string;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
}
