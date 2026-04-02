import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Route as ProfileRoute } from './profile';

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

vi.mock('@/utils/auth.guards', () => ({
  createAuthGuard: vi.fn(() => () => Promise.resolve()),
}));

const renderWithProviders = (router: any) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
};

describe('Profile Component - CI Hardened Tests', () => {
  let router: any;
  const user = userEvent.setup();

  beforeEach(async () => {
    const history = createMemoryHistory({ initialEntries: ['/profile'] });
    router = createRouter({
      routeTree: ProfileRoute,
      history,
    });
    await router.load();
  });

  it('renders and displays basic information', async () => {
    renderWithProviders(router);
    expect(
      await screen.findByRole('heading', { name: /Profile/i }),
    ).toBeInTheDocument();
  });

  it('opens the avatar menu via the camera button', async () => {
    renderWithProviders(router);

    const cameraBtn = await screen.findByTestId('avatar-camera-button');
    await user.click(cameraBtn);

    expect(
      await screen.findByTestId('avatar-dropdown-menu'),
    ).toBeInTheDocument();
  });

  it('switches between tabs using stable panel selectors', async () => {
    renderWithProviders(router);

    const apparenceTab = await screen.findByTestId('tab-apparence');
    await user.click(apparenceTab);
    expect(await screen.findByTestId('appearance-panel')).toBeInTheDocument();

    const notifTab = await screen.findByTestId('tab-notifs');
    await user.click(notifTab);
    expect(
      await screen.findByTestId('notifications-panel'),
    ).toBeInTheDocument();
  });

  it('triggers the save animation', async () => {
    renderWithProviders(router);

    const saveBtn = await screen.findByRole('button', { name: /Enregistrer/i });
    await user.click(saveBtn);

    expect(await screen.findByText(/Sauvegard/i)).toBeInTheDocument();
  });

  it('interacts with the banner style button', async () => {
    renderWithProviders(router);
    const bannerBtn = await screen.findByTestId('banner-style-button');
    await user.click(bannerBtn);
  });
});
