import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { Link } from '@tanstack/react-router';

import { NavLinkProps } from './types';

/**
 * NavLink - Sidebar navigation link component
 *
 * Renders a react-router Link that contains a styled Button and an optional Icon and label.
 * Designed for use in a sidebar where the link can be collapsed to an icon-only representation
 * or expanded to show both icon and label. Visual styling is controlled by the `isActive`
 * and `isCollapsed` flags.
 *
 * Behavior:
 * - When `isCollapsed` is true, the Button is squared and the label is not rendered; the icon
 *   is centered.
 * - When `isCollapsed` is false, the Button shows the icon (if provided) followed by the label.
 * - When `isActive` is true, an "active" visual style is applied (e.g. bold / background).
 *
 * Props: NavLinkProps
 *
 * Accessibility notes:
 * - This component uses a semantic Link element; consider supplying additional ARIA attributes
 *   (for example `aria-current="page"`) from the parent when appropriate, since `isActive` only
 *   affects visual appearance and does not automatically set ARIA state.
 *
 * Returns:
 * - JSX.Element representing the navigation link.
 *
 * Example:
 * @example
 * <NavLink to="/dashboard" label="Dashboard" icon="home" isActive={true} isCollapsed={false} />
 */
const NavLink = ({
  to,
  label,
  icon,
  iconProps,
  isActive,
  isCollapsed,
}: NavLinkProps) => {
  return (
    <Link to={to} className="[&.active]:font-bold w-full h-8">
      <Button
        variant="text"
        color="sidebar"
        size="md"
        squared={isCollapsed}
        className={`w-full h-8 ${isCollapsed ? 'justify-center' : 'justify-start px-3'} ${isActive ? 'text-active bg-surface-sidebar-active' : 'text-idle'} py-2`}
      >
        {icon && (
          <Icon
            icon={icon}
            size="md"
            className={isCollapsed ? '' : 'mr-3'}
            {...iconProps}
          />
        )}
        {!isCollapsed && <span className="text-button-s">{label}</span>}
      </Button>
    </Link>
  );
};

export default NavLink;
