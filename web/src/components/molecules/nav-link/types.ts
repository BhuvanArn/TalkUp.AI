import { IconName } from '@/components/atoms/icon/icon-map';
import { IconProps } from '@/components/atoms/icon/types';

/**
 * Props for a navigation link component used in the application's sidebar/top navigation.
 *
 * @remarks
 * This interface describes the shape of props expected by a NavLink component:
 * - "to" is the target route or URL.
 * - "label" is the accessible, visible text for the link.
 * - Optional icon configuration allows an icon to be rendered alongside the label.
 *
 * @property to - The destination path or URL the link navigates to.
 * @property label - The visible text label for the navigation link.
 * @property icon - (optional) Name of the icon to render (uses IconName).
 * @property iconProps - (optional) Additional props forwarded to the Icon component; 'icon' is omitted.
 * @property isActive - (optional) When true, indicates the link corresponds to the current route (used for active styling).
 * @property isCollapsed - (optional) When true, the navigation is rendered in a collapsed state (typically hides labels).
 *
 * @public
 */
export interface NavLinkProps {
  to: string;
  label: string;
  icon?: IconName;
  iconProps?: Omit<IconProps, 'icon'>;
  isActive?: boolean;
  isCollapsed?: boolean;
}
