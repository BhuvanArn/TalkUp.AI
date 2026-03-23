import CalendarListAddButton from './CalendarListAddButton';
import CalendarListDayHeader from './CalendarListDayHeader';
import ListEventBlock from './ListEventBlock';
import { CalendarListDayGroupProps } from './types';

/**
 * CalendarListDayGroup component.
 * Displays a group of events for a specific day, including the day header and add event button.
 *
 * @param props - The properties for the component.
 * @returns The rendered day group component.
 */
const CalendarListDayGroup = ({
  day,
  calendarViewMode,
  onEventClick,
  onCreateEvent,
  onDayClick,
}: CalendarListDayGroupProps) => {
  const renderEventButton = (
    event: (typeof day.events)[number],
    index: number,
  ) => {
    const isOptimistic = event.originalEvent.user_id === 'temp-user';

    return (
      <button
        key={`${event.title}-${index}`}
        onClick={() => onEventClick(event)}
        className={`w-full h-full text-left transform transition-transform ${
          isOptimistic ? 'opacity-60 cursor-wait' : 'cursor-pointer'
        }`}
      >
        <ListEventBlock
          title={event.title}
          subtitle={event.subtitle}
          color={event.color}
          startTime={event.startTime}
          endTime={event.endTime}
        />
      </button>
    );
  };

  const firstEvent = day.events[0];
  const remainingEvents = day.events.slice(1);
  const hasEvents = day.events.length > 0;

  return (
    <div
      className={`group flex flex-col gap-2 rounded-[6px] ${
        day.isToday ? 'bg-surface' : ''
      }`}
    >
      <div className="grid grid-cols-[180px_1fr] gap-3">
        <CalendarListDayHeader
          dayName={day.dayName}
          date={day.date}
          isToday={day.isToday}
          fullDate={day.fullDate}
          calendarViewMode={calendarViewMode}
          hasEvents={hasEvents}
          onDayClick={onDayClick}
          onCreateEvent={onCreateEvent}
        />

        <div /*className="min-w-0"*/>
          {firstEvent && renderEventButton(firstEvent, 0)}
        </div>
      </div>

      {remainingEvents.length > 0 && (
        <div className="grid grid-cols-[180px_1fr] gap-3">
          <div aria-hidden="true" />
          <div className="flex flex-col gap-2 min-w-0">
            {remainingEvents.map((event, eventIndex) =>
              renderEventButton(event, eventIndex + 1),
            )}
          </div>
        </div>
      )}

      {(calendarViewMode === 'day' ||
        (calendarViewMode === 'week' && hasEvents)) && (
        <div
          className={`grid grid-cols-[180px_1fr] gap-3 items-start overflow-hidden transition-all duration-300 ease-out origin-top ${
            calendarViewMode === 'week'
              ? 'max-h-0 opacity-0 -translate-y-4 group-hover:max-h-[60px] group-hover:opacity-100 group-hover:translate-y-0'
              : 'max-h-[60px] opacity-100 translate-y-0'
          }`}
        >
          <div aria-hidden="true" />
          <div className="py-1">
            <CalendarListAddButton
              onClick={() => onCreateEvent(day.fullDate)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarListDayGroup;
