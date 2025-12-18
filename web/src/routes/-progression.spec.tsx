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

/**
 * Test suite for the Progression component.
 * Verifies that the component renders its content correctly within a TanStack Router context.
 */
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
    const progressionParagraph = (
      await screen.findAllByText(/Progression/i)
    ).find((el) => el.tagName === 'P');
    expect(progressionParagraph).toBeInTheDocument();
  });

  it('renders both heading and paragraph in the document', async () => {
    const { container } = renderWithProviders(
      <RouterProvider router={router} />,
    );

    const progressionTexts = await screen.findAllByText(/Progression/i);

    expect(progressionTexts).toHaveLength(2);

    expect(progressionTexts[0].tagName).toBe('H1');
    expect(progressionTexts[1].tagName).toBe('P');

    expect(container.firstChild).toHaveClass('p-2');
  });
});
