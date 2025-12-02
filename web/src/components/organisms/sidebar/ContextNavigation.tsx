import NavMenu from '@/components/molecules/nav-menu';
import { NavSelector } from '@/components/molecules/nav-selector';
import { navigationContexts } from '@/config/navigation-contexts';
import { useNavigation } from '@/contexts/NavigationContext';
import { mockApplications } from '@/types/application';
import { NavItem } from '@/types/navigation';
import { useEffect, useRef, useState } from 'react';

import { NavigationProps } from './types';

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

        {mockApplications.map((application) => {
          const isExpanded = application.id === expandedAppId;

          const appNavItems: NavItem[] = appNavTemplate.map((item) => ({
            ...item,
            to: `/applications/${application.id}${item.to}`,
            group: 'application',
          }));

          return (
            <div key={application.id} className="flex flex-col gap-2">
              <NavSelector
                label={application.companyName}
                color={application.color || '#4285F4'}
                isExpanded={isExpanded}
                onToggle={() => {
                  userToggledRef.current = true;
                  setExpandedAppId(isExpanded ? null : application.id);
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
