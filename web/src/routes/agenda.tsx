import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { SwitchButton } from '@/components/atoms/switch-button';
import {
  CalendarEvent,
  useCalendarStore,
} from '@/components/molecules/calendar-option-bar/useCalendarStore';
import MiniCalendar from '@/components/molecules/mini-calendar';
import NextEventCard from '@/components/molecules/next-event-card';
import CalendarContainer, {
  CalendarView,
} from '@/components/organisms/calendar-container';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';
import {
  addDays,
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  isSameDay,
  startOfMonth,
} from 'date-fns';
import { useMemo, useState } from 'react';

export const Route = createFileRoute('/agenda')({
  beforeLoad: createAuthGuard('/agenda'),
  component: Agenda,
});

interface MiniCalendarViewProps {
  monthYear: string;
  days: Array<{
    date: number;
    isGray?: boolean;
    isToday?: boolean;
    hasEvent?: boolean;
  }>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
}
const MiniCalendarFixed = MiniCalendar as React.FC<MiniCalendarViewProps>;

/**
 * Returns the Monday of the week for the given date.
 * @param {Date} date The reference date.
 * @returns {Date} The date object set to the Monday of that week, at 00:00:00.
 */
const getStartOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const newDate = new Date(date);
  newDate.setDate(diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Generates the array of day objects for the mini-calendar based on the month,
 * including leading/trailing gray days and event markers.
 * @param {Date} monthDate The date representing the month to display.
 * @param {CalendarEvent[]} allEvents All available events from the store.
 * @returns {Array<{date: number, isGray?: boolean, isToday?: boolean, hasEvent?: boolean}>}
 */
const getMiniCalendarDaysData = (
  monthDate: Date,
  allEvents: CalendarEvent[],
) => {
  const today = new Date();
  const start = startOfMonth(monthDate);
  const daysInMonth = getDaysInMonth(monthDate);
  const days: MiniCalendarViewProps['days'] = [];
  const startDayIndex = (getDay(start) + 6) % 7;
  const daysBefore = startDayIndex;

  for (let i = 0; i < daysBefore; i++) {
    days.push({ date: 0, isGray: true });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = addDays(start, i - 1);

    const hasEvent = allEvents.some(
      (event) => event.fullDate && isSameDay(event.fullDate, date),
    );

    days.push({
      date: i,
      isToday: isSameDay(date, today),
      hasEvent: hasEvent,
    });
  }

  const totalCells = days.length;
  const remainingCells = 42 - totalCells;

  for (let i = 0; i < remainingCells; i++) {
    days.push({ date: 0, isGray: true });
  }

  return days.filter((_, index) => index < 42);
};

const DEFAULT_START_DATE = new Date('2025-11-17T00:00:00');
/**
 * Main component for the Agenda page.
 * Displays the main calendar view, a mini-calendar, and the next upcoming event.
 * @returns {JSX.Element} The Agenda page component.
 */
function Agenda() {
  const { events, getNextUpcomingEvent } = useCalendarStore();
  const [activeView, setActiveView] = useState<CalendarView>('table');

  /**
   * The next upcoming event fetched from the global calendar store.
   */
  const nextEvent: CalendarEvent | undefined = getNextUpcomingEvent();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [mainViewDate, setMainViewDate] = useState(DEFAULT_START_DATE);
  const currentMonthDate = useMemo(() => {
    return addMonths(DEFAULT_START_DATE, currentMonthIndex);
  }, [currentMonthIndex]);

  const monthYearLabel = format(currentMonthDate, 'MMMM yyyy');

  const miniCalendarDays = useMemo(() => {
    return getMiniCalendarDaysData(currentMonthDate, events);
  }, [currentMonthDate, events]);
  /**
   * Handles date change initiated by CalendarContainer, MiniCalendar, or NextEventCard.
   */
  const handleDateChange = (newDate: Date) => {
    setMainViewDate(new Date(newDate));
    const newMonthIndex =
      newDate.getMonth() -
      DEFAULT_START_DATE.getMonth() +
      12 * (newDate.getFullYear() - DEFAULT_START_DATE.getFullYear());
    setCurrentMonthIndex(newMonthIndex);
  };

  /** Handles navigation to the next month in the MiniCalendar. */
  const handleNextMonth = () => {
    setCurrentMonthIndex((prev) => prev + 1);
  };

  /** Handles navigation to the previous month in the MiniCalendar. */
  const handlePrevMonth = () => {
    setCurrentMonthIndex((prev) => prev - 1);
  };

  /**
   * Handles date selection from the MiniCalendar.
   */
  const handleMiniCalendarSelectDate = (date: Date) => {
    setMainViewDate(getStartOfWeek(date));
  };

  return (
    <div className="grid grid-rows-[96px_1fr] px-4 sm:px-8 md:px-16 pt-11 pb-12 gap-11 h-screen w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center w-full min-w-0 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-h1 text-idle">Agenda TalkUp</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="text" color="black" title="Share my agenda">
              <Icon icon="share" />
              <span className="hidden sm:inline text-idle text-button-s">
                Share my agenda
              </span>
            </Button>
          </div>
        </div>
        <p className="text-idle mt-2 text-h6">Plan and Organize your journey</p>
      </div>

      <div className="bg-surface-raised p-8 rounded-[20px] grid grid-cols-[1fr_300px] gap-6 h-full">
        <div className="bg-white rounded-[10px] px-6 py-3 h-full flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-h5 text-idle">Calendar</h2>
            <div className="flex gap-2 items-center">
              <Button variant="outlined" color="sidebar" size="sm">
                Filters
                <Icon icon="settings" />
              </Button>
              <SwitchButton
                leftLabel="Table"
                rightLabel="List"
                onSwitch={(view) => {
                  view === 'left'
                    ? setActiveView('table')
                    : setActiveView('list');
                }}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <CalendarContainer activeView={activeView} />
          </div>
        </div>

        {/* COLONNE DROITE (Sidebar) */}
        <div className="flex flex-col space-y-6">
          {/* Mini Calendar */}
          <MiniCalendarFixed
            monthYear={monthYearLabel}
            days={miniCalendarDays}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onSelectDate={(date: Date) => {
              handleMiniCalendarSelectDate(date);
            }}
          />

          {/* Next Event Card : use data of the store*/}
          {nextEvent ? (
            <NextEventCard
              title={nextEvent.title}
              subtitle={nextEvent.subtitle}
              tagLabel="TalkUp"
              detailsUrl="#"
              eventDate={nextEvent.fullDate}
            />
          ) : (
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
              No upcoming events.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

