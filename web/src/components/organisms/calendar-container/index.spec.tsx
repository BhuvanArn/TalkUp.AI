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

describe('CalendarContainer', () => {
  it('renders CalendarTable when activeView is table and includes CalendarModal', () => {
    render(<CalendarContainer activeView="table" />);

    expect(screen.getByTestId('mock-calendar-table')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-calendar-list')).toBeNull();
    expect(screen.getByTestId('mock-calendar-modal')).toBeInTheDocument();
  });

  it('renders CalendarList when activeView is list and includes CalendarModal', () => {
    render(<CalendarContainer activeView="list" />);

    expect(screen.getByTestId('mock-calendar-list')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-calendar-table')).toBeNull();
    expect(screen.getByTestId('mock-calendar-modal')).toBeInTheDocument();
  });
});

export {};
