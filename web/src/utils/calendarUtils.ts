import { CalendarEvent } from '@/components/molecules/calendar-option-bar/useCalendarStore';
import { CalendarListDayData } from '@/components/organisms/calendar-list/types';
import { addDays, format, isSameDay } from 'date-fns';

/**
 * Interface for a single day data object used in the MiniCalendar grid.
 */
export interface MiniCalendarDay {
  /** The day number (1-31). */
  date: number;
  /** True if the day belongs to the previous or next month (visually grayed out). */
  isNotCurrentMonth: boolean;
  /** True if the day is today. */
  isToday: boolean;
  /** The complete Date object for this day, necessary for store lookups and selection. */
  fullDate: Date;
}

/**
 * Calculates and returns all days for the given month, including days from the
 * previous and next months to fill the 7xN calendar grid.
 *
 * The grid is always generated to start on a Monday.
 *
 * @param targetDate Any date within the month you want to display.
 * @returns {MiniCalendarDay[]} An array of up to 42 day objects filling the calendar grid.
 */
export const getMiniCalendarDays = (targetDate: Date): MiniCalendarDay[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    1,
  );
  const lastDayOfMonth = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    0,
  );

  const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  const days: MiniCalendarDay[] = [];

  const prevMonthLastDay = new Date(firstDayOfMonth);
  prevMonthLastDay.setDate(0);
  for (let i = firstDayIndex; i > 0; i--) {
    const date = new Date(prevMonthLastDay);
    date.setDate(prevMonthLastDay.getDate() - i + 1);
    days.push({
      date: date.getDate(),
      isNotCurrentMonth: true,
      isToday: false,
      fullDate: date,
    });
  }

  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const date = new Date(targetDate.getFullYear(), targetDate.getMonth(), i);
    const isCurrentDay = date.getTime() === today.getTime();
    days.push({
      date: i,
      isNotCurrentMonth: false,
      isToday: isCurrentDay,
      fullDate: date,
    });
  }

  const totalDaysSoFar = days.length;
  const remainingSlots = 42 - totalDaysSoFar;
  const nextMonthFirstDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    1,
  );

  for (let i = 1; i <= remainingSlots && totalDaysSoFar + i <= 42; i++) {
    const date = new Date(nextMonthFirstDay);
    date.setDate(i);
    days.push({
      date: i,
      isNotCurrentMonth: true,
      isToday: false,
      fullDate: date,
    });
  }

  return days.slice(0, 42);
};

/**
 * Generates a list of day data for a week starting from the given start date.
 * It filters and formats events for each day of the week.
 *
 * @param startDate - The start date of the week.
 * @param allEvents - An array of all calendar events to filter from.
 * @returns An array of `CalendarListDayData` objects representing each day of the week.
 */
export const getListWeekDaysData = (
  startDate: Date,
  allEvents: CalendarEvent[],
): CalendarListDayData[] => {
  const days: CalendarListDayData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(startDate.getTime())) return [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const isToday = isSameDay(date, today);

    const eventsForDay = allEvents
      .filter((e) => isSameDay(e.start, date))
      .map((e) => ({
        title: e.title,
        subtitle: e.description || '',
        color: e.color || 'blue',
        startTime: format(e.start, 'HH:mm'),
        endTime: format(e.end, 'HH:mm'),
        originalEvent: e,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    days.push({
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      date: date.getDate(),
      fullDate: date,
      isToday,
      events: eventsForDay,
    });
  }
  return days;
};
