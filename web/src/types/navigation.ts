import { IconName } from '@/components/atoms/icon/icon-map';
import type { ParseKeys } from 'i18next';

/**
 * Navigation item type definitions
 */
export interface NavItem {
  /** Route path */
  to: string;
  /** `app` translation key of the display label */
  labelKey: ParseKeys<'app'>;
  /** Icon name from icon-map */
  icon: IconName;
  /** Whether this item is visible in navigation */
  showInNav?: boolean;
  /** Order for sorting (lower numbers appear first) */
  order?: number;
  /** Children navigation items for nested menus */
  children?: NavItem[];
}
