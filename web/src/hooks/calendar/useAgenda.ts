import { CalendarView } from '@/components/organisms/calendar-container';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { getMiniCalendarDaysData } from '@/utils/calendarUtils';
import { addMonths, format } from 'date-fns';
import { useMemo, useState } from 'react';

const DEFAULT_START_DATE = new Date('2025-11-17T00:00:00');

/**
 * Custom hook to manage the logic for the Agenda page.
 * Handles state for the calendar view, month navigation, and mini-calendar data generation.
 *
 * @returns {Object} An object containing:
 * - activeView: The current view mode of the calendar (table or list).
 * - setActiveView: Function to update the active view.
 * - nextEvent: The next upcoming event.
 * - monthYearLabel: The formatted label for the current month and year.
 * - miniCalendarDays: The data for the mini-calendar grid.
 * - handleNextMonth: Function to navigate to the next month.
 * - handlePrevMonth: Function to navigate to the previous month.
 * - handleMiniCalendarSelectDate: Function to handle date selection from the mini-calendar.
 */
export const useAgenda = () => {
  const { events, getNextUpcomingEvent, setCurrentDate } = useCalendarStore();
  const [activeView, setActiveView] = useState<CalendarView>('table');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  const nextEvent = getNextUpcomingEvent();

  const currentMonthDate = useMemo(() => {
    return addMonths(DEFAULT_START_DATE, currentMonthIndex);
  }, [currentMonthIndex]);

  const monthYearLabel = format(currentMonthDate, 'MMMM yyyy');

  const miniCalendarDays = useMemo(() => {
    return getMiniCalendarDaysData(currentMonthDate, events);
  }, [currentMonthDate, events]);

  const handleNextMonth = () => {
    setCurrentMonthIndex((prev) => prev + 1);
  };

  const handlePrevMonth = () => {
    setCurrentMonthIndex((prev) => prev - 1);
  };

  const handleMiniCalendarSelectDate = (date: Date) => {
    setCurrentDate(date);
  };

  return {
    activeView,
    setActiveView,
    nextEvent,
    monthYearLabel,
    miniCalendarDays,
    handleNextMonth,
    handlePrevMonth,
    handleMiniCalendarSelectDate,
  };
};
