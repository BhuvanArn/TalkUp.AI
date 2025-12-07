import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

const loadWithMocks = async () => {
  vi.resetModules();

  // Mock the header to render the dayName and date so we can assert it's rendered
  vi.doMock('./CalendarListDayHeader', () => ({
    __esModule: true,
    default: (props: any) => (
      <div data-testid="mock-header">
        <span>{props.dayName}</span>
        <span>{props.date}</span>
      </div>
    ),
  }));

  // Mock the ListEventBlock to render title/subtitle
  vi.doMock('./ListEventBlock', () => ({
    __esModule: true,
    default: (props: any) => (
      <div data-testid="mock-list-event">
        <span>{props.title}</span>
        {props.subtitle && <span>{props.subtitle}</span>}
      </div>
    ),
  }));

  // Mock the add button to render a clickable element that calls onClick
  vi.doMock('./CalendarListAddButton', () => ({
    __esModule: true,
    default: (props: any) => (
      <button
        data-testid="mock-add-btn"
        onClick={() => props.onClick && props.onClick()}
      >
        Add
      </button>
    ),
  }));

  const mod = await import('./CalendarListDayGroup');
  return mod.default;
};

describe('CalendarListDayGroup', () => {
  it('renders header and no events when day has none and view is week', async () => {
    const day = {
      dayName: 'Mon',
      date: 1,
      isToday: false,
      fullDate: new Date('2025-12-01'),
      events: [],
    };
    const onEventClick = vi.fn();
    const onCreateEvent = vi.fn();
    const onDayClick = vi.fn();

    const CalendarListDayGroup = await loadWithMocks();
    const { container } = render(
      <CalendarListDayGroup
        day={day as any}
        calendarViewMode="week"
        onEventClick={onEventClick}
        onCreateEvent={onCreateEvent}
        onDayClick={onDayClick}
      />,
    );

    // Header mocked content present
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // No event blocks
    expect(
      container.querySelectorAll('[data-testid="mock-list-event"]').length,
    ).toBe(0);

    // Add button should not be present in 'week' view
    expect(screen.queryByTestId('mock-add-btn')).toBeNull();
  });

  it('renders events, applies optimistic styling, handles clicks, and shows add button in day view', async () => {
    const optimisticEvent = {
      title: 'Pending Event',
      subtitle: 'Pending',
      color: 'blue',
      startTime: '09:00',
      endTime: '10:00',
      originalEvent: { user_id: 'temp-user' },
    };

    const normalEvent = {
      title: 'Confirmed',
      subtitle: '',
      color: 'green',
      startTime: '11:00',
      endTime: '12:00',
      originalEvent: { user_id: 'real-user' },
    };

    const day = {
      dayName: 'Tue',
      date: 2,
      isToday: true,
      fullDate: new Date('2025-12-02'),
      events: [optimisticEvent, normalEvent],
    };

    const onEventClick = vi.fn();
    const onCreateEvent = vi.fn();
    const onDayClick = vi.fn();

    const CalendarListDayGroup = await loadWithMocks();
    const { container } = render(
      <CalendarListDayGroup
        day={day as any}
        calendarViewMode="day"
        onEventClick={onEventClick}
        onCreateEvent={onCreateEvent}
        onDayClick={onDayClick}
      />,
    );

    // Two event blocks rendered
    const events = container.querySelectorAll(
      '[data-testid="mock-list-event"]',
    );
    expect(events.length).toBe(2);

    // The buttons wrapping the events should have different classes
    const buttons = container.querySelectorAll('button');
    // First event button should have optimistic classes
    const firstBtn = buttons[0];
    expect(firstBtn.className).toContain('opacity-60');
    expect(firstBtn.className).toContain('cursor-wait');

    // Second event button should have cursor-pointer
    const secondBtn = buttons[1];
    expect(secondBtn.className).toContain('cursor-pointer');

    // Clicking event should call onEventClick with the event object
    fireEvent.click(firstBtn);
    expect(onEventClick).toHaveBeenCalledWith(optimisticEvent);

    // Add button should be present in 'day' view and call onCreateEvent with fullDate
    const addBtn = screen.getByTestId('mock-add-btn');
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(onCreateEvent).toHaveBeenCalledTimes(1);
    const calledArg = onCreateEvent.mock.calls[0][0];
    expect(calledArg).toBeInstanceOf(Date);
    expect((calledArg as Date).toISOString().startsWith('2025-12-02')).toBe(
      true,
    );
  });
});

export {};
