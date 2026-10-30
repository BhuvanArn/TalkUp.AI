import { changeLanguage } from '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LandingFooter from './index';

const { contactClicks } = vi.hoisted(() => ({
  contactClicks: [] as string[],
}));

vi.mock('@/utils/analytics', () => ({
  trackContactClick: (location: string) => () => contactClicks.push(location),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    hash,
    className,
    resetScroll: _resetScroll,
    ...rest
  }: any) => (
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
  it('renders brand blurb and product + company columns only', () => {
    render(<LandingFooter />);
    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(
      screen.getByText(/Interview preparation built by four Epitech students/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Product' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Company' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Legal' })).toBeNull();
  });

  it('product links route to landing anchors', () => {
    render(<LandingFooter />);
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute(
      'href',
      '#how',
    );
    expect(screen.getByRole('link', { name: 'For schools' })).toHaveAttribute(
      'href',
      '#orgs',
    );
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute(
      'href',
      '#pricing',
    );
  });

  it('renders internal /about and /privacy links', () => {
    render(<LandingFooter />);
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about',
    );
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
  });

  it('shows the contact email as visible mailto text', () => {
    render(<LandingFooter />);
    expect(
      screen.getByRole('link', { name: 'contact.talkup.ai@gmail.com' }),
    ).toHaveAttribute('href', 'mailto:contact.talkup.ai@gmail.com');
  });

  it('has no dead links', () => {
    render(<LandingFooter />);
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href')).not.toBe('#');
    }
    for (const name of ['Careers', 'Terms', 'Cookies', 'Features']) {
      expect(screen.queryByRole('link', { name })).toBeNull();
    }
  });

  it('renders external social links in a new tab', () => {
    render(<LandingFooter />);
    const github = screen.getByLabelText('GitHub');
    expect(github).toHaveAttribute(
      'href',
      'https://github.com/BhuvanArn/TalkUp.AI',
    );
    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', 'noopener noreferrer');
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
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
  });

  it('tracks clicks on the contact email', () => {
    const stayOnPage = (e: Event) => e.preventDefault(); // jsdom can't navigate
    document.addEventListener('click', stayOnPage);
    render(<LandingFooter />);
    fireEvent.click(
      screen.getByRole('link', { name: 'contact.talkup.ai@gmail.com' }),
    );
    expect(contactClicks).toEqual(['footer']);
    document.removeEventListener('click', stayOnPage);
  });
});

describe('LandingFooter in French', () => {
  // setupTests pins English for every other test.
  afterEach(async () => {
    await act(() => i18next.changeLanguage('en'));
    localStorage.clear();
  });

  it('renders the blurb, columns and links in French', async () => {
    await act(() => changeLanguage('fr'));
    render(<LandingFooter />);
    expect(
      screen.getByText(
        `La préparation aux entretiens, conçue par quatre étudiants d’Epitech. © ${new Date().getFullYear()} Talkup.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Produit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Entreprise' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Confidentialité' }),
    ).toHaveAttribute('href', '/privacy');
    expect(
      screen.getByRole('list', { name: 'Réseaux sociaux' }),
    ).toBeInTheDocument();
  });
});
