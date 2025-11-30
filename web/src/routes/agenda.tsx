import { createAuthGuard } from '@/utils/auth.guards';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import {
  CalendarEvent,
  useCalendarStore,
} from '@/components/molecules/calendar-option-bar/useCalendarStore';
import MiniCalendar from '@/components/molecules/mini-calendar';
import NextEventCard from '@/components/molecules/next-event-card';
import CalendarContainer from '@/components/organisms/calendar-container';
import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  getDaysInMonth,
  addMonths,
  addDays,
  isSameDay,
  getDay,
} from 'date-fns';

export const Route = createFileRoute('/agenda')({
  beforeLoad: createAuthGuard('/agenda'),
  component: Agenda,
});

interface CalendarContainerProps {
  initialView: 'Table' | 'List';
  mainDate: Date;
  onDateChange: (newDate: Date) => void;
}
const CalendarContainerFixed = CalendarContainer as React.FC<CalendarContainerProps>;

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
    
    const hasEvent = allEvents.some((event) => 
      event.fullDate && isSameDay(event.fullDate, date)
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
    const newMonthIndex = newDate.getMonth() - DEFAULT_START_DATE.getMonth() + (12 * (newDate.getFullYear() - DEFAULT_START_DATE.getFullYear()));
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header : Title, Subtitle, and Share Button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-h4 text-idle">Agenda</h2>
          <p className="text-gray-500">Plan and Organize your journey</p>
        </div>
        <Button
          variant="outlined"
          className="text-gray-600 font-medium flex items-center hover:text-gray-900"
        >
          <Icon icon="share" className="mr-2" />
          Share my agenda
        </Button>
      </div>

      {/* Conteneur Principal : Grille 2*1 (Calendrier + Sidebar) */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 grid grid-cols-[1fr_300px] gap-6">
        {/* COLONNE GAUCHE (Calendrier Principal) */}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Calendar</h2>

          {/* CalendarContainer receives the central state to control the week */}
          <CalendarContainerFixed
            initialView="Table"
            mainDate={mainViewDate}
            onDateChange={handleDateChange}
          />
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
