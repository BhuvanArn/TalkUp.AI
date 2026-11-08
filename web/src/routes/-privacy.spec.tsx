import { changeLanguage } from '@/i18n';
import { act, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Route } from './privacy';

// The router plugin code-splits this route in tests too, so the component is a
// lazy wrapper that suspends until its chunk is loaded.
const PrivacyPage = Route.options.component!;

beforeAll(() => PrivacyPage.preload?.());

vi.mock('@/components/organisms/landing-nav', () => ({
  default: () => <nav data-testid="landing-nav" />,
}));

vi.mock('@/components/organisms/landing-footer', () => ({
  default: () => <footer data-testid="landing-footer" />,
}));

describe('Privacy route', () => {
  // setupTests pins English for every other test.
  afterEach(async () => {
    await act(() => i18next.changeLanguage('en'));
    localStorage.clear();
  });

  it('is public (no auth guard)', () => {
    expect(Route.options.beforeLoad).toBeUndefined();
  });

  it('renders the policy in English with its 14 sections', () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Privacy Policy' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Last updated: October 26, 2026'),
    ).toBeInTheDocument();
    const sections = screen.getAllByRole('heading', { level: 2 });
    expect(sections).toHaveLength(14);
    expect(sections[0]).toHaveTextContent('1. Introduction');
    expect(sections[13]).toHaveTextContent('14. Contact');
    expect(
      screen.getByText('Create and manage your account.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Questions about this Privacy Policy or your personal data? Email us at contact.talkup.ai@gmail.com.',
      ),
    ).toBeInTheDocument();
  });

  it('renders the policy and its date in French', async () => {
    await act(() => changeLanguage('fr'));
    render(<PrivacyPage />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Politique de confidentialité',
      }),
    ).toBeInTheDocument();
    // Text matchers collapse the no-break space before the colon.
    expect(
      screen.getByText('Dernière mise à jour : 26 octobre 2026'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(14);
    expect(
      screen.getByRole('heading', { name: '2. Responsable du traitement' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('créer et gérer votre compte ;'),
    ).toBeInTheDocument();
  });
});
