import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LandingNav from './index';

const { ctaClicks, useAuthStatusMock } = vi.hoisted(() => ({
  ctaClicks: [] as string[][],
  useAuthStatusMock: vi.fn(),
}));

vi.mock('@/hooks/auth/useServices', () => ({
  useAuthStatus: (options?: unknown) => useAuthStatusMock(options),
}));

const authState = (isAuthenticated: boolean | undefined) => ({
  data:
    isAuthenticated === undefined
      ? undefined
      : { isAuthenticated, role: null, organizationId: null },
  isLoading: isAuthenticated === undefined,
});

vi.mock('@/utils/analytics', () => ({
  trackCtaClick: (location: string, target: string) => () =>
    ctaClicks.push([location, target]),
}));

vi.mock('@tanstack/react-router', () => ({
  // Drop router-only props so they don't leak onto the DOM anchor.
  Link: ({
    children,
    to,
    hash,
    onClick,
    className,
    resetScroll: _resetScroll,
    activeOptions: _activeOptions,
    ...rest
  }: any) => (
    <a
      href={hash ? `${to === '/' ? '' : to}#${hash}` : to}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {children}
    </a>
  ),
}));

vi.mock('@/components/molecules/theme-toggle', () => ({
  default: () => <div data-testid="theme-toggle" />,
}));

vi.mock('@/components/molecules/logo', () => ({
  default: () => <span data-testid="logo">Logo</span>,
}));

describe('LandingNav', () => {
  beforeEach(() => {
    useAuthStatusMock.mockReset();
    useAuthStatusMock.mockReturnValue(authState(false));
  });

  it('renders the four nav links and no removed sections', () => {
    render(<LandingNav />);
    for (const name of ['How it works', 'For schools', 'Pricing', 'About']) {
      expect(screen.getAllByRole('link', { name }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByRole('link', { name: 'Features' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Testimonials' })).toBeNull();
  });

  it('section links route to / with the landing anchor ids', () => {
    render(<LandingNav />);
    expect(
      screen.getAllByRole('link', { name: 'How it works' })[0],
    ).toHaveAttribute('href', '#how');
    expect(
      screen.getAllByRole('link', { name: 'For schools' })[0],
    ).toHaveAttribute('href', '#orgs');
    expect(screen.getAllByRole('link', { name: 'Pricing' })[0]).toHaveAttribute(
      'href',
      '#pricing',
    );
    expect(screen.getAllByRole('link', { name: 'About' })[0]).toHaveAttribute(
      'href',
      '/about',
    );
  });

  it('logo links home', () => {
    render(<LandingNav />);
    expect(screen.getByRole('link', { name: 'TalkUp home' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('tracks the register CTA from the desktop nav and the mobile menu', () => {
    ctaClicks.length = 0;
    const stayOnPage = (e: Event) => e.preventDefault(); // jsdom can't navigate
    document.addEventListener('click', stayOnPage);
    render(<LandingNav />);
    fireEvent.click(screen.getByRole('link', { name: 'Create an account' }));
    fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));
    const links = screen.getAllByRole('link', { name: 'Create an account' });
    fireEvent.click(links[links.length - 1]);
    expect(ctaClicks).toEqual([
      ['nav', '/register'],
      ['nav', '/register'],
    ]);
    document.removeEventListener('click', stayOnPage);
  });

  it('renders login + register CTAs', () => {
    render(<LandingNav />);
    expect(screen.getAllByRole('link', { name: 'Log in' })[0]).toHaveAttribute(
      'href',
      '/login',
    );
    expect(
      screen.getAllByRole('link', { name: 'Create an account' })[0],
    ).toHaveAttribute('href', '/register');
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('toggles mobile menu open and closed', () => {
    render(<LandingNav />);
    const toggle = screen.getByRole('button', { name: /toggle menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('mobile menu shows the same links and closes on click', () => {
    render(<LandingNav />);
    const toggle = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(toggle);
    for (const name of [
      'How it works',
      'For schools',
      'Pricing',
      'About',
      'Log in',
      'Create an account',
    ]) {
      expect(screen.getAllByRole('link', { name })).toHaveLength(2);
    }
    const links = screen.getAllByRole('link', { name: 'For schools' });
    fireEvent.click(links[links.length - 1]);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('mobile About link closes the menu', () => {
    render(<LandingNav />);
    const toggle = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(toggle);
    const links = screen.getAllByRole('link', { name: 'About' });
    fireEvent.click(links[links.length - 1]);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('applies scrolled style after window scroll', () => {
    render(<LandingNav />);
    const header = document.querySelector('header');
    expect(header?.className).toContain('bg-transparent');
    Object.defineProperty(window, 'scrollY', { value: 30, configurable: true });
    fireEvent.scroll(window);
    expect(header?.className).toContain('backdrop-blur');
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  describe('auth-aware CTAs', () => {
    it('reads the shared auth status query, not the anonymous variant', () => {
      render(<LandingNav />);
      expect(useAuthStatusMock).toHaveBeenCalledWith(undefined);
    });

    it('signed out: shows Log in / Create an account, not Open the app', () => {
      render(<LandingNav />);
      fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));
      expect(screen.getAllByRole('link', { name: 'Log in' })).toHaveLength(2);
      expect(
        screen.getAllByRole('link', { name: 'Create an account' }),
      ).toHaveLength(2);
      expect(screen.queryByRole('link', { name: 'Open the app' })).toBeNull();
    });

    it('signed in: shows Open the app to the app home on desktop and mobile', () => {
      useAuthStatusMock.mockReturnValue(authState(true));
      render(<LandingNav />);
      expect(
        screen.getByRole('link', { name: 'Open the app' }),
      ).toHaveAttribute('href', '/applications');
      fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));
      const links = screen.getAllByRole('link', { name: 'Open the app' });
      expect(links).toHaveLength(2);
      for (const link of links) {
        expect(link).toHaveAttribute('href', '/applications');
      }
      expect(screen.queryByRole('link', { name: 'Log in' })).toBeNull();
      expect(
        screen.queryByRole('link', { name: 'Create an account' }),
      ).toBeNull();
    });

    it('signed in: the mobile Open the app link closes the menu', () => {
      useAuthStatusMock.mockReturnValue(authState(true));
      const stayOnPage = (e: Event) => e.preventDefault(); // jsdom can't navigate
      document.addEventListener('click', stayOnPage);
      render(<LandingNav />);
      const toggle = screen.getByRole('button', { name: /toggle menu/i });
      fireEvent.click(toggle);
      const links = screen.getAllByRole('link', { name: 'Open the app' });
      fireEvent.click(links[links.length - 1]);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      document.removeEventListener('click', stayOnPage);
    });

    it('while loading: keeps the CTA space but shows and focuses neither variant', () => {
      useAuthStatusMock.mockReturnValue(authState(undefined));
      render(<LandingNav />);
      fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));
      for (const name of ['Log in', 'Create an account', 'Open the app']) {
        expect(screen.queryByRole('link', { name })).toBeNull();
      }
      // Still in the DOM (holding their space), just hidden and inert.
      const reserved = screen.getAllByText('Log in');
      expect(reserved.length).toBeGreaterThan(0);
      for (const el of reserved) {
        const group = el.closest('[aria-hidden="true"]');
        expect(group).toHaveClass('invisible');
        expect(group).toHaveAttribute('inert');
      }
      expect(
        screen.getByText('Open the app').closest('[aria-hidden="true"]'),
      ).toHaveAttribute('inert');
    });

    it('resolving the auth status keeps the desktop CTA slot mounted', () => {
      useAuthStatusMock.mockReturnValue(authState(undefined));
      const { rerender } = render(<LandingNav />);
      const slot = screen.getByText('Open the app').closest('.grid');
      useAuthStatusMock.mockReturnValue(authState(true));
      rerender(<LandingNav />);
      expect(
        screen.getByRole('link', { name: 'Open the app' }).closest('.grid'),
      ).toBe(slot);
      // The guest group stays in the slot, hidden, so its width still counts.
      expect(
        screen.getByText('Log in').closest('[aria-hidden="true"]'),
      ).toHaveClass('invisible');
    });
  });
});
