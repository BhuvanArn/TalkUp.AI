import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import CalendarListDayHeader from './CalendarListDayHeader';

// Mock IconAction so we can detect clicks separately
vi.mock('@/components/atoms/icon-action', () => ({
  __esModule: true,
  default: (props: any) => (
    <button
      data-testid="mock-icon-action"
      onClick={() => props.onClick && props.onClick()}
    >
      {props.title}
    </button>
  ),
}));

describe('CalendarListDayHeader', () => {
  it('renders dayName and date and applies today styles when isToday=true', () => {
    const fullDate = new Date('2025-12-02');
    render(
      <CalendarListDayHeader
        dayName="Tue"
        date={2}
        isToday={true}
        fullDate={fullDate}
        calendarViewMode="day"
        onDayClick={() => {}}
        onCreateEvent={() => {}}
      />,
    );

    expect(screen.getByText('Tue')).toBeInTheDocument();
    const dateSpan = screen.getByText('2');
    expect(dateSpan).toBeInTheDocument();

    // parent element of the span has the conditional classes
    const parent = dateSpan.parentElement as HTMLElement;
    expect(parent).toHaveClass('bg-accent');
    expect(parent).toHaveClass('text-white');
  });

  it('calls onDayClick when overlay button is clicked and calls onCreateEvent when icon is clicked', () => {
    const fullDate = new Date('2025-12-03');
    const onDayClick = vi.fn();
    const onCreateEvent = vi.fn();

    const { container } = render(
      <CalendarListDayHeader
        dayName="Wed"
        date={3}
        isToday={false}
        fullDate={fullDate}
        calendarViewMode="week"
        onDayClick={onDayClick}
        onCreateEvent={onCreateEvent}
      />,
    );

    const buttons = screen.getAllByRole('button');
    // One of the buttons is our mocked icon action (with testid), the other is the overlay
    const iconBtn = screen.getByTestId('mock-icon-action');
    const overlayBtn = buttons.find((b) => b !== iconBtn) as HTMLElement;

    // Click overlay -> onDayClick called with Date
    fireEvent.click(overlayBtn);
    expect(onDayClick).toHaveBeenCalledTimes(1);
    expect(onDayClick.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(
      onDayClick.mock.calls[0][0].toISOString().startsWith('2025-12-03'),
    ).toBe(true);

    // Click icon -> onCreateEvent called with Date
    fireEvent.click(iconBtn);
    expect(onCreateEvent).toHaveBeenCalledTimes(1);
    expect(onCreateEvent.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(
      onCreateEvent.mock.calls[0][0].toISOString().startsWith('2025-12-03'),
    ).toBe(true);

    // basic DOM sanity
    expect(container).toBeTruthy();
  });
});

export {};
