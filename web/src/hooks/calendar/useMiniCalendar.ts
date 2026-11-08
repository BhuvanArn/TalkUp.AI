import { useLocale } from '@/hooks/i18n/useLocale';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { MiniCalendarDay, getMiniCalendarDays } from '@/utils/calendarUtils';
import { addDays, endOfWeek, startOfWeek } from 'date-fns';
import { useMemo, useState } from 'react';

/** Short weekday names, Monday first (`Mon`…`Sun` in English). */
export const getDaysOfWeek = (intlLocale: string): string[] => {
  const monday = startOfWeek(new Date(2024, 0, 3), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) =>
    addDays(monday, index).toLocaleDateString(intlLocale, { weekday: 'short' }),
  );
};

/**
 * Custom hook for the MiniCalendar component.
 * Manages the display date, navigation, and day selection.
 */
export const useMiniCalendar = () => {
  const [displayDate, setDisplayDate] = useState(new Date());
  const { setCurrentDate, currentDate } = useCalendarStore();
  const { intlLocale } = useLocale();
  const daysOfWeek = useMemo(() => getDaysOfWeek(intlLocale), [intlLocale]);

  const days: MiniCalendarDay[] = useMemo(
    () => getMiniCalendarDays(displayDate),
    [displayDate],
  );

  const monthYear = displayDate.toLocaleDateString(intlLocale, {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    setDisplayDate((prevDate) => {
      const newDate = new Date(prevDate);
      // Pin to the 1st before shifting so month-end days (e.g. May 31) don't
      // overflow into the wrong month.
      newDate.setDate(1);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setDisplayDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(1);
      newDate.setMonth(prevDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleDayClick = (day: MiniCalendarDay) => {
    setCurrentDate(day.fullDate);

    if (day.isNotCurrentMonth) {
      setDisplayDate(day.fullDate);
    }
  };

  const selectedWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const selectedWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  return {
    days,
    monthYear,
    handlePrevMonth,
    handleNextMonth,
    handleDayClick,
    selectedWeekStart,
    selectedWeekEnd,
    daysOfWeek,
  };
};
