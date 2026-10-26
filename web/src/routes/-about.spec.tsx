import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import About, { Route } from './about';

vi.mock('@/components/organisms/landing-nav', () => ({
  default: () => <nav data-testid="landing-nav" />,
}));

const { contactClicks } = vi.hoisted(() => ({
  contactClicks: [] as string[],
}));

vi.mock('@/utils/analytics', () => ({
  trackContactClick: (location: string) => () => contactClicks.push(location),
}));

vi.mock('@/components/organisms/landing-footer', () => ({
  default: () => <footer data-testid="landing-footer" />,
}));

describe('About route', () => {
  it('is public (no auth guard)', () => {
    expect(Route.options.beforeLoad).toBeUndefined();
  });

  it('renders the landing nav and footer around the page', () => {
    render(<About />);
    expect(screen.getByTestId('landing-nav')).toBeInTheDocument();
    expect(screen.getByTestId('landing-footer')).toBeInTheDocument();
  });

  it('has exactly one h1 with the headline', () => {
    render(<About />);
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(
      "We built the interview coach we couldn't afford.",
    );
  });

  it('lists the three values', () => {
    render(<About />);
    for (const name of ['Accessible', 'Personal', 'Concrete']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
  });

  it('lists the four team members with their roles', () => {
    render(<About />);
    const team = screen
      .getByRole('heading', { name: 'The team' })
      .closest('section') as HTMLElement;
    const members = within(team).getAllByRole('listitem');
    expect(members).toHaveLength(4);
    const expected = [
      ['ZB', 'Ziane Badarou', 'Frontend developer, communication lead'],
      ['TA', 'Toavina Andria', 'AI engineer, data analyst, DevOps'],
      ['RE', 'Regine Emagni', 'Backend, server lead'],
      ['BA', 'Bhuvan Arnaud', 'Frontend, backend, DevOps'],
    ];
    expected.forEach(([initials, name, role], i) => {
      expect(members[i]).toHaveTextContent(initials);
      expect(within(members[i]).getByText(name)).toBeInTheDocument();
      expect(within(members[i]).getByText(role)).toBeInTheDocument();
    });
  });

  it('shows where we are: working today and next', () => {
    render(<About />);
    expect(
      screen.getByRole('heading', { name: 'Where we are' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Working today' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByText('Simulations in English')).toBeInTheDocument();
  });

  it('shows the contact email as visible mailto text', () => {
    render(<About />);
    expect(
      screen.getByRole('link', { name: 'contact@talkup.ai' }),
    ).toHaveAttribute('href', 'mailto:contact@talkup.ai');
  });

  it('tracks clicks on the contact email', () => {
    const stayOnPage = (e: Event) => e.preventDefault(); // jsdom can't navigate
    document.addEventListener('click', stayOnPage);
    render(<About />);
    fireEvent.click(screen.getByRole('link', { name: 'contact@talkup.ai' }));
    expect(contactClicks).toEqual(['about']);
    document.removeEventListener('click', stayOnPage);
  });
});
