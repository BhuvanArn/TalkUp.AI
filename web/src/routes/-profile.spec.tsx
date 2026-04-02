import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { render, screen} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route as ProfileRoute } from './profile';

// ... (mocks localStorage et auth.guards identiques)

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

describe('Profile Component - Production Ready Tests', () => {
  let router: any;
  const user = userEvent.setup();

  beforeEach(async () => {
    const history = createMemoryHistory({ initialEntries: ['/profile'] });
    router = createRouter({ routeTree: ProfileRoute, history });
    await router.load();
  });

  it('renders and displays basic information', async () => {
    renderWithProviders(router);
    expect(await screen.findByRole('heading', { name: /Profile/i })).toBeInTheDocument();
    expect(screen.getByText(/Profil de l'utilisateur/i)).toBeInTheDocument();
  });

  it('opens the avatar menu via the camera button', async () => {
    renderWithProviders(router);
    
    // Utilisation du test-id au lieu de chercher "AB" ou un SVG vague
    const cameraBtn = await screen.findByTestId('avatar-camera-button');
    await user.click(cameraBtn);

    // On vérifie que le menu est apparu
    expect(await screen.findByTestId('avatar-menu')).toBeInTheDocument();
    expect(screen.getByText(/Choisir une photo/i)).toBeInTheDocument();
  });

  it('switches between tabs using stable selectors', async () => {
    renderWithProviders(router);

    // Test onglet Apparence
    const apparenceTab = await screen.findByTestId('tab-apparence');
    await user.click(apparenceTab);
    expect(await screen.findByText(/Style de bannière/i)).toBeInTheDocument();

    // Test onglet Notifications
    const notifTab = await screen.findByTestId('tab-notifs');
    await user.click(notifTab);
    expect(await screen.findByText(/Rappels d'entraînement/i)).toBeInTheDocument();
  });

  it('triggers the save animation', async () => {
    renderWithProviders(router);
    
    const saveBtn = await screen.findByRole('button', { name: /Enregistrer/i });
    await user.click(saveBtn);
    
    // Attendre que le texte de succès apparaisse (géré par Topbar)
    expect(await screen.findByText(/Sauvegardé/i)).toBeInTheDocument();
  });

  it('interacts with the banner style button', async () => {
    renderWithProviders(router);
    const bannerBtn = await screen.findByTestId('banner-style-button');
    await user.click(bannerBtn);
    // Le test passe si le clic ne crash pas
  });
});