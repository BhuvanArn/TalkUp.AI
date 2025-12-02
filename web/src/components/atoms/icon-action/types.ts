import { IconName } from '../icon/icon-map';
import { IconSize } from '../icon/types';

/**
 * The color variant of the icon button
 */
export type IconActionColor =
  | 'primary'
  | 'accent'
  | 'text'
  | 'text-idle'
  | 'text-weak'
  | 'text-weakest'
  | 'error'
  | 'success'
  | 'warning';

/**
 * Props for the IconAction component
 *
 * @interface IconActionProps
 * @extends {React.ButtonHTMLAttributes<HTMLButtonElement>}
 *
 * @property {IconName | React.ComponentType} icon - The icon to display
 * @property {IconSize} [size='md'] - The size of the icon
 * @property {IconActionColor} [color='text-idle'] - The color scheme
 * @property {string} [ariaLabel] - Accessibility label (required for screen readers)
 */
export interface IconActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  size?: IconSize;
  color?: IconActionColor;
  ariaLabel?: string;
}
