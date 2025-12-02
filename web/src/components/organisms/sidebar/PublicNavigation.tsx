import NavMenu from '@/components/molecules/nav-menu';
import { navigationContexts } from '@/config/navigation-contexts';

import { NavigationProps } from './types';

/**
 * Public navigation section
 *
 * Shows navigation items for unauthenticated users: Home, About, Login, Sign Up
 */
export const PublicNavigation = ({ isCollapsed = false }: NavigationProps) => {
  const publicContext = navigationContexts['public'];
  const items = publicContext ? publicContext.items : [];

  return (
    <div className="flex flex-col gap-2">
      <NavMenu items={items} isCollapsed={isCollapsed} />
    </div>
  );
};
