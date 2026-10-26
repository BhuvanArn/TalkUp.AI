import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LandingPage from './index';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    hash,
    search,
    resetScroll: _resetScroll,
    ...rest
  }: any) => {
    const base = to === '/' ? '' : to;
    const query = search ? `?${new URLSearchParams(search).toString()}` : '';
    const href = hash ? `${base}#${hash}` : `${to}${query}`;
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
  useRouterState: () => '/',
}));

vi.mock('@/components/organisms/landing-nav', () => ({
  default: () => <nav data-testid="landing-nav" />,
}));

vi.mock('@/components/organisms/landing-footer', () => ({
  default: () => <footer data-testid="landing-footer" />,
}));

const usePublicStatsMock = vi.fn();
vi.mock('@/hooks/stats/usePublicStats', () => ({
  usePublicStats: () => usePublicStatsMock(),
}));

const trackEventMock = vi.fn();
const heroVariantMock = vi.fn(() => 'a');
vi.mock('@/utils/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/analytics')>();
  return {
    ...actual,
    getHeroVariant: () => heroVariantMock(),
    trackEvent: (...args: unknown[]) => trackEventMock(...args),
    trackCtaClick: (location: string, target: string) => () =>
      trackEventMock('cta_click', { location, target }),
  };
});

const statsResult = (totalAccounts?: number, extra = {}) => ({
  data: totalAccounts === undefined ? undefined : { totalAccounts },
  isLoading: false,
  isError: false,
  ...extra,
});

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePublicStatsMock.mockReturnValue(statsResult(1284));
    heroVariantMock.mockReturnValue('a');
  });

  it('renders nav, footer and a single h1', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('landing-nav')).toBeInTheDocument();
    expect(screen.getByTestId('landing-footer')).toBeInTheDocument();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('The interview before the interview.');
  });

  it.each([
    ['a', 'The interview before the interview.'],
    ['b', 'Speak right. Land the job.'],
  ])('renders hero variant %s and reports the view', (variant, headline) => {
    heroVariantMock.mockReturnValue(variant);
    render(<LandingPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: headline }),
    ).toBeInTheDocument();
    expect(trackEventMock).toHaveBeenCalledWith('hero_view', {
      heroVariant: variant,
    });
  });

  it('renders every section heading in order', () => {
    render(<LandingPage />);
    const h2s = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent);
    expect(h2s).toEqual([
      'From job offer to interview',
      'Feedback while you speak',
      'Know what to bring up',
      'Built for people with everything to prove out loud',
      'For schools, bootcamps and career services',
      'Pricing',
      'Speak with confidence. Land the job.',
    ]);
  });

  it('renders hero CTAs to register and the how-it-works anchor', () => {
    render(<LandingPage />);
    const [heroCta] = screen.getAllByRole('link', {
      name: 'Analyze my CV and an offer',
    });
    expect(heroCta).toHaveAttribute('href', '/register');
    expect(
      screen.getByRole('link', { name: 'See how it works' }),
    ).toHaveAttribute('href', '#how');
    expect(
      screen.getByText('CV in PDF. Simulations are held in French for now.'),
    ).toBeInTheDocument();
  });

  it('exposes the decorative mocks as labelled images without controls', () => {
    render(<LandingPage />);
    const roadmap = screen.getByRole('img', { name: /example roadmap/i });
    const verbal = screen.getByRole('img', {
      name: /live verbal analysis panel/i,
    });
    for (const mock of [roadmap, verbal]) {
      expect(mock.querySelectorAll('a, button')).toHaveLength(0);
    }
    expect(within(roadmap).getByText('Start simulation')).toBeInTheDocument();
    expect(within(roadmap).getByText('HIGH')).toBeInTheDocument();
    expect(within(roadmap).getByText('Gap')).toBeInTheDocument();
    expect(within(verbal).getByText('Clarity')).toBeInTheDocument();
  });

  it('renders the problem band as a description list', () => {
    render(<LandingPage />);
    expect(
      screen.getByText(
        'A strong profile can still lose the job in a bad interview.',
      ),
    ).toBeInTheDocument();
    for (const term of ['Stress', 'Improvising', 'No feedback']) {
      expect(screen.getByText(term).tagName).toBe('DT');
    }
  });

  it('renders the four how-it-works steps inside #how', () => {
    render(<LandingPage />);
    const how = document.getElementById('how') as HTMLElement;
    expect(how).not.toBeNull();
    const steps = within(how)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(steps).toEqual(['Analyze', 'Prepare', 'Rehearse', 'Adjust']);
  });

  it('renders the talking points list and audiences', () => {
    render(<LandingPage />);
    const list = screen.getByRole('list', {
      name: 'Example interview talking points',
    });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    for (const who of ['Students', 'Recent graduates', 'Career changers']) {
      expect(
        screen.getByRole('heading', { level: 3, name: who }),
      ).toBeInTheDocument();
    }
  });

  it('routes organization CTAs and shows the members table', () => {
    render(<LandingPage />);
    const orgs = document.getElementById('orgs') as HTMLElement;
    expect(
      within(orgs).getByRole('link', { name: 'Create an organization' }),
    ).toHaveAttribute('href', '/register-organization');
    expect(
      within(orgs).getByRole('link', { name: 'I have an invite code' }),
    ).toHaveAttribute('href', '/register?code=');
    const table = within(orgs).getByRole('table', {
      name: 'Example members table',
    });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
  });

  it('renders the two free beta plans with their signup routes', () => {
    render(<LandingPage />);
    const pricing = document.getElementById('pricing') as HTMLElement;
    expect(within(pricing).getAllByText('during the beta')).toHaveLength(2);
    expect(
      within(pricing).getByRole('link', { name: 'Create an account' }),
    ).toHaveAttribute('href', '/register');
    expect(
      within(pricing).getByRole('link', { name: 'Create an organization' }),
    ).toHaveAttribute('href', '/register-organization');
    expect(within(pricing).getByText(/short queue/)).toBeInTheDocument();
  });

  it('renders final CTA register/login links', () => {
    render(<LandingPage />);
    const ctas = screen.getAllByRole('link', {
      name: 'Analyze my CV and an offer',
    });
    expect(ctas).toHaveLength(2);
    expect(ctas[1]).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('no longer renders the removed testimonials or feature grid', () => {
    render(<LandingPage />);
    expect(screen.queryByText(/testimonials/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Realistic interview simulations'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  describe('account counter', () => {
    it('renders the formatted count in the hero and final CTA', () => {
      render(<LandingPage />);
      const hero = screen.getByTestId('account-counter-hero');
      const final = screen.getByTestId('account-counter-final');
      expect(hero).toHaveTextContent('1,284 verified accounts so far');
      expect(hero).not.toHaveAttribute('aria-live');
      expect(within(hero).getByText('1,284')).toHaveClass(
        'font-semibold',
        'text-text',
      );
      expect(final).toHaveTextContent(
        'Join 1,284 people already preparing with Talkup.',
      );
    });

    it('uses the singular for a single account', () => {
      usePublicStatsMock.mockReturnValue(statsResult(1));
      render(<LandingPage />);
      expect(screen.getByTestId('account-counter-hero')).toHaveTextContent(
        /^1 verified account so far$/,
      );
      expect(screen.getByTestId('account-counter-final')).toHaveTextContent(
        /^Join 1 person already preparing with Talkup\.$/,
      );
    });

    it.each([
      ['zero', statsResult(0)],
      ['loading', statsResult(undefined, { isLoading: true })],
      ['error', statsResult(undefined, { isError: true })],
    ])('renders an empty reserved line when %s', (_label, result) => {
      usePublicStatsMock.mockReturnValue(result);
      render(<LandingPage />);
      for (const id of ['account-counter-hero', 'account-counter-final']) {
        const line = screen.getByTestId(id);
        expect(line).toBeEmptyDOMElement();
        expect(line).toHaveClass('min-h-5');
      }
    });
  });

  it('tracks landing CTA clicks with location and target', () => {
    render(<LandingPage />);
    const [hero, final] = screen.getAllByRole('link', {
      name: 'Analyze my CV and an offer',
    });
    hero.click();
    final.click();
    const pricing = document.getElementById('pricing') as HTMLElement;
    within(pricing).getByRole('link', { name: 'Create an account' }).click();
    const ctaCalls = trackEventMock.mock.calls.filter(
      ([name]) => name === 'cta_click',
    );
    expect(ctaCalls).toEqual([
      ['cta_click', { location: 'hero', target: '/register' }],
      ['cta_click', { location: 'final', target: '/register' }],
      ['cta_click', { location: 'pricing_candidates', target: '/register' }],
    ]);
  });
});
