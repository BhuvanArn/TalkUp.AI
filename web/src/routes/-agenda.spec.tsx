import { changeLanguage } from '@/i18n';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { act, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Agenda } from './agenda';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
}));

vi.mock('@/utils/auth.guards', () => ({
  createAuthGuard: vi.fn(() => () => Promise.resolve()),
}));

vi.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: vi.fn(),
}));

vi.mock('@/components/molecules/calendar-control-bar', () => ({
  default: () => null,
}));
vi.mock('@/components/molecules/mini-calendar', () => ({
  default: () => null,
}));
vi.mock('@/components/molecules/next-event-card', () => ({
  default: () => null,
}));
vi.mock('@/components/organisms/calendar-container', () => ({
  default: () => null,
}));

describe('Agenda', () => {
  afterEach(async () => {
    await act(() => i18next.changeLanguage('en'));
    localStorage.clear();
  });

  it('shows the store error in the active language, following a switch', async () => {
    vi.mocked(useCalendarStore).mockReturnValue({
      fetchEvents: vi.fn(),
      isLoading: false,
      error: 'agenda.errors.fetch',
    });

    render(<Agenda />);
    expect(screen.getByText('Failed to fetch events')).toBeInTheDocument();

    await act(() => changeLanguage('fr'));

    expect(
      screen.getByText('Impossible de récupérer les événements'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Failed to fetch events'),
    ).not.toBeInTheDocument();
  });
});
