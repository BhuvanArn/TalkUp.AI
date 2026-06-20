import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LandingPage from './index';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, hash, onClick, className, ...rest }: any) => (
    <a
      href={hash ? `${to === '/' ? '' : to}#${hash}` : to}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {children}
    </a>
  ),
  useRouterState: () => '/',
}));

vi.mock('@/components/organisms/landing-nav', () => ({
  default: () => <nav data-testid="landing-nav" />,
}));

vi.mock('@/components/organisms/landing-footer', () => ({
  default: () => <footer data-testid="landing-footer" />,
}));

vi.mock('@/components/molecules/convincing-banner/reviews.json', () => ({
  default: [
    { name: 'Alice', text: 'Great', review: 5 },
    { name: 'Bob', text: 'Solid', review: 4 },
    { name: 'Carol', text: 'Useful', review: 3 },
  ],
}));

describe('LandingPage', () => {
  it('renders nav, footer, and main sections', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('landing-nav')).toBeInTheDocument();
    expect(screen.getByTestId('landing-footer')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /ace your next interview/i }),
    ).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    render(<LandingPage />);
    expect(
      screen.getByText('Realistic interview simulations'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Behavior & emotion analysis').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Notes & journaling')).toBeInTheDocument();
  });

  it('renders steps in how-it-works', () => {
    render(<LandingPage />);
    expect(screen.getByText('Create your profile')).toBeInTheDocument();
    expect(screen.getByText('Run a simulation')).toBeInTheDocument();
    expect(screen.getByText('Review and improve')).toBeInTheDocument();
  });

  it('renders pricing tabs and switches audience on click', () => {
    render(<LandingPage />);
    const candidatesTab = screen.getByRole('tab', { name: 'For candidates' });
    const orgsTab = screen.getByRole('tab', { name: 'For organizations' });
    expect(candidatesTab).toHaveAttribute('aria-selected', 'true');
    expect(orgsTab).toHaveAttribute('aria-selected', 'false');
    fireEvent.click(orgsTab);
    expect(orgsTab).toHaveAttribute('aria-selected', 'true');
    expect(candidatesTab).toHaveAttribute('aria-selected', 'false');
  });

  it('switches pricing audience via ArrowRight key', () => {
    render(<LandingPage />);
    const candidatesTab = screen.getByRole('tab', { name: 'For candidates' });
    fireEvent.keyDown(candidatesTab, { key: 'ArrowRight' });
    expect(
      screen.getByRole('tab', { name: 'For organizations' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('switches pricing audience via ArrowLeft key (wraps)', () => {
    render(<LandingPage />);
    const candidatesTab = screen.getByRole('tab', { name: 'For candidates' });
    fireEvent.keyDown(candidatesTab, { key: 'ArrowLeft' });
    expect(
      screen.getByRole('tab', { name: 'For organizations' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('switches pricing audience via End/Home keys', () => {
    render(<LandingPage />);
    const candidatesTab = screen.getByRole('tab', { name: 'For candidates' });
    fireEvent.keyDown(candidatesTab, { key: 'End' });
    expect(
      screen.getByRole('tab', { name: 'For organizations' }),
    ).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'For organizations' }), {
      key: 'Home',
    });
    expect(screen.getByRole('tab', { name: 'For candidates' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('ignores other keys on tabs', () => {
    render(<LandingPage />);
    const candidatesTab = screen.getByRole('tab', { name: 'For candidates' });
    fireEvent.keyDown(candidatesTab, { key: 'Tab' });
    expect(candidatesTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders candidates pricing tier names by default', () => {
    render(<LandingPage />);
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByText('Free')).toBeInTheDocument();
    expect(within(panel).getByText('Lite')).toBeInTheDocument();
    expect(within(panel).getByText('Pro')).toBeInTheDocument();
  });

  it('renders organizations pricing tier names after switch', () => {
    render(<LandingPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'For organizations' }));
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByText('Member')).toBeInTheDocument();
    expect(within(panel).getByText('Business')).toBeInTheDocument();
    expect(within(panel).getByText('Enterprise')).toBeInTheDocument();
    expect(screen.getByText(/already invited/i)).toBeInTheDocument();
  });

  it('Enterprise tier uses mailto link via plain anchor', () => {
    render(<LandingPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'For organizations' }));
    const cta = screen.getByRole('link', { name: 'Contact sales' });
    expect(cta).toHaveAttribute('href', 'mailto:contact@talkup.ai');
  });

  it('renders testimonials reviews', () => {
    render(<LandingPage />);
    expect(screen.getByText(/"Great"/)).toBeInTheDocument();
    expect(screen.getByText(/"Solid"/)).toBeInTheDocument();
    expect(screen.getByText(/"Useful"/)).toBeInTheDocument();
  });

  it('renders final CTA register/login links', () => {
    render(<LandingPage />);
    const finalRegister = screen.getByRole('link', {
      name: 'Create your free account',
    });
    expect(finalRegister).toHaveAttribute('href', '/register');
    const finalLogin = screen.getByRole('link', {
      name: 'I already have an account',
    });
    expect(finalLogin).toHaveAttribute('href', '/login');
  });

  it('renders hero CTAs', () => {
    render(<LandingPage />);
    const start = screen.getByRole('link', { name: /Get started — it's free/ });
    expect(start).toHaveAttribute('href', '/register');
    const how = screen.getByRole('link', { name: /See how it works/ });
    expect(how.getAttribute('href')).toBe('#how');
  });
});
