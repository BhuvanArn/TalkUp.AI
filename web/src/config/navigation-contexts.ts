import { NavigationContext } from '@/types/navigation-context';

/**
 * Root level navigation context
 * Shows main app sections: Applications, CV, Notes
 */
export const rootNavigationContext: NavigationContext = {
  type: 'root',
  items: [
    {
      to: '/applications',
      labelKey: 'navigation.applications',
      icon: 'applications',
      showInNav: true,
      order: 1,
    },
    {
      to: '/cv-analysis',
      labelKey: 'navigation.cvAnalysis',
      icon: 'cv',
      showInNav: true,
      order: 2,
    },
    {
      to: '/agenda',
      labelKey: 'navigation.agenda',
      icon: 'agenda',
      showInNav: true,
      order: 3,
    },
    {
      to: '/notes',
      labelKey: 'navigation.notes',
      icon: 'notes',
      showInNav: true,
      order: 3,
    },
    {
      to: '/ai-chat',
      labelKey: 'navigation.assistant',
      icon: 'chat',
      showInNav: true,
      order: 4,
    },
  ],
};

/**
 * Application context navigation
 * Shows pages specific to an application: Roadmap, Simulations, Analytics, Notes
 */
export const applicationNavigationContext: NavigationContext = {
  type: 'application',
  items: [
    {
      to: '/roadmap',
      labelKey: 'navigation.roadmap',
      icon: 'roadmap',
      showInNav: true,
      order: 0,
    },
    {
      to: '/simulations',
      labelKey: 'navigation.simulations',
      icon: 'simulations',
      showInNav: true,
      order: 1,
    },
    {
      to: '/analytics',
      labelKey: 'navigation.analytics',
      icon: 'analytics',
      showInNav: true,
      order: 2,
    },
  ],
  parentContext: 'root',
};

/**
 * Public navigation context
 * Shows pages for unauthenticated users
 */
export const publicNavigationContext: NavigationContext = {
  type: 'public',
  items: [
    {
      to: '/',
      labelKey: 'navigation.home',
      icon: 'home',
      showInNav: true,
      order: 1,
    },
    {
      to: '/about',
      labelKey: 'navigation.about',
      icon: 'about',
      showInNav: true,
      order: 2,
    },
    {
      to: '/login',
      labelKey: 'navigation.login',
      icon: 'login',
      showInNav: true,
      order: 3,
    },
    {
      to: '/register',
      labelKey: 'navigation.register',
      icon: 'register',
      showInNav: true,
      order: 4,
    },
  ],
};

/**
 * Settings navigation context
 * Shows settings-related pages: Profile, Billing, Integrations, Security
 */
export const settingsNavigationContext: NavigationContext = {
  type: 'settings',
  items: [
    {
      to: '/settings/profile',
      labelKey: 'navigation.profile',
      icon: 'profile',
      showInNav: true,
      order: 1,
    },
    {
      to: '/settings/billing',
      labelKey: 'navigation.billing',
      icon: 'billing',
      showInNav: true,
      order: 2,
    },
    {
      to: '/settings/integrations',
      labelKey: 'navigation.integrations',
      icon: 'integrations',
      showInNav: true,
      order: 3,
    },
    {
      to: '/settings/security',
      labelKey: 'navigation.security',
      icon: 'security',
      showInNav: true,
      order: 4,
    },
  ],
};

/**
 * Organization navigation context
 * Shows the org-management area for admins/employees: Members, Invites, Settings
 */
export const organizationNavigationContext: NavigationContext = {
  type: 'organization',
  items: [
    {
      to: '/organization/members',
      labelKey: 'navigation.members',
      icon: 'members',
      showInNav: true,
      order: 1,
    },
    {
      to: '/organization/invites',
      labelKey: 'navigation.invites',
      icon: 'invites',
      showInNav: true,
      order: 2,
    },
    {
      to: '/organization/settings',
      labelKey: 'navigation.settings',
      icon: 'settings',
      showInNav: true,
      order: 3,
    },
  ],
  parentContext: 'root',
};

/**
 * Map of all navigation contexts
 */
export const navigationContexts: Record<string, NavigationContext> = {
  root: rootNavigationContext,
  application: applicationNavigationContext,
  public: publicNavigationContext,
  settings: settingsNavigationContext,
  organization: organizationNavigationContext,
};
