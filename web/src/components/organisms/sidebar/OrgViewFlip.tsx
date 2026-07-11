import { Icon } from '@/components/atoms/icon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuthStatus } from '@/hooks/auth/useServices';
import { useNavigate } from '@tanstack/react-router';
import type { CSSProperties } from 'react';

import { NavigationProps } from './types';

/** Emerald accent for the "on" (organization) state — matches the org-view
 * palette override so the switch reads as part of that theme. */
const ORG_TOGGLE_ACCENT = '#1d9e75';

/**
 * Organization-view switch.
 *
 * A compact settings-style toggle (like the Notifications toggle in the profile
 * menu) that flips between the normal app view (Applications, CV, Agenda, Notes)
 * and the organization-management view (Members, Invites, Settings). The whole
 * control is clickable and shows a hover state; expanded it also shows an icon +
 * label, collapsed it shows only the toggle pill.
 *
 * Gated to org managers only: shown exclusively for `admin` / `employee` roles
 * who belong to an organization — never for `user` or logged-out visitors,
 * the same RBAC boundary the `/organization*` routes enforce. The switch is UI
 * navigation only (it changes the active route, and therefore the route-derived
 * navigation context); it does not alter any permission.
 */
export const OrgViewFlip = ({ isCollapsed = false }: NavigationProps) => {
  const { data: auth } = useAuthStatus();
  const { contextType } = useNavigation();
  const navigate = useNavigate();

  // Gate to org managers who actually belong to an organization: the role must
  // be admin/employee AND the caller must be affiliated with an org
  // (organizationId present). A user / logged-out visitor, or a manager with no
  // org, never sees the switch.
  const isOrgManager = auth?.role === 'admin' || auth?.role === 'employee';
  const belongsToOrg = Boolean(auth?.organizationId);
  if (!isOrgManager || !belongsToOrg) {
    return null;
  }

  const isOrgView = contextType === 'organization';
  const label = 'Organization view';
  const flip = () =>
    navigate({ to: isOrgView ? '/applications' : '/organization/members' });

  // Visual toggle pill (the surrounding button carries role="switch" +
  // aria-checked, so this is purely decorative — no nested interactive control).
  const togglePill = (
    <span
      aria-hidden
      style={{ '--toggle-accent': ORG_TOGGLE_ACCENT } as CSSProperties}
      className={`relative h-5 w-9 shrink-0 rounded-full border-[0.5px] transition-[background-color,border-color] duration-200 ease-out ${
        isOrgView
          ? 'border-[color:var(--toggle-accent)] bg-[color:var(--toggle-accent)]'
          : 'border-border-strong bg-surface-raised'
      }`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 size-3.5 rounded-full bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)] transition-[left] duration-200 ease-out ${
          isOrgView ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </span>
  );

  const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  // Collapsed rail: show only the toggle pill, still fully clickable.
  if (isCollapsed) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isOrgView}
        aria-label={label}
        onClick={flip}
        className={`mx-auto flex cursor-pointer items-center justify-center rounded-lg p-1 transition-colors hover:bg-surface-sidebar-hover ${focusRing}`}
      >
        {togglePill}
      </button>
    );
  }

  // Expanded: the whole row is the switch — icon + label + pill, all clickable
  // and hoverable together.
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOrgView}
      aria-label={label}
      onClick={flip}
      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-sidebar-hover ${focusRing}`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon
          icon="organization"
          size="sm"
          className={isOrgView ? 'text-accent' : 'text-idle'}
        />
        <span className="truncate text-body-s text-idle">{label}</span>
      </span>
      {togglePill}
    </button>
  );
};

export default OrgViewFlip;
