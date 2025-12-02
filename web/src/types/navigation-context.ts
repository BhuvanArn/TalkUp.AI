import { NavItem } from './navigation';

/**
 * Navigation context type
 * Defines different contexts where navigation can appear
 */
export type NavigationContextType =
  | 'root' // Root level navigation (/, /applications, /cv)
  | 'application' // Inside a specific application
  | 'public' // Public pages (login, signup)
  | 'settings'; // Settings pages

/**
 * Navigation context configuration
 * Defines what navigation items should appear in each context
 */
export interface NavigationContext {
  /** The type of context */
  type: NavigationContextType;
  /** Static navigation items for this context */
  items: NavItem[];
  /** Function to fetch dynamic navigation items (e.g., from API) */
  fetchDynamicItems?: () => Promise<NavItem[]>;
  /** Parent context (for breadcrumb/back navigation) */
  parentContext?: NavigationContextType;
}
