import { useCalendarStore } from '@/stores/useCalendarStore';
import { MiniCalendarDay, getMiniCalendarDays } from '@/utils/calendarUtils';
import { endOfWeek, startOfWeek } from 'date-fns';
import { useMemo, useState } from 'react';

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Custom hook for the MiniCalendar component.
 * Manages the display date, navigation, and day selection.
 */
export const useMiniCalendar = () => {
  const [displayDate, setDisplayDate] = useState(new Date());
  const { setCurrentDate, currentDate } = useCalendarStore();

  const days: MiniCalendarDay[] = useMemo(
    () => getMiniCalendarDays(displayDate),
    [displayDate],
  );

  const monthYear = displayDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    setDisplayDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setDisplayDate((prevDate) => {
      const newDate = new Date(prevDate);
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
    daysOfWeek: DAYS_OF_WEEK,
  };
};
