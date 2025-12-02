import { IconName } from '@/components/atoms/icon/icon-map';

/**
 * Navigation item type definitions
 */
export interface NavItem {
  /** Route path */
  to: string;
  /** Display label */
  label: string;
  /** Icon name from icon-map */
  icon: IconName;
  /** Whether this item is visible in navigation */
  showInNav?: boolean;
  /** Order for sorting (lower numbers appear first) */
  order?: number;
  /** Children navigation items for nested menus */
  children?: NavItem[];
}
