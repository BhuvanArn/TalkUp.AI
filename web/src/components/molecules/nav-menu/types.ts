import { NavItem } from '@/types/navigation';

/**
 * Props for the NavMenu component
 */
export interface NavMenuProps {
  /** Navigation items to render */
  items: NavItem[];
  /** Additional CSS classes */
  className?: string;
}
