import ToasterConfig from '@/components/atoms/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { initI18n } from '@/i18n';
import '@/styles/index';
import { initAnalytics, trackPageview } from '@/utils/analytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { routeTree } from './routeTree.gen';

initAnalytics();
// Synchronous (bundled resources): the language is set before the first render.
initI18n();

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  // __root.tsx owns the 404: it detects the not-found match itself and renders
  // <NotFoundPage /> with the auth-aware shell *instead of* <Outlet />. This
  // component only renders where the router substitutes a not-found inside an
  // <Outlet /> — a path the root's branch never reaches — so returning null
  // keeps the page from rendering a second time without its shell.
  defaultNotFoundComponent: () => null,
});

router.subscribe('onResolved', ({ toLocation }) =>
  trackPageview(toLocation.pathname),
);

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ToasterConfig />
            <RouterProvider router={router} />
            <ReactQueryDevtools initialIsOpen={false} />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
