export interface RouteConfig {
  path: string;
  requiresAuth: boolean;
  roles?: string[];
}

export const routeConfigs: RouteConfig[] = [
  // Public routes
  { path: '/', requiresAuth: false },
  { path: '/login', requiresAuth: false },
  { path: '/register', requiresAuth: false },
  { path: '/verify-email', requiresAuth: false },
  { path: '/forgot-password', requiresAuth: false },
  { path: '/reset-password', requiresAuth: false },
  { path: '/about', requiresAuth: false },
  { path: '/register-organization', requiresAuth: false },

  // Protected routes - Main pages
  { path: '/profile', requiresAuth: true },
  { path: '/cv-analysis', requiresAuth: true },
  { path: '/simulations', requiresAuth: true },
  { path: '/progression', requiresAuth: true },
  { path: '/diary', requiresAuth: true },
  { path: '/ai-chat', requiresAuth: true },

  // Protected routes - Applications
  { path: '/applications', requiresAuth: true },
  { path: '/applications/$applicationId/', requiresAuth: true },
  { path: '/applications/$applicationId/dashboard', requiresAuth: true },
  { path: '/applications/$applicationId/simulations', requiresAuth: true },
  { path: '/applications/$applicationId/analytics', requiresAuth: true },

  // Protected routes - Notes
  { path: '/notes', requiresAuth: true },
  { path: '/notes/$noteId', requiresAuth: true },

  // Protected routes - Settings
  { path: '/settings/', requiresAuth: true },
  { path: '/settings/profile', requiresAuth: true },
  { path: '/settings/security', requiresAuth: true },
  { path: '/settings/billing', requiresAuth: true },
  { path: '/settings/integrations', requiresAuth: true },

  // Protected routes - Agenda
  { path: '/agenda', requiresAuth: true },

  // Protected routes - Organization (F12/F13/F14) — org-manager only
  { path: '/organization', requiresAuth: true, roles: ['admin', 'employee'] },
  { path: '/organization/', requiresAuth: true, roles: ['admin', 'employee'] },
  {
    path: '/organization/members',
    requiresAuth: true,
    roles: ['admin', 'employee'],
  },
  {
    path: '/organization/invites',
    requiresAuth: true,
    roles: ['admin', 'employee'],
  },
  {
    path: '/organization/settings',
    requiresAuth: true,
    roles: ['admin', 'employee'],
  },
];

/**
 * Retrieves the route configuration object that matches the specified path.
 *
 * @param path - The path string to search for in the route configurations.
 * @returns The corresponding `RouteConfig` object if found; otherwise, `undefined`.
 */
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return routeConfigs.find((config) => config.path === path);
};

/**
 * Determines whether a given route path requires authentication.
 *
 * @param path - The route path to check.
 * @returns `true` if the route requires authentication, otherwise `false`.
 */
export const isProtectedRoute = (path: string): boolean => {
  const config = getRouteConfig(path);
  return config?.requiresAuth ?? false;
};

/**
 * Determines if a given route path is public.
 *
 * @param path - The route path to check.
 * @returns `true` if the route is public, otherwise `false`.
 */
export const isPublicRoute = (path: string): boolean => {
  return !isProtectedRoute(path);
};
