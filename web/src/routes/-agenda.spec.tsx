import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Agenda from './agenda';

vi.mock('@/utils/auth.guards', () => ({
  createAuthGuard: vi.fn(() => () => Promise.resolve()),
}));

vi.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: () => ({
    fetchEvents: vi.fn(),
    isLoading: false,
    error: null,
    calendarLayoutMode: 'week',
    getNextUpcomingEvent: vi.fn(() => null),
    setCurrentDate: vi.fn(),
  }),
}));

vi.mock('@/components/molecules/calendar-control-bar', () => ({
  default: () => <div data-testid="calendar-control-bar" />,
}));

vi.mock('@/components/molecules/mini-calendar', () => ({
  default: () => <div data-testid="mini-calendar" />,
}));

vi.mock('@/components/molecules/next-event-card', () => ({
  default: () => <div data-testid="next-event-card" />,
}));

vi.mock('@/components/organisms/calendar-container', () => ({
  default: () => <div data-testid="calendar-container" />,
}));

describe('Agenda external app connectors', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hides the Google/Apple connectors by default', () => {
    render(<Agenda />);

    expect(screen.queryByText('Connect Google')).not.toBeInTheDocument();
    expect(screen.queryByText('Connect Apple')).not.toBeInTheDocument();
    expect(screen.queryByText('Connections')).not.toBeInTheDocument();
  });

  it('still renders the rest of the agenda while the connectors are hidden', () => {
    render(<Agenda />);

    expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
    expect(screen.getByTestId('mini-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('next-event-card')).toBeInTheDocument();
  });

  it('renders the connectors when VITE_SHOW_AGENDA_CONNECTORS is enabled', () => {
    vi.stubEnv('VITE_SHOW_AGENDA_CONNECTORS', 'true');

    render(<Agenda />);

    expect(screen.getByText('Connect Google')).toBeInTheDocument();
    expect(screen.getByText('Connect Apple')).toBeInTheDocument();
  });
});
