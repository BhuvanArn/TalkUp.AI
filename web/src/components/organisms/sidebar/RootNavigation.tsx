import NavMenu from '@/components/molecules/nav-menu';
import { navigationContexts } from '@/config/navigation-contexts';

import { NavigationProps } from './types';

/**
 * Root navigation section
 *
 * Shows the main navigation items: Applications, CV, Notes
 * In collapsed mode, shows icon-only squared buttons
 */
export const RootNavigation = ({ isCollapsed = false }: NavigationProps) => {
  const rootContext = navigationContexts['root'];
  const rootItems = rootContext ? rootContext.items : [];

  return (
    <div>
      <NavMenu items={rootItems} isCollapsed={isCollapsed} />
    </div>
  );
};
