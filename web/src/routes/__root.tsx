import LandingNav from '@/components/organisms/landing-nav';
import Sidebar from '@/components/organisms/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import {
  Outlet,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useState } from 'react';

const PUBLIC_SHELL_PATHS = new Set<string>([
  '/',
  '/privacy',
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
  const { isAuthenticated } = useAuth();
  const usePublicShell = PUBLIC_SHELL_PATHS.has(pathname);
  const usePublicNav = PUBLIC_NAV_PATHS.has(pathname) && !isAuthenticated;

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
