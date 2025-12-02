import NavMenu from '@/components/molecules/nav-menu';
import { globalNavigationItems } from '@/config/navigation-contexts';

import { NavigationProps } from './types';

/**
 * Global action navigation section
 *
 * Shows global actions that are always available:
 * - Settings
 * - Help Center
 *
 * This component is displayed at the bottom of the sidebar navigation area.
 */
export const ActionNavigation = ({ isCollapsed }: NavigationProps) => {
  return (
    <div>
      <NavMenu items={globalNavigationItems} isCollapsed={isCollapsed} />
    </div>
  );
};
