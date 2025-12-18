import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Route as ProgressionRoute } from './progression';

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

vi.mock('@/utils/auth.guards', () => ({
  createAuthGuard: vi.fn(() => () => Promise.resolve()),
}));

const rootRoute = createRouter({
  routeTree: ProgressionRoute,
}).routeTree;

const router = createRouter({
  routeTree: rootRoute,
  history: createMemoryHistory(),
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{component}</AuthProvider>
    </QueryClientProvider>,
  );
};

describe('Progression', () => {
  beforeEach(async () => {
    router.history.push('/progression');

    await act(async () => {
      await router.load();
    });
  });

  it('renders the main heading correctly', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('heading', { name: /Progression/i }),
    ).toBeInTheDocument();
  });

  it('renders the descriptive paragraph correctly', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    const paragraph = await screen.findByText(/Visualize your evolution/i);
    expect(paragraph).toBeInTheDocument();
    expect(paragraph.tagName).toBe('P');
  });

  it('renders both heading and paragraph in the document', async () => {
    renderWithProviders(<RouterProvider router={router} />);

    const heading = await screen.findByRole('heading', {
      name: /Progression/i,
    });
    expect(heading.tagName).toBe('H1');

    const paragraph = screen.getByText(/Visualize your evolution/i);
    expect(paragraph.tagName).toBe('P');

    const mainContainer = heading.closest('.grid');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('grid');
  });
});
