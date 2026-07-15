import LandingNav from '@/components/organisms/landing-nav';
import Sidebar from '@/components/organisms/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { useAuthStatus } from '@/hooks/auth/useServices';
import {
  Outlet,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useState } from 'react';

import NotFoundPage from './-not-found';

const PUBLIC_SHELL_PATHS = new Set<string>([
  '/',
  '/login',
  '/register',
  '/register-organization',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]);

const PUBLIC_NAV_PATHS = new Set<string>(['/about']);

const RootComponent = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = useRouterState({
    select: (s) => s.resolvedLocation?.pathname ?? s.location.pathname,
  });
  // A 404 matches no path, so PUBLIC_SHELL_PATHS can't classify it — ask the
  // router directly. Verified against @tanstack/router-core Matches.d.ts:49,72.
  const isNotFoundMatch = useRouterState({
    select: (s) =>
      s.matches.some((m) => m.status === 'notFound' || m.globalNotFound),
  });
  // 404s run no route guard, so AuthContext never populates — read the query.
  // `anonymousAllowed` stops a logged-out 401 from escalating to refresh-then-redirect:
  // the interceptor's no-redirect list is keyed on pathname and a 404 URL is never on it,
  // so without this an anonymous visitor lands on /login instead of this page.
  // Only on a 404: elsewhere this shares the plain cache key with the rest of the app
  // (the sidebar's OrgViewFlip), rather than fetching /auth/status a second time.
  const { data: authStatus } = useAuthStatus({
    anonymousAllowed: isNotFoundMatch,
  });
  const { isAuthenticated } = useAuth();
  const usePublicShell = PUBLIC_SHELL_PATHS.has(pathname);
  const usePublicNav = PUBLIC_NAV_PATHS.has(pathname) && !isAuthenticated;

  if (isNotFoundMatch) {
    const isAuthed = authStatus?.isAuthenticated ?? false;

    if (!isAuthed) {
      return (
        <NavigationProvider>
          <div className="min-h-screen w-full bg-background text-text">
            <NotFoundPage isAuthenticated={false} />
            <TanStackRouterDevtools position="top-right" />
          </div>
        </NavigationProvider>
      );
    }

    return (
      <NavigationProvider>
        <div
          className={`grid h-screen w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'grid-cols-[64px_1fr]' : 'grid-cols-[256px_1fr]'}`}
        >
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          <main className="overflow-auto w-full bg-background">
            <NotFoundPage isAuthenticated />
          </main>
          <TanStackRouterDevtools position="top-right" />
        </div>
      </NavigationProvider>
    );
  }

  if (usePublicShell) {
    return (
      <NavigationProvider>
        <div className="min-h-screen w-full bg-background text-text">
          <Outlet />
          <TanStackRouterDevtools position="top-right" />
        </div>
      </NavigationProvider>
    );
  }

  if (usePublicNav) {
    return (
      <NavigationProvider>
        <div className="min-h-screen w-full bg-background text-text">
          <LandingNav />
          <main>
            <Outlet />
          </main>
          <TanStackRouterDevtools position="top-right" />
        </div>
      </NavigationProvider>
    );
  }

  return (
    <NavigationProvider>
      <div
        className={`grid h-screen w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'grid-cols-[64px_1fr]' : 'grid-cols-[256px_1fr]'}`}
      >
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="overflow-auto w-full bg-white">
          <Outlet />
        </main>
        <TanStackRouterDevtools position="top-right" />
      </div>
    </NavigationProvider>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
