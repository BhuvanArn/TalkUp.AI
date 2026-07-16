import { Avatar } from '@/components/atoms/avatar';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import IconAction from '@/components/atoms/icon-action';
import Logo from '@/components/molecules/logo';
import NotificationBanner from '@/components/molecules/notification-banner';
import { UserProfileSwitcher } from '@/components/molecules/user-profile-switcher';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useGetMyOrganization } from '@/hooks/organization/useServices';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { ContextNavigation } from './ContextNavigation';
import { OrgViewFlip } from './OrgViewFlip';
import { PublicNavigation } from './PublicNavigation';
import { RootNavigation } from './RootNavigation';
import { SidebarProps } from './types';

/** Up to two initials from the org name, e.g. "Acme Corp" -> "AC". */
const orgInitials = (name: string) =>
  name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

/**
 * Sidebar organism component with context-aware navigation
 *
 * Features:
 * - Logo and branding
 * - Link integrations (Google, LinkedIn)
 * - Three-part navigation system:
 *   1. Root navigation (Applications, CV, Notes)
 *   2. Context navigation (Application-specific items with label)
 *   3. Account menu (Settings, docs, help, theme, logout) on the profile control
 * - Notification banner
 * - User profile switcher
 *
 * The navigation automatically updates based on the current route context:
 * - Root context: Shows only root navigation
 * - Application context: Shows root + application-specific navigation with label
 * - Settings context: Shows root + settings-specific navigation
 *
 * @component
 */
const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const { isLoading, contextType } = useNavigation();
  const { isAuthenticated } = useAuth();
  const [notificationVisible, setNotificationVisible] = useState(true);

  // In the organization view the brand color is remapped to emerald via the
  // `data-view="organization"` token override (see tailwind.css +
  // NavigationContext); only what was blue (logo/title, active nav, links)
  // turns green — surfaces are untouched.
  const isOrgView = contextType === 'organization';

  // Org name for the sidebar marker; only fetched while in the org view.
  const { data: org } = useGetMyOrganization(isOrgView);

  return (
    <aside
      className={`h-screen bg-surface-sidebar px-4 pt-4 pb-5 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      <div className={`${isCollapsed && 'w-8'} flex flex-col gap-4 h-full`}>
        <div
          className={`${isCollapsed ? 'gap-4' : 'gap-5.5'} flex shrink-0 flex-col`}
        >
          <div
            className={`flex gap-3 items-center justify-between ${isCollapsed ? 'flex-col' : 'flex-row'}`}
          >
            <Link className="flex items-center gap-2" to="/">
              <Logo variant={isCollapsed ? 'no-text' : 'line'} color="accent" />
            </Link>
            <Button
              variant="text"
              color="sidebar"
              squared
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <Icon
                icon={isCollapsed ? 'expand-sidebar' : 'collapse-sidebar'}
              />
            </Button>
          </div>

          {!isCollapsed && (
            <div className="flex w-full justify-between items-center">
              <p className="text-label-s text-idle">Link Integrations</p>
              <div className="flex gap-1 p-1 bg-surface-sidebar-active rounded-md">
                <IconAction icon="google" size="sm" />
                <IconAction icon="linkedin" size="sm" color="accent" />
              </div>
            </div>
          )}

          <hr className="border-border" />
        </div>

        {!isAuthenticated ? (
          <div className="min-h-0 flex-1 overflow-y-auto w-full">
            {/* Public navigation (Unauthenticated) */}
            <PublicNavigation isCollapsed={isCollapsed} />
          </div>
        ) : (
          <>
            {/* Scrollable middle: nav + notification banner. `min-h-0` lets this
                region actually shrink and scroll on short viewports, so the
                bottom cluster below is never pushed off / clipped. */}
            <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto">
              {/* Organization-view marker: shows the org name so the header is
                  useful (the flip switch below already signals the view). */}
              {isOrgView && !isCollapsed && org && (
                <div className="flex shrink-0 items-center gap-2 rounded-md bg-surface-sidebar-active px-3 py-2 text-accent">
                  <Avatar
                    src={org.profile_picture ?? undefined}
                    alt=""
                    fallback={orgInitials(org.organization_name)}
                    size="xs"
                    className="shrink-0 border border-border bg-accent-weak text-accent"
                  />
                  <span className="truncate text-button-s">
                    {org.organization_name}
                  </span>
                </div>
              )}

              {/* Root navigation (Applications, CV, Notes) — hidden in the org
                  view, where the sidebar shows only the org sections. */}
              {!isOrgView && <RootNavigation isCollapsed={isCollapsed} />}

              {isLoading ? (
                <div className="flex items-center justify-center h-20">
                  <span className="text-idle text-label-s">Loading...</span>
                </div>
              ) : (
                /* Context navigation (Application label + app-specific items) */
                <ContextNavigation isCollapsed={isCollapsed} />
              )}

              {/* Notification Banner — inside the scroll region so it scrolls
                  away instead of pushing the profile off-screen. */}
              {!isCollapsed && notificationVisible && (
                <NotificationBanner
                  badge="New"
                  title="TalkUp new AI content"
                  description="Explore the new AI content we have prepared for you in 2026"
                  ctaText="Try it out"
                  ctaIcon="arrow-right-up"
                  onCtaClick={() => console.log('CTA clicked')}
                  onDismiss={() => setNotificationVisible(false)}
                />
              )}
            </div>

            {/* Bottom cluster: never shrinks, so the flip switch + profile stay
                fully visible at any viewport height. */}
            <div className="flex shrink-0 flex-col gap-4">
              <hr className="border-border" />

              {/* RBAC-gated flip between the normal and organization views
                  (renders nothing for user / logged-out). */}
              <OrgViewFlip isCollapsed={isCollapsed} />

              <UserProfileSwitcher isCollapsed={isCollapsed} />
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
