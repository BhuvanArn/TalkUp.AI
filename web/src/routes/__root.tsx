import Sidebar from '@/components/organisms/sidebar';
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
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]);

const RootComponent = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = useRouterState({
    select: (s) => s.resolvedLocation?.pathname ?? s.location.pathname,
  });
  const usePublicShell = PUBLIC_SHELL_PATHS.has(pathname);

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
