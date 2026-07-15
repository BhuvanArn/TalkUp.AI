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
  //
  // The flag is scoped to 404s so every other route keeps sharing the plain cache key
  // with the rest of the app (the sidebar's OrgViewFlip) instead of fetching twice.
  // The authed 404 does still pay one extra fetch — it holds the anonymous key while the
  // sidebar it renders holds the plain one. Left as-is: the flag keys the cache entry, so
  // deriving it from this query's own result would flip the key once auth resolved and
  // re-fetch under the plain key anyway, rather than saving the request.
  //
  // `isLoading`, not `isPending`: pending stays true while a fetch is *paused* (offline),
  // where the query function never runs, so the wait below would never end.
  const { data: authStatus, isLoading: authLoading } = useAuthStatus({
    anonymousAllowed: isNotFoundMatch,
  });
  const { isAuthenticated } = useAuth();
  const usePublicShell = PUBLIC_SHELL_PATHS.has(pathname);
  const usePublicNav = PUBLIC_NAV_PATHS.has(pathname) && !isAuthenticated;

  if (isNotFoundMatch) {
    const isAuthed = authStatus?.isAuthenticated ?? false;

    // Navigating into a 404 swaps this query's cache key, so `data` is briefly
    // undefined. Every part of this page differs by auth state (logo, CTAs, sidebar),
    // so there is nothing neutral to show: committing to a variant here would send an
    // authed user to the anonymous page and then jump them into the sidebar layout.
    // Only a real in-flight fetch waits — an offline/paused query falls through and
    // renders the anonymous variant rather than hanging on a blank page.
    if (authLoading) {
      return (
        <div
          className="min-h-screen w-full bg-background"
          role="status"
          aria-busy="true"
          aria-label="Loading"
          data-testid="not-found-pending"
        />
      );
    }

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
