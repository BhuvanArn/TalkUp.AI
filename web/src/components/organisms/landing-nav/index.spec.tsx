import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LandingNav from './index';

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
}));

vi.mock('@/components/molecules/theme-toggle', () => ({
  default: () => <div data-testid="theme-toggle" />,
}));

vi.mock('@/components/molecules/logo', () => ({
  default: () => <span data-testid="logo">Logo</span>,
}));

describe('LandingNav', () => {
  it('renders nav links to landing sections', () => {
    render(<LandingNav />);
    expect(
      screen.getAllByRole('link', { name: 'Features' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'How it works' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'Pricing' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'Testimonials' }).length,
    ).toBeGreaterThan(0);
  });

  it('hash links route to / with hash', () => {
    render(<LandingNav />);
    const link = screen.getAllByRole('link', { name: 'Features' })[0];
    expect(link.getAttribute('href')).toBe('#features');
  });

  it('renders login + register CTAs', () => {
    render(<LandingNav />);
    expect(
      screen.getAllByRole('link', { name: 'Log in' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'Get started' }).length,
    ).toBeGreaterThan(0);
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

  it('mobile menu nav-link click closes menu', () => {
    render(<LandingNav />);
    const toggle = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(toggle);
    const links = screen.getAllByRole('link', { name: 'Features' });
    const mobileLink = links[links.length - 1];
    fireEvent.click(mobileLink);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('applies scrolled style after window scroll', () => {
    render(<LandingNav />);
    const header = document.querySelector('header');
    expect(header?.className).toContain('bg-transparent');
    Object.defineProperty(window, 'scrollY', { value: 30, configurable: true });
    fireEvent.scroll(window);
    expect(header?.className).toContain('backdrop-blur');
  });
});
