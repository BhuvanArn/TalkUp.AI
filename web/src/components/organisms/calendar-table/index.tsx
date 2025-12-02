import { CalendarEvent } from '@/components/molecules/calendar-option-bar/useCalendarStore';
import { useCalendarTable } from '@/hooks/calendar/useCalendarTable';
import { format } from 'date-fns';
import { Calendar } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

import CalendarTableDayHeader from './CalendarTableDayHeader';
import CalendarTableEventItem from './CalendarTableEventItem';

/**
 * Enhances the Calendar component with drag-and-drop functionality.
 */
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

/**
 * CalendarTable component that displays a calendar with events.
 *
 * @returns A calendar table component with drag-and-drop and resize functionalities.
 */
const CalendarTable = () => {
  const {
    events,
    currentDate,
    calendarViewMode,
    localizer,
    onEventResize,
    onEventDrop,
    handleSelectSlot,
    handleSelectEvent,
    setCurrentDate,
    setCalendarViewMode,
    calendarFormats,
    eventPropGetter,
  } = useCalendarTable();

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        resizable
        selectable
        date={currentDate}
        onNavigate={(date) => setCurrentDate(date)}
        view={calendarViewMode}
        onView={(view) => setCalendarViewMode(view as 'week' | 'day')}
        views={['week', 'day']}
        toolbar={false}
        formats={calendarFormats}
        components={{
          header: ({ date }) => (
            <CalendarTableDayHeader
              dayName={format(date, 'EEEE')}
              date={date.getDate()}
              isToday={new Date().toDateString() === date.toDateString()}
            />
          ),
          event: ({ event }) => (
            <div className="h-full w-full">
              <CalendarTableEventItem
                title={event.title}
                subtitle={event.description || ''}
                color={(event.color as any) || 'blue'}
                startHour={event.start.getHours()}
                startMinute={event.start.getMinutes()}
                endHour={event.end.getHours()}
                endMinute={event.end.getMinutes()}
              />
            </div>
          ),
        }}
        eventPropGetter={eventPropGetter}
        step={15}
        timeslots={8}
      />
    </div>
  );
};

export default CalendarTable;
