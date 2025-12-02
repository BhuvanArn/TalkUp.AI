import NavLink from '@/components/molecules/nav-link';
import { organizeNavigation } from '@/utils/navigation';
import { useRouterState } from '@tanstack/react-router';

import { NavMenuProps } from './types';

/**
 * Navigation menu component that renders navigation items from configuration
 *
 * Features:
 * - Automatic ordering of navigation items
 * - Active state tracking based on current route
 * - Support for collapsed sidebar mode
 *
 * @component
 * @example
 * ```tsx
 * <NavMenu
 *   items={navigationItems}
 *   isCollapsed={false}
 * />
 * ```
 */
export const NavMenu = ({
  items,
  className = '',
  isCollapsed = false,
}: NavMenuProps & { isCollapsed?: boolean }) => {
  const currentPath = useRouterState().location.pathname;

  const sortedItems = organizeNavigation(items);

  return (
    <nav className={className}>
      <ul className="space-y-2">
        {sortedItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              label={item.label}
              icon={item.icon}
              isActive={
                currentPath === item.to || currentPath.startsWith(`${item.to}/`)
              }
              isCollapsed={isCollapsed}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavMenu;
