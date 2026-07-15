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
  // Forward args: the not-found branch depends on which variant the root asks for.
  useAuthStatus: (options?: unknown) => useAuthStatusMock(options),
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

// The shape the router actually produces for an unmatched URL: the root match
// stays `success` and carries globalNotFound. A nested `notFound()` throw is the
// `status: 'notFound'` shape instead — both must route to the 404 shell.
const notFoundState = {
  matches: [{ status: 'success', globalNotFound: true }],
  location: { pathname: '/zzz' },
};

const nestedNotFoundState = {
  matches: [{ status: 'success' }, { status: 'notFound' }],
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

  it('renders the 404 shell for a nested notFound() throw', () => {
    routerStateMock.mockReturnValue(nestedNotFoundState);
    useAuthStatusMock.mockReturnValue({
      data: { isAuthenticated: false },
      isLoading: false,
    });
    render(<RootComponent />);
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
  });

  // Committing to a variant while auth is unresolved would show an authed user the
  // anonymous page, then jump them into the sidebar layout once it settles.
  it('renders neither variant while the auth request is in flight', () => {
    routerStateMock.mockReturnValue(notFoundState);
    useAuthStatusMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<RootComponent />);
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('not-found')).not.toBeInTheDocument();
    expect(screen.getByTestId('not-found-pending')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  // Offline, the query pauses: `isPending` stays true forever and the fetch never runs,
  // so waiting on it would leave a permanently blank page. `isLoading` is false while
  // paused, so we fall through and show the anonymous page instead of hanging.
  it('shows the anonymous page rather than hanging when the query is paused', () => {
    routerStateMock.mockReturnValue(notFoundState);
    useAuthStatusMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isPending: true,
      isPaused: true,
    });
    render(<RootComponent />);
    expect(screen.queryByTestId('not-found-pending')).not.toBeInTheDocument();
    expect(screen.getByTestId('not-found')).toHaveTextContent('anon');
  });

  // The root must ask for the anonymous variant ONLY on a 404: elsewhere it shares
  // the plain cache key with the sidebar instead of fetching /auth/status twice.
  it('requests the anonymous auth variant only on a not-found match', () => {
    routerStateMock.mockReturnValue(notFoundState);
    useAuthStatusMock.mockReturnValue({
      data: { isAuthenticated: false },
      isLoading: false,
    });
    render(<RootComponent />);
    expect(useAuthStatusMock).toHaveBeenCalledWith({ anonymousAllowed: true });

    vi.clearAllMocks();
    routerStateMock.mockReturnValue({
      matches: [{ status: 'success' }],
      location: { pathname: '/applications' },
    });
    useAuthStatusMock.mockReturnValue({
      data: { isAuthenticated: true },
      isLoading: false,
    });
    render(<RootComponent />);
    expect(useAuthStatusMock).toHaveBeenCalledWith({ anonymousAllowed: false });
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
