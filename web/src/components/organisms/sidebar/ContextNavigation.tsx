import NavMenu from '@/components/molecules/nav-menu';
import { NavSelector } from '@/components/molecules/nav-selector';
import { navigationContexts } from '@/config/navigation-contexts';
import { useNavigation } from '@/contexts/NavigationContext';
import { useApplications } from '@/services/applications/hooks';
import type { ApplicationStatus } from '@/services/applications/types';
import { NavItem } from '@/types/navigation';
import { useEffect, useRef, useState } from 'react';

import { NavigationProps } from './types';

/**
 * Stable accent color per application status, derived because the real
 * Application entity carries no color field (hex tolerated here: NavSelector's
 * `color` prop expects a runtime CSS color value, not a design token).
 */
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  sent: '#2b70c9',
  interview: '#e0a82e',
  accepted: '#1d9e75',
  rejected: '#c0392b',
};

/**
 * Context-aware navigation section
 *
 * Shows navigation items specific to the current context:
 * - Application context: Shows all applications, each can be expanded to show their app-specific items
 * - Settings context: Shows settings-specific navigation items
 * - Other contexts: To be defined
 */
export const ContextNavigation = ({ isCollapsed = false }: NavigationProps) => {
  const { contextType, contextData } = useNavigation();
  // Only the application context renders the applications list, so gate the
  // query on it — otherwise the sidebar fires GET /applications on every
  // authenticated route (and can 401→refresh before auth settles).
  const { data: applications = [] } = useApplications({
    enabled: contextType === 'application',
  });
  const [expandedAppId, setExpandedAppId] = useState<string | null>(
    (contextData?.applicationId as string | undefined) || null,
  );
  const userToggledRef = useRef(false);
  const previousAppIdRef = useRef<string | undefined>(undefined);

  // Auto-expand the menu when navigating to an application page
  useEffect(() => {
    const currentAppId = contextData?.applicationId as string | undefined;

    if (currentAppId !== previousAppIdRef.current) {
      previousAppIdRef.current = currentAppId;

      if (currentAppId) {
        userToggledRef.current = false;
        setExpandedAppId(currentAppId);
      }
    }
  }, [contextData?.applicationId]);

  if (contextType === 'settings') {
    const settingsContext = navigationContexts['settings'];
    const settingsItems = settingsContext ? settingsContext.items : [];

    return (
      <div className="flex flex-col gap-2">
        <hr className="border-border mb-2" />

        <NavMenu items={settingsItems} isCollapsed={isCollapsed} />
      </div>
    );
  }

  if (contextType === 'application') {
    const applicationContext = navigationContexts['application'];
    const appNavTemplate = applicationContext ? applicationContext.items : [];

    return (
      <div className="gap-4 flex flex-col">
        <hr className="border-border mb-2" />

        {applications.map((application) => {
          const isExpanded = application.applicationId === expandedAppId;

          const appNavItems: NavItem[] = appNavTemplate.map((item) => ({
            ...item,
            to: `/applications/${application.applicationId}${item.to}`,
            group: 'application',
          }));

          return (
            <div
              key={application.applicationId}
              className="flex flex-col gap-2"
            >
              <NavSelector
                label={application.companyName ?? 'Candidature'}
                color={STATUS_COLORS[application.status] ?? '#2b70c9'}
                isExpanded={isExpanded}
                onToggle={() => {
                  userToggledRef.current = true;
                  setExpandedAppId(
                    isExpanded ? null : application.applicationId,
                  );
                }}
                isCollapsed={isCollapsed}
              />

              {isExpanded && (
                <div className={isCollapsed ? '' : 'pl-4'}>
                  <NavMenu items={appNavItems} isCollapsed={isCollapsed} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};
