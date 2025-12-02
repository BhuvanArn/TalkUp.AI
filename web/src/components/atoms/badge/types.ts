/**
 * The color scheme of the badge
 */
export type BadgeColor =
  | 'accent'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

/**
 * Props for the Badge component
 *
 * @interface BadgeProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 *
 * @property {BadgeColor} [color='accent'] - The color scheme
 * @property {string} children - The text to display in the badge
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: BadgeColor;
  children: string;
}
