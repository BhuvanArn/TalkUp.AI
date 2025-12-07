import { useCalendarStore } from '@/stores/useCalendarStore';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import CalendarContainer from './index';

// Mock child components so we can assert presence without their implementations
vi.mock('../calendar-table', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-calendar-table">CalendarTable</div>,
}));

vi.mock('../calendar-list', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-calendar-list">CalendarList</div>,
}));

vi.mock('../event-modal', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-calendar-modal">CalendarModal</div>,
}));

// Mock the store
vi.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: vi.fn(),
}));

describe('CalendarContainer', () => {
  it('renders CalendarTable when calendarLayoutMode is table and includes CalendarModal', () => {
    (useCalendarStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      calendarLayoutMode: 'table',
    });
    render(<CalendarContainer />);

    expect(screen.getByTestId('mock-calendar-table')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-calendar-list')).toBeNull();
    expect(screen.getByTestId('mock-calendar-modal')).toBeInTheDocument();
  });

  it('renders CalendarList when calendarLayoutMode is list and includes CalendarModal', () => {
    (useCalendarStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      calendarLayoutMode: 'list',
    });
    render(<CalendarContainer />);

    expect(screen.getByTestId('mock-calendar-list')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-calendar-table')).toBeNull();
    expect(screen.getByTestId('mock-calendar-modal')).toBeInTheDocument();
  });
});

export {};
