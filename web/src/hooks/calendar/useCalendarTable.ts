import { CalendarEvent, useCalendarStore } from '@/stores/useCalendarStore';
import { format, getDay, isSameDay, parse, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useEffect, useMemo } from 'react';
import { dateFnsLocalizer } from 'react-big-calendar';
import { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop';

const locales = {
  'en-US': enUS,
};

export const useCalendarTable = () => {
  const {
    events,
    openModalForCreation,
    openModalForEdit,
    updateEvent,
    fetchEvents,
    currentDate,
    setCurrentDate,
    calendarViewMode,
    setCalendarViewMode,
  } = useCalendarStore();

  const localizer = useMemo(
    () =>
      dateFnsLocalizer({
        format,
        parse,
        startOfWeek,
        getDay,
        locales,
      }),
    [],
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onEventResize: withDragAndDropProps['onEventResize'] = (data) => {
    const { event, start, end } = data;
    const e = event as CalendarEvent;
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (!isSameDay(startDate, endDate)) return;

    updateEvent(e.id, {
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
    });
  };

  const onEventDrop: withDragAndDropProps['onEventDrop'] = (data) => {
    const { event, start, end, isAllDay } = data;
    const e = event as CalendarEvent;
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (!isSameDay(startDate, endDate)) return;

    updateEvent(e.id, {
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      all_day: isAllDay,
    });
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    openModalForCreation(start, end);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    openModalForEdit(event);
  };

  const calendarFormats = useMemo(
    () => ({
      timeGutterFormat: (date: Date) => format(date, 'HH:mm'),
      eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
    }),
    [],
  );

  const eventPropGetter = () => ({
    style: { backgroundColor: 'transparent', padding: 0, border: 'none' },
  });

  return {
    // State
    events,
    currentDate,
    calendarViewMode,
    localizer,

    // Event handlers
    onEventResize,
    onEventDrop,
    handleSelectSlot,
    handleSelectEvent,
    setCurrentDate,
    setCalendarViewMode,

    // Configuration
    calendarFormats,
    eventPropGetter,
  };
};
