import { navigationContexts } from '@/config/navigation-contexts';
import { NavItem } from '@/types/navigation';
import { NavigationContextType } from '@/types/navigation-context';
import { useRouterState } from '@tanstack/react-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface NavigationContextValue {
  /** Current navigation context type */
  contextType: NavigationContextType;
  /** Navigation items for current context */
  items: NavItem[];
  /** Loading state for dynamic items */
  isLoading: boolean;
  /** Set the navigation context manually */
  setContext: (
    type: NavigationContextType,
    contextData?: Record<string, unknown>,
  ) => void;
  /** Context data (e.g., application ID) */
  contextData?: Record<string, unknown>;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined,
);

/**
 * Determines navigation context based on current route
 */
function getContextFromRoute(pathname: string): NavigationContextType {
  // Public routes
  if (pathname === '/login' || pathname === '/signup') {
    return 'public';
  }

  // Settings routes
  if (pathname.startsWith('/settings')) {
    return 'settings';
  }

  // Application-specific routes
  // Pattern: /applications/:applicationId (but not /applications alone)
  // This includes both the application detail page and sub-pages (simulations, analytics, notes)
  if (pathname.match(/^\/applications\/[^/]+/)) {
    return 'application';
  }

  // Default to root context
  return 'root';
}

/**
 * Navigation Context Provider
 *
 * Provides navigation context to the entire application.
 * Automatically updates based on the current route.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <NavigationProvider>
 *       <Sidebar />
 *       <MainContent />
 *     </NavigationProvider>
 *   );
 * }
 * ```
 */
export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [contextType, setContextType] = useState<NavigationContextType>('root');
  const [contextData, setContextData] = useState<Record<string, unknown>>();
  const [dynamicItems, setDynamicItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update context when route changes
  useEffect(() => {
    const newContext = getContextFromRoute(pathname);
    setContextType(newContext);

    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'applications' && pathParts[1]) {
      setContextData({ applicationId: pathParts[1] });
    } else {
      setContextData(undefined);
    }
  }, [pathname]);

  // Fetch dynamic navigation items when context changes
  useEffect(() => {
    const context = navigationContexts[contextType];
    if (!context) return;

    if (context.fetchDynamicItems) {
      setIsLoading(true);
      context
        .fetchDynamicItems()
        .then((items) => {
          setDynamicItems(items);
        })
        .catch((error) => {
          console.error('Failed to fetch dynamic navigation items:', error);
          setDynamicItems([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setDynamicItems([]);
    }
  }, [contextType]);

  const context = navigationContexts[contextType];
  let allItems = context ? [...context.items, ...dynamicItems] : [];

  if (contextType === 'application' && contextData?.applicationId) {
    const rootContext = navigationContexts['root'];
    const rootItems = rootContext
      ? rootContext.items.map((item) => ({ ...item, group: 'root' }))
      : [];

    const appItems = allItems.map((item) => ({
      ...item,
      to: `/applications/${contextData.applicationId}${item.to}`,
      group: 'application',
    }));

    allItems = [...rootItems, ...appItems];
  }

  const value: NavigationContextValue = {
    contextType,
    items: allItems,
    isLoading,
    setContext: (type, data) => {
      setContextType(type);
      setContextData(data);
    },
    contextData,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Hook to access navigation context
 *
 * @throws {Error} If used outside NavigationProvider
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const { contextType, items } = useNavigation();
 *   return <NavMenu items={items} />;
 * }
 * ```
 */
export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
