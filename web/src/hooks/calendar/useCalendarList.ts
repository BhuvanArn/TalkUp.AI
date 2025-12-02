import { useCalendarStore } from '@/components/molecules/calendar-option-bar/useCalendarStore';
import { ListEventItem } from '@/components/organisms/calendar-list/types';
import { getListWeekDaysData } from '@/utils/calendarUtils';
import { isSameDay } from 'date-fns';
import { useMemo } from 'react';

/**
 * Custom hook to manage the logic for the CalendarList component.
 * It handles data fetching from the store, filtering events based on the view mode,
 * and providing event handlers for user interactions.
 *
 * @returns An object containing the filtered days data and event handlers.
 */
export const useCalendarList = () => {
  const {
    weekStart,
    events,
    openModalForEdit,
    openModalForCreation,
    calendarViewMode,
    setCalendarViewMode,
    currentDate,
    setCurrentDate,
  } = useCalendarStore();

  const daysData = useMemo(
    () => getListWeekDaysData(weekStart, events),
    [weekStart, events],
  );

  const filteredDaysData = useMemo(() => {
    if (calendarViewMode === 'day') {
      return daysData.filter((day) => isSameDay(day.fullDate, currentDate));
    }
    return daysData;
  }, [daysData, calendarViewMode, currentDate]);

  /**
   * Handles the click event on a specific calendar event item.
   * Opens the edit modal if the event is not an optimistic (temporary) one.
   *
   * @param event - The event item that was clicked.
   */
  const handleEventClick = (event: ListEventItem): void => {
    // Prevent editing optimistic events until they are confirmed
    if (event.originalEvent.user_id === 'temp-user') return;
    openModalForEdit(event.originalEvent);
  };

  /**
   * Handles the creation of a new event on a specific date.
   * Sets default start and end times (9:00 - 10:00) and opens the creation modal.
   *
   * @param date - The date for which to create the event.
   */
  const handleCreateEvent = (date: Date) => {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);
    openModalForCreation(start, end);
  };

  /**
   * Handles the click event on a day header.
   * Sets the current date and switches the view mode to 'day'.
   *
   * @param date - The date of the clicked day.
   */
  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setCalendarViewMode('day');
  };

  return {
    filteredDaysData,
    calendarViewMode,
    handleEventClick,
    handleCreateEvent,
    handleDayClick,
  };
};
