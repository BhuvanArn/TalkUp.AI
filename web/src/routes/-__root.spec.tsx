import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Route } from './__root';

const routerStateMock = vi.fn();
const useAuthStatusMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Outlet: () => <div data-testid="outlet" />,
  createRootRoute: (opts: any) => ({ options: opts }),
  useRouterState: ({ select }: any) => select(routerStateMock()),
  Link: ({ children, to, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@tanstack/react-router-devtools', () => ({
  TanStackRouterDevtools: () => null,
}));

vi.mock('@/hooks/auth/useServices', () => ({
  useAuthStatus: () => useAuthStatusMock(),
}));

vi.mock('@/components/organisms/sidebar', () => ({
  default: () => <div data-testid="sidebar" />,
}));

vi.mock('@/components/organisms/landing-nav', () => ({
  default: () => <div data-testid="landing-nav" />,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock('@/contexts/NavigationContext', () => ({
  NavigationProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('./-not-found', () => ({
  default: ({ isAuthenticated }: { isAuthenticated: boolean }) => (
    <div data-testid="not-found">{isAuthenticated ? 'authed' : 'anon'}</div>
  ),
}));

const RootComponent = (Route as any).options.component;

const notFoundState = {
  matches: [{ status: 'notFound' }],
  location: { pathname: '/zzz' },
};

describe('RootComponent not-found shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStatusMock.mockReturnValue({ data: undefined, isLoading: true });
  });

  it('hides the sidebar for an anonymous visitor', () => {
    routerStateMock.mockReturnValue(notFoundState);
    useAuthStatusMock.mockReturnValue({
      data: { isAuthenticated: false },
      isLoading: false,
    });
    render(<RootComponent />);
    expect(screen.getByTestId('not-found')).toHaveTextContent('anon');
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('hides the sidebar while auth status is still loading', () => {
    routerStateMock.mockReturnValue(notFoundState);
    useAuthStatusMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<RootComponent />);
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('shows the sidebar for an authed user', () => {
    routerStateMock.mockReturnValue(notFoundState);
    useAuthStatusMock.mockReturnValue({
      data: { isAuthenticated: true },
      isLoading: false,
    });
    render(<RootComponent />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('not-found')).toHaveTextContent('authed');
  });

  it('leaves a matched app route on the normal sidebar shell', () => {
    routerStateMock.mockReturnValue({
      matches: [{ status: 'success' }],
      location: { pathname: '/applications' },
    });
    useAuthStatusMock.mockReturnValue({
      data: { isAuthenticated: true },
      isLoading: false,
    });
    render(<RootComponent />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByTestId('not-found')).not.toBeInTheDocument();
  });

  it('leaves a matched public route on the public shell', () => {
    routerStateMock.mockReturnValue({
      matches: [{ status: 'success' }],
      location: { pathname: '/login' },
    });
    useAuthStatusMock.mockReturnValue({
      data: { isAuthenticated: false },
      isLoading: false,
    });
    render(<RootComponent />);
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByTestId('not-found')).not.toBeInTheDocument();
  });
});
