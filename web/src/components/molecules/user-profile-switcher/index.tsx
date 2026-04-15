import { Avatar } from '@/components/atoms/avatar';
import { Icon } from '@/components/atoms/icon';
import { useTheme } from '@/contexts/ThemeContext';
import { useLogout } from '@/hooks/auth/useLogout';
import { fetchMyProfile } from '@/services/users/http';
import { cn } from '@/utils/cn';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ConfirmModal } from '../confirm-modal';
import { UserProfileSwitcherProps } from './types';

const DOCUMENTATION_URL =
  import.meta.env.VITE_DOCUMENTATION_URL ?? 'https://talkupai.online';

const menuPanelClass =
  'min-w-[220px] rounded-xl border border-border bg-surface-raised p-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10';

const menuItemClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-body-s font-medium text-text transition-colors hover:bg-surface-sidebar-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const DEFAULT_AVATAR_COLOR = '#2B70C9';

function getDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  username?: string | null,
) {
  const fullName = [firstName?.trim(), lastName?.trim()]
    .filter(Boolean)
    .join(' ');
  return fullName || username?.trim() || 'User';
}

/**
 * UserProfileSwitcher
 *
 * A small user profile UI component that toggles between a compact (collapsed) and expanded view
 * and provides a logout confirmation flow.
 *
 * Behavior:
 * - When isCollapsed is true, the component renders a centered avatar and a menu icon button.
 * - When isCollapsed is false, the whole profile row (avatar, name, email, menu icon) is one
 *   button that toggles the account menu; Log out still uses a confirmation modal.
 * - Opening the confirmation modal sets internal state; confirming invokes the logout() function
 *   obtained from useLogout() and closes the modal; cancelling simply closes the modal.
 *
 * Accessibility:
 * - The avatar image includes descriptive alt text ("User Avatar"). Consumers should ensure that
 *   IconAction and ConfirmModal expose appropriate keyboard and ARIA support (focusable button,
 *   aria-label/aria-haspopup for the action, role/aria-modal for the dialog, etc.).
 *
 * Props:
 * @param isCollapsed - boolean flag that controls layout:
 *                       - true: render avatar-only, centered
 *                       - false: render avatar + user name + user email + caret action
 *
 * Side effects:
 * - Uses the useLogout hook to perform the actual logout when the user confirms in the modal.
 *
 * Styling / layout:
 * - Uses flex layout with fixed height (h-8) and avatar size (w-8 h-8), with border and rounded
 *   appearance; assumes surrounding design system classes (e.g. Tailwind utilities).
 *
 * Implementation notes:
 * - Current implementation contains hard-coded user display values (name, email, avatar src).
 *   For production use, pass user data via props or context rather than hard-coding.
 *
 * Example:
 * <UserProfileSwitcher isCollapsed={false} />
 */
export const UserProfileSwitcher = ({
  isCollapsed,
}: UserProfileSwitcherProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useLogout();
  const { theme, toggleTheme } = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchMyProfile,
    staleTime: Infinity,
  });

  const displayName = getDisplayName(
    profile?.firstName,
    profile?.lastName,
    profile?.username,
  );
  const displayEmail = profile?.email ?? 'No email set';
  const avatarSrc = profile?.profilePicture ?? undefined;
  const avatarColor = profile?.avatarAccentColor ?? DEFAULT_AVATAR_COLOR;
  const initials =
    (profile?.firstName?.trim().charAt(0) || 'A').toUpperCase() +
    (profile?.lastName?.trim().charAt(0) || 'B').toUpperCase();

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  useEffect(() => {
    if (!menuOpen) return;

    const onDocMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const openDocumentation = () => {
    window.open(DOCUMENTATION_URL, '_blank', 'noopener,noreferrer');
    closeMenu();
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative z-20',
        isCollapsed
          ? 'flex flex-col items-center gap-1'
          : 'flex w-full min-h-10 items-stretch',
      )}
    >
      {isCollapsed ? (
        <Avatar
          src={avatarSrc}
          alt="User Avatar"
          fallback={initials}
          size="sm"
          className="!h-8 !w-8 !border border-border text-white font-semibold"
          style={{ backgroundColor: avatarColor }}
        />
      ) : (
        <button
          type="button"
          className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg py-0.5 pl-0.5 pr-1 text-left transition-colors hover:bg-surface-sidebar-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Open account menu, ${displayName}`}
          onClick={toggleMenu}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <Avatar
              src={avatarSrc}
              alt=""
              fallback={initials}
              size="sm"
              className="!h-8 !w-8 shrink-0 !border border-border text-white font-semibold"
              style={{ backgroundColor: avatarColor }}
            />
            <span className="min-w-0 flex flex-col text-left">
              <span className="truncate text-body-s text-idle">
                {displayName}
              </span>
              <span className="truncate text-body-s text-idle/60">
                {displayEmail}
              </span>
            </span>
          </span>
          <Icon
            icon="more-vert"
            size="sm"
            color="neutral"
            className="pointer-events-none shrink-0"
            aria-hidden
          />
        </button>
      )}

      {menuOpen && (
        <div
          className={cn(
            'absolute z-[200]',
            isCollapsed
              ? 'bottom-full left-1/2 mb-1 -translate-x-1/2'
              : 'bottom-full right-0 mb-1',
          )}
          role="menu"
          aria-label="Account"
        >
          <div className={menuPanelClass}>
            <Link
              to="/profile"
              className={menuItemClass}
              role="menuitem"
              onClick={closeMenu}
            >
              <Icon
                icon="profile"
                size="sm"
                color="neutral"
                className="shrink-0"
              />
              Profile
            </Link>
            <button
              type="button"
              role="menuitem"
              className={menuItemClass}
              onClick={openDocumentation}
            >
              <Icon
                icon="documentation"
                size="sm"
                color="neutral"
                className="shrink-0"
              />
              Documentation
            </button>
            <Link
              to="/about"
              className={menuItemClass}
              role="menuitem"
              onClick={closeMenu}
            >
              <Icon
                icon="chat"
                size="sm"
                color="neutral"
                className="shrink-0"
              />
              Help Center
            </Link>

            <hr className="my-1 border-border" />

            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
              <button
                type="button"
                role="menuitem"
                className="flex size-9 items-center justify-center rounded-lg text-text transition-colors hover:bg-surface-sidebar-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
                aria-label={
                  theme === 'light'
                    ? 'Switch to dark theme'
                    : 'Switch to light theme'
                }
                onClick={() => toggleTheme()}
              >
                <Icon
                  icon={theme === 'light' ? 'moon' : 'sun'}
                  size="sm"
                  color="neutral"
                />
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-body-s font-medium text-error transition-colors hover:bg-error-weaker/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
                onClick={() => {
                  closeMenu();
                  setShowLogoutModal(true);
                }}
              >
                <span>Log out</span>
                <Icon
                  icon="power"
                  size="sm"
                  color="error"
                  className="shrink-0"
                />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        icon="warning"
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};
