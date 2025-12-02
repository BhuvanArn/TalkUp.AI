import { navigationContexts } from '@/config/navigation-contexts';
import { NavItem } from '@/types/navigation';
import { useRouterState } from '@tanstack/react-router';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { NavigationProvider, useNavigation } from './NavigationContext';

// Mock tanstack router
vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn(),
}));

describe('NavigationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NavigationProvider', () => {
    it('should provide navigation context to children', () => {
      (useRouterState as Mock).mockReturnValue('/applications');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current).toBeDefined();
      expect(result.current.contextType).toBeDefined();
      expect(result.current.items).toBeDefined();
      expect(result.current.isLoading).toBeDefined();
      expect(result.current.setContext).toBeDefined();
    });

    it('should default to root context', () => {
      (useRouterState as Mock).mockReturnValue('/applications');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.contextType).toBe('root');
    });

    it('should update context when route changes to login', async () => {
      (useRouterState as Mock).mockReturnValue('/login');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.contextType).toBe('public');
      });
    });

    it('should update context when route changes to signup', async () => {
      (useRouterState as Mock).mockReturnValue('/signup');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.contextType).toBe('public');
      });
    });

    it('should update context when route changes to settings', async () => {
      (useRouterState as Mock).mockReturnValue('/settings/profile');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.contextType).toBe('settings');
      });
    });

    it('should update context when route changes to application detail', async () => {
      (useRouterState as Mock).mockReturnValue('/applications/app-123');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.contextType).toBe('application');
        expect(result.current.contextData?.applicationId).toBe('app-123');
      });
    });

    it('should handle application sub-pages', async () => {
      (useRouterState as Mock).mockReturnValue(
        '/applications/app-123/simulations',
      );

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.contextType).toBe('application');
        expect(result.current.contextData?.applicationId).toBe('app-123');
      });
    });

    it('should not treat /applications alone as application context', async () => {
      (useRouterState as Mock).mockReturnValue('/applications');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.contextType).toBe('root');
        expect(result.current.contextData).toBeUndefined();
      });
    });

    it('should provide items from current context', () => {
      (useRouterState as Mock).mockReturnValue('/applications');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      const rootItems = navigationContexts['root'].items;
      expect(result.current.items).toHaveLength(rootItems.length);
    });

    it('should combine root and application items in application context', async () => {
      (useRouterState as Mock).mockReturnValue('/applications/app-123');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        const rootItemsCount = navigationContexts['root'].items.length;
        const appItemsCount = navigationContexts['application'].items.length;
        expect(result.current.items.length).toBe(
          rootItemsCount + appItemsCount,
        );
      });
    });

    it('should prefix application items with applicationId', async () => {
      (useRouterState as Mock).mockReturnValue('/applications/app-123');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        const appGroupItems = result.current.items.filter(
          (item) =>
            (item as NavItem & { group?: string }).group === 'application',
        );

        appGroupItems.forEach((item) => {
          expect(item.to).toMatch(/^\/applications\/app-123/);
        });
      });
    });

    it('should mark root items with "root" group in application context', async () => {
      (useRouterState as Mock).mockReturnValue('/applications/app-123');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        const rootGroupItems = result.current.items.filter(
          (item) => (item as NavItem & { group?: string }).group === 'root',
        );

        expect(rootGroupItems.length).toBe(
          navigationContexts['root'].items.length,
        );
      });
    });

    it('should allow manual context setting', async () => {
      (useRouterState as Mock).mockReturnValue('/applications');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.contextType).toBe('root');
      });

      act(() => {
        result.current.setContext('settings', { customData: 'test' });
      });

      await waitFor(() => {
        expect(result.current.contextType).toBe('settings');
        expect(result.current.contextData?.customData).toBe('test');
      });
    });

    it('should handle dynamic items loading', async () => {
      const mockDynamicItems: NavItem[] = [
        {
          to: '/dynamic-1',
          label: 'Dynamic Item 1',
          icon: 'settings',
          showInNav: true,
          order: 10,
        },
      ];

      // Mock a context with fetchDynamicItems
      const originalContext = navigationContexts['root'];
      navigationContexts['root'] = {
        ...originalContext,
        fetchDynamicItems: vi.fn().mockResolvedValue(mockDynamicItems),
      };

      (useRouterState as Mock).mockReturnValue('/applications');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      // Initially loading should be true or false depending on timing
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that dynamic items are included
      const dynamicItem = result.current.items.find(
        (item) => item.to === '/dynamic-1',
      );
      expect(dynamicItem).toBeDefined();

      // Restore original context
      navigationContexts['root'] = originalContext;
    });

    it('should handle dynamic items fetch error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const originalContext = navigationContexts['root'];
      navigationContexts['root'] = {
        ...originalContext,
        fetchDynamicItems: vi.fn().mockRejectedValue(new Error('Fetch failed')),
      };

      (useRouterState as Mock).mockReturnValue('/applications');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch dynamic navigation items:',
        expect.any(Error),
      );

      // Restore
      navigationContexts['root'] = originalContext;
      consoleErrorSpy.mockRestore();
    });

    it('should clear contextData when leaving application route', () => {
      const { result, rerender } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      // Start with application route
      (useRouterState as Mock).mockReturnValue('/applications/app-123');
      rerender();

      expect(result.current.contextData?.applicationId).toBe('app-123');

      // Navigate away
      (useRouterState as Mock).mockReturnValue('/cv-analysis');
      rerender();

      expect(result.current.contextData).toBeUndefined();
    });

    it('should update when pathname changes', () => {
      (useRouterState as Mock).mockReturnValue('/login');

      const { result, rerender } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.contextType).toBe('public');

      (useRouterState as Mock).mockReturnValue('/settings');
      rerender();

      expect(result.current.contextType).toBe('settings');
    });
  });

  describe('useNavigation', () => {
    it('should throw error when used outside NavigationProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useNavigation());
      }).toThrow('useNavigation must be used within NavigationProvider');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getContextFromRoute', () => {
    it('should return "public" for /login', () => {
      (useRouterState as Mock).mockReturnValue('/login');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.contextType).toBe('public');
    });

    it('should return "public" for /signup', () => {
      (useRouterState as Mock).mockReturnValue('/signup');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.contextType).toBe('public');
    });

    it('should return "settings" for /settings routes', () => {
      const settingsRoutes = [
        '/settings',
        '/settings/profile',
        '/settings/billing',
      ];

      settingsRoutes.forEach((route) => {
        (useRouterState as Mock).mockReturnValue(route);

        const { result } = renderHook(() => useNavigation(), {
          wrapper: ({ children }) => (
            <NavigationProvider>{children}</NavigationProvider>
          ),
        });

        expect(result.current.contextType).toBe('settings');
      });
    });

    it('should return "application" for /applications/:id routes', () => {
      const applicationRoutes = [
        '/applications/123',
        '/applications/abc-def',
        '/applications/123/simulations',
        '/applications/123/analytics',
      ];

      applicationRoutes.forEach((route) => {
        (useRouterState as Mock).mockReturnValue(route);

        const { result } = renderHook(() => useNavigation(), {
          wrapper: ({ children }) => (
            <NavigationProvider>{children}</NavigationProvider>
          ),
        });

        expect(result.current.contextType).toBe('application');
      });
    });

    it('should return "root" for /applications (without ID)', () => {
      (useRouterState as Mock).mockReturnValue('/applications');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.contextType).toBe('root');
    });

    it('should return "root" for other routes', () => {
      const rootRoutes = [
        '/',
        '/cv-analysis',
        '/agenda',
        '/notes',
        '/unknown-route',
      ];

      rootRoutes.forEach((route) => {
        (useRouterState as Mock).mockReturnValue(route);

        const { result } = renderHook(() => useNavigation(), {
          wrapper: ({ children }) => (
            <NavigationProvider>{children}</NavigationProvider>
          ),
        });

        expect(result.current.contextType).toBe('root');
      });
    });
  });

  describe('context data extraction', () => {
    it('should extract applicationId from route', () => {
      (useRouterState as Mock).mockReturnValue('/applications/my-app-123');

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.contextData?.applicationId).toBe('my-app-123');
    });

    it('should extract applicationId from sub-routes', () => {
      (useRouterState as Mock).mockReturnValue(
        '/applications/my-app-123/simulations/sim-456',
      );

      const { result } = renderHook(() => useNavigation(), {
        wrapper: ({ children }) => (
          <NavigationProvider>{children}</NavigationProvider>
        ),
      });

      expect(result.current.contextData?.applicationId).toBe('my-app-123');
    });
  });
});
