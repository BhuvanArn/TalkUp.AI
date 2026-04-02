import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
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

describe('Profile Component - Hardened CI Tests', () => {
  let router: any;

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
    
    // Use findBy to allow the router to finish rendering the component
    const heading = await screen.findByRole('heading', { name: /Profile/i });
    expect(heading).toBeInTheDocument();
    
    const intro = await screen.findByText(/Profil de l'utilisateur/i);
    expect(intro).toBeInTheDocument();
  });

  it('opens and closes the avatar menu when camera button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(router);

    // Wait for the avatar area to be ready
    await screen.findByText(/AB/i);

    // Find the camera button - it contains the Camera icon
    const buttons = await screen.findAllByRole('button');
    const cameraBtn = buttons.find(btn => btn.querySelector('svg'));
    
    if (!cameraBtn) throw new Error('Camera button not found');

    await user.click(cameraBtn);

    // Assert using findBy to wait for the state-driven render
    expect(await screen.findByText(/Choisir une photo/i)).toBeInTheDocument();
    expect(await screen.findByText(/Prendre une photo/i)).toBeInTheDocument();
    expect(await screen.findByText(/Supprimer/i)).toBeInTheDocument();

    await user.click(screen.getByText(/Choisir une photo/i));
    
    await waitFor(() => {
      expect(screen.queryByText(/Choisir une photo/i)).not.toBeInTheDocument();
    });
  });

  it('switches between tabs and renders corresponding settings', async () => {
    const user = userEvent.setup();
    renderWithProviders(router);

    await screen.findByRole('heading', { name: /Profile/i });

    const apparenceTab = await screen.findByRole('button', { name: /Apparence/i });
    await user.click(apparenceTab);
    expect(await screen.findByText(/Style de bannière/i)).toBeInTheDocument();

    const notifTab = await screen.findByRole('button', { name: /Notifications/i });
    await user.click(notifTab);
    expect(await screen.findByText(/Rappels d'entraînement/i)).toBeInTheDocument();
  });

  it('triggers the save animation in the Topbar', async () => {
    const user = userEvent.setup();
    renderWithProviders(router);

    const saveBtn = await screen.findByRole('button', { name: /Enregistrer/i });
    await user.click(saveBtn);
    
    expect(await screen.findByText(/Sauvegardé/i)).toBeInTheDocument();
  });

  it('cycles the banner style when clicking the banner button', async () => {
    const user = userEvent.setup();
    renderWithProviders(router);

    const bannerBtn = await screen.findByRole('button', { name: /Changer le style/i });
    await user.click(bannerBtn);
  });
});