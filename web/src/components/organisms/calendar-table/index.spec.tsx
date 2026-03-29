import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// We'll dynamically import the component after mocking its dependencies
const loadWithMocks = async (
  mockHookReturn: any,
  mockDate = new Date('2025-12-02'),
) => {
  vi.resetModules();

  // Mock the calendar hook
  vi.doMock('@/hooks/calendar/useCalendarTable', () => ({
    useCalendarTable: () => mockHookReturn,
  }));

  // Mock react-big-calendar Calendar export (unused by our fake HOC)
  vi.doMock('react-big-calendar', () => ({
    Calendar: () => null,
  }));

  // Mock the drag-and-drop HOC to return a simple component that
  // renders the header and event components provided via props so we can assert them.
  vi.doMock('react-big-calendar/lib/addons/dragAndDrop', () => ({
    default: (_CalendarComp: any) => {
      return (props: any) => {
        return (
          <div data-testid="dnd-calendar">
            {/* Render header with a controlled date so output is deterministic */}
            {props.components?.header?.({ date: mockDate })}
            {/* Render first event if exists */}
            {props.events &&
              props.events[0] &&
              props.components?.event?.({ event: props.events[0] })}
          </div>
        );
      };
    },
  }));

  const mod = await import('./index');
  return mod.default;
};

describe('CalendarTable (calendar-table/index.tsx)', () => {
  it('renders header and event via the Calendar components', async () => {
    const event = {
      id: '1',
      title: 'Interview',
      description: 'Acme Corp',
      color: 'blue',
      start: new Date('2025-12-02T09:00:00'),
      end: new Date('2025-12-02T10:00:00'),
    };

    const mockHook = {
      events: [event],
      currentDate: new Date('2025-12-02'),
      calendarViewMode: 'week',
      localizer: {} as any,
      onEventResize: vi.fn(),
      onEventDrop: vi.fn(),
      handleSelectSlot: vi.fn(),
      handleSelectEvent: vi.fn(),
      setCurrentDate: vi.fn(),
      setCalendarViewMode: vi.fn(),
      calendarFormats: {},
      eventPropGetter: () => ({}),
    };

    const CalendarTable = await loadWithMocks(mockHook);
    render(<CalendarTable />);

    // Header: for 2025-12-02 the weekday is Tuesday
    expect(screen.getByText(/Tuesday/)).toBeInTheDocument();
    // Date number 2 should be rendered in the header
    expect(screen.getByText('2')).toBeInTheDocument();

    // Event title and subtitle should be rendered
    expect(screen.getByText('Interview')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  }, 20000);
});

export {};
