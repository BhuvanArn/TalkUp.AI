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
      label: 'Applications',
      icon: 'applications',
      showInNav: true,
      order: 1,
    },
    {
      to: '/cv-analysis',
      label: 'CV Analysis',
      icon: 'cv',
      showInNav: true,
      order: 2,
    },
    {
      to: '/agenda',
      label: 'Agenda',
      icon: 'agenda',
      showInNav: true,
      order: 3,
    },
    {
      to: '/notes',
      label: 'Notes',
      icon: 'notes',
      showInNav: true,
      order: 3,
    },
    {
      to: '/ai-chat',
      label: 'Assistant',
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
      label: 'Roadmap',
      icon: 'roadmap',
      showInNav: true,
      order: 0,
    },
    {
      to: '/simulations',
      label: 'Simulations',
      icon: 'simulations',
      showInNav: true,
      order: 1,
    },
    {
      to: '/analytics',
      label: 'Analytics',
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
      label: 'Home',
      icon: 'home',
      showInNav: true,
      order: 1,
    },
    {
      to: '/about',
      label: 'About',
      icon: 'about',
      showInNav: true,
      order: 2,
    },
    {
      to: '/login',
      label: 'Login',
      icon: 'login',
      showInNav: true,
      order: 3,
    },
    {
      to: '/register',
      label: 'Register',
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
      label: 'Profile',
      icon: 'profile',
      showInNav: true,
      order: 1,
    },
    {
      to: '/settings/billing',
      label: 'Billing',
      icon: 'billing',
      showInNav: true,
      order: 2,
    },
    {
      to: '/settings/integrations',
      label: 'Integrations',
      icon: 'integrations',
      showInNav: true,
      order: 3,
    },
    {
      to: '/settings/security',
      label: 'Security',
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
      label: 'Members',
      icon: 'members',
      showInNav: true,
      order: 1,
    },
    {
      to: '/organization/invites',
      label: 'Invites',
      icon: 'invites',
      showInNav: true,
      order: 2,
    },
    {
      to: '/organization/settings',
      label: 'Settings',
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
