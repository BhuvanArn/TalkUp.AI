import IconAction from '@/components/atoms/icon-action';
import { useLogout } from '@/hooks/auth/useLogout';
import { useState } from 'react';

import { ConfirmModal } from '../confirm-modal';
import { UserProfileSwitcherProps } from './types';

/**
 * UserProfileSwitcher
 *
 * A small user profile UI component that toggles between a compact (collapsed) and expanded view
 * and provides a logout confirmation flow.
 *
 * Behavior:
 * - When isCollapsed is true, the component renders a centered avatar only.
 * - When isCollapsed is false, the component renders an avatar, the user's name and email, and an
 *   action button (caret) that opens a logout confirmation modal.
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
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const { logout } = useLogout();

  return (
    <div
      className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-8`}
    >
      {isCollapsed ? (
        <img
          src="/avatar.png"
          alt="User Avatar"
          className="w-8 h-8 rounded-full object-cover border border-border"
        />
      ) : (
        <>
          <div className="flex gap-2 items-center">
            <img
              src="/avatar.png"
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover border border-border"
            />
            <div className="flex flex-col">
              <p className="text-body-s text-idle">Adam Gouffy</p>
              <p className="text-body-s text-idle/60">adam.gouffy@gmail.com</p>
            </div>
          </div>
          <IconAction
            icon="caret-up-down"
            size="sm"
            onClick={() => setShowLogoutMenu(true)}
          />
        </>
      )}

      <ConfirmModal
        isOpen={showLogoutMenu}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        icon="warning"
        onConfirm={() => {
          logout();
          setShowLogoutMenu(false);
        }}
        onCancel={() => setShowLogoutMenu(false)}
      />
    </div>
  );
};
