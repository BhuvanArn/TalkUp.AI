import { useCalendarList } from '@/hooks/calendar/useCalendarList';

import CalendarListDayGroup from './CalendarListDayGroup';

/**
 * CalendarList component.
 * Displays a list of calendar events grouped by day.
 * It supports viewing a full week or a single day.
 *
 * @returns The rendered CalendarList component.
 */
const CalendarList = () => {
  const {
    filteredDaysData,
    calendarViewMode,
    handleEventClick,
    handleCreateEvent,
    handleDayClick,
  } = useCalendarList();

  return (
    <div className="pt-3 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
      {filteredDaysData.map((day) => (
        <CalendarListDayGroup
          key={day.dayName + day.date}
          day={day}
          calendarViewMode={calendarViewMode}
          onEventClick={handleEventClick}
          onCreateEvent={handleCreateEvent}
          onDayClick={handleDayClick}
        />
      ))}
    </div>
  );
};

export default CalendarList;
