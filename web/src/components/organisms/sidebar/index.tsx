import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import IconAction from '@/components/atoms/icon-action';
import Logo from '@/components/molecules/logo';
import NotificationBanner from '@/components/molecules/notification-banner';
import { UserProfileSwitcher } from '@/components/molecules/user-profile-switcher';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { ActionNavigation } from './ActionNavigation';
import { ContextNavigation } from './ContextNavigation';
import { PublicNavigation } from './PublicNavigation';
import { RootNavigation } from './RootNavigation';
import { SidebarProps } from './types';

/**
 * Sidebar organism component with context-aware navigation
 *
 * Features:
 * - Logo and branding
 * - Link integrations (Google, LinkedIn)
 * - Three-part navigation system:
 *   1. Root navigation (Applications, CV, Notes)
 *   2. Context navigation (Application-specific items with label)
 *   3. Action navigation (Settings, Help - always at bottom)
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
  const { isLoading } = useNavigation();
  const { isAuthenticated } = useAuth();
  const [notificationVisible, setNotificationVisible] = useState(true);

  return (
    <aside
      className={`h-screen bg-surface-sidebar p-4 transition-all ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      <div className={`${isCollapsed && 'w-8'} flex flex-col gap-4 h-full`}>
        <div className={`${isCollapsed ? 'gap-4' : 'gap-5.5'} flex flex-col`}>
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
          <div className="flex-1 overflow-y-auto w-full">
            {/* Public navigation (Unauthenticated) */}
            <PublicNavigation isCollapsed={isCollapsed} />
          </div>
        ) : (
          <>
            {/* Root navigation (Applications, CV, Notes) */}
            <RootNavigation isCollapsed={isCollapsed} />

            <div className="flex-1 overflow-y-auto w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-20">
                  <span className="text-idle text-label-s">Loading...</span>
                </div>
              ) : (
                <>
                  {/* Context navigation (Application label + app-specific items) */}
                  <ContextNavigation isCollapsed={isCollapsed} />
                </>
              )}
            </div>

            {/* Notification Banner */}
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

            {/* Action navigation (Settings & Help) */}
            <ActionNavigation isCollapsed={isCollapsed} />

            <hr className="border-border" />

            <UserProfileSwitcher isCollapsed={isCollapsed} />
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
