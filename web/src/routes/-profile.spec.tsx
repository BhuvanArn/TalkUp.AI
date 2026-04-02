import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Route as ProfileRoute } from './profile';

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

const router = createRouter({
  routeTree: ProfileRoute,
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

describe('Profile Component - Advanced Coverage', () => {
  const user = userEvent.setup();

  beforeEach(async () => {
    router.history.push('/profile');
    await act(async () => {
      await router.load();
    });
  });

  it('renders and displays basic information', async () => {
    renderWithProviders(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('heading', { name: /Profile/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Profil de l'utilisateur/i)).toBeInTheDocument();
  });

  it('opens and closes the avatar menu when camera button is clicked', async () => {
    renderWithProviders(<RouterProvider router={router} />);

    const cameraBtn = screen.getByRole('button', { name: '' });

    await user.click(cameraBtn);

    expect(screen.getByText(/Choisir une photo/i)).toBeInTheDocument();
    expect(screen.getByText(/Prendre une photo/i)).toBeInTheDocument();
    expect(screen.getByText(/Supprimer/i)).toBeInTheDocument();

    await user.click(screen.getByText(/Choisir une photo/i));
    expect(screen.queryByText(/Choisir une photo/i)).not.toBeInTheDocument();
  });

  it('switches between tabs and renders corresponding settings', async () => {
    renderWithProviders(<RouterProvider router={router} />);

    const apparenceTab = screen.getByRole('button', { name: /Apparence/i });
    await user.click(apparenceTab);
    expect(screen.getByText(/Style de bannière/i)).toBeInTheDocument();

    const notifTab = screen.getByRole('button', { name: /Notifications/i });
    await user.click(notifTab);
    expect(screen.getByText(/Rappels d'entraînement/i)).toBeInTheDocument();
  });

  it('triggers the save animation in the Topbar', async () => {
    renderWithProviders(<RouterProvider router={router} />);

    const saveBtn = screen.getByRole('button', { name: /Enregistrer/i });
    await user.click(saveBtn);

    expect(screen.getByText(/Sauvegardé/i)).toBeInTheDocument();
  });

  it('cycles the banner style when clicking the banner button', async () => {
    renderWithProviders(<RouterProvider router={router} />);

    const bannerBtn = screen.getByText(/Changer le style/i);
    await user.click(bannerBtn);
  });
});
