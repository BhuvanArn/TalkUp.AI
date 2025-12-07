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
  return (
    <div className="flex flex-col group">
      <CalendarListDayHeader
        dayName={day.dayName}
        date={day.date}
        isToday={day.isToday}
        fullDate={day.fullDate}
        calendarViewMode={calendarViewMode}
        onDayClick={onDayClick}
        onCreateEvent={onCreateEvent}
      />

      <div className="flex flex-col mt-3 gap-2">
        {day.events.length > 0 && (
          <>
            {day.events.map((event, eventIndex) => {
              const isOptimistic = event.originalEvent.user_id === 'temp-user';
              return (
                <button
                  key={eventIndex}
                  onClick={() => onEventClick(event)}
                  className={`transform transition-transform ${
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
            })}
          </>
        )}

        {calendarViewMode === 'day' && (
          <CalendarListAddButton onClick={() => onCreateEvent(day.fullDate)} />
        )}
      </div>
    </div>
  );
};

export default CalendarListDayGroup;
