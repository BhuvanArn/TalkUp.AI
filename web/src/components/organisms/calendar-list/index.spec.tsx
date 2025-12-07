import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import CalendarList from './index';

// Prepare controllable mocks for the hook's handlers and data
const handleEventClick = vi.fn();
const handleCreateEvent = vi.fn();
const handleDayClick = vi.fn();

const filteredDaysData = [
  {
    dayName: 'Mon',
    date: 1,
    fullDate: new Date('2025-12-01'),
    isToday: false,
    events: [],
  },
  {
    dayName: 'Tue',
    date: 2,
    fullDate: new Date('2025-12-02'),
    isToday: true,
    events: [],
  },
];

// Mock the hook to return the test data and handlers
vi.mock('@/hooks/calendar/useCalendarList', () => ({
  __esModule: true,
  useCalendarList: () => ({
    filteredDaysData,
    calendarViewMode: 'week',
    handleEventClick,
    handleCreateEvent,
    handleDayClick,
  }),
}));

// Mock CalendarListDayGroup so we can assert it receives props and calls callbacks
vi.mock('./CalendarListDayGroup', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid={`group-${props.day.dayName}`}>
      <span>{props.day.dayName}</span>
      <button
        data-testid={`event-${props.day.dayName}`}
        onClick={() =>
          props.onEventClick && props.onEventClick({ title: 'x' } as any)
        }
      >
        evt
      </button>
      <button
        data-testid={`create-${props.day.dayName}`}
        onClick={() =>
          props.onCreateEvent && props.onCreateEvent(props.day.fullDate)
        }
      >
        create
      </button>
      <button
        data-testid={`day-${props.day.dayName}`}
        onClick={() => props.onDayClick && props.onDayClick(props.day.fullDate)}
      >
        day
      </button>
    </div>
  ),
}));

describe('CalendarList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders day groups from the hook', () => {
    render(<CalendarList />);

    expect(screen.getByTestId('group-Mon')).toBeInTheDocument();
    expect(screen.getByTestId('group-Tue')).toBeInTheDocument();
  });

  it('forwards callbacks to day groups and they trigger handlers', () => {
    render(<CalendarList />);

    fireEvent.click(screen.getByTestId('event-Mon'));
    expect(handleEventClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('create-Tue'));
    expect(handleCreateEvent).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('day-Tue'));
    expect(handleDayClick).toHaveBeenCalledTimes(1);
  });
});

export {};
