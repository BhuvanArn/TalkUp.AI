import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LandingFooter from './index';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, hash, className, ...rest }: any) => (
    <a
      href={hash ? `${to === '/' ? '' : to}#${hash}` : to}
      className={className}
      {...rest}
    >
      {children}
    </a>
  ),
}));

vi.mock('@/components/molecules/logo', () => ({
  default: () => <span data-testid="logo">Logo</span>,
}));

describe('LandingFooter', () => {
  it('renders product, company, legal columns', () => {
    render(<LandingFooter />);
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
  });

  it('renders internal /about link via router Link', () => {
    render(<LandingFooter />);
    const about = screen.getByRole('link', { name: 'About' });
    expect(about).toHaveAttribute('href', '/about');
  });

  it('renders hash link routed to / with hash', () => {
    render(<LandingFooter />);
    const features = screen.getByRole('link', { name: 'Features' });
    expect(features.getAttribute('href')).toBe('#features');
  });

  it('renders mailto contact link as plain anchor', () => {
    render(<LandingFooter />);
    const contact = screen.getByRole('link', { name: 'Contact' });
    expect(contact).toHaveAttribute('href', 'mailto:contact@talkup.ai');
  });

  it('renders external social links', () => {
    render(<LandingFooter />);
    expect(screen.getByLabelText('GitHub')).toHaveAttribute(
      'href',
      'https://github.com/BhuvanArn/TalkUp.AI',
    );
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute(
      'href',
      'https://www.linkedin.com/company/talkup-ai/',
    );
    expect(screen.getByLabelText('Instagram')).toHaveAttribute(
      'href',
      'https://www.instagram.com/talkup.ai/',
    );
  });

  it('renders current year in copyright', () => {
    render(<LandingFooter />);
    const year = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${year} TalkUp.AI`)),
    ).toBeInTheDocument();
  });
});
