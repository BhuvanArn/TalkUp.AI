import EventItem, { EventItemProps } from '@/components/atoms/event-item';

/**
 * Interface for event data including time information for vertical positioning.
 */
export interface EventData extends EventItemProps {
  /** Start hour (0-23). */
  startHour: number;
  /** Start minute (0-59). */
  startMinute: number;
  /** End hour (0-23). */
  endHour: number;
  /** End minute (0-59). */
  endMinute: number;
  /** The name of the day this event belongs to (for grouping mock data). */
  dayName: string;
  /** The date number this event belongs to (for grouping mock data). */
  date: number;
  /** True if the event is on the current day. */
  isToday: boolean;
}

/**
 * CalendarDayColumn component props.
 */
interface CalendarDayColumnProps {
  /** Name of the day (e.g., "Mon"). */
  dayName: string;
  /** Date of the day (e.g., 13). */
  date: number;
  /** Indicates if this day is today. */
  isToday: boolean;
  /** The list of events for this day. */
  events: EventData[];
}

/**
 * CalendarDayColumn component.
 * Displays the header for a day and manages the vertical positioning of EventItems
 * within that day's column in the CalendarTable organism.
 *
 * @param {CalendarDayColumnProps} props The properties object.
 * @returns {JSX.Element} The rendered day column with positioned events.
 */
const CalendarDayColumn = ({
  dayName,
  date,
  isToday,
  events,
}: CalendarDayColumnProps) => {
  const CALENDAR_START_HOUR = 8;
  const PIXELS_PER_MINUTE = 1;

  const getEventPositionStyles = (event: EventData) => {
    const startMinutesOfDay = event.startHour * 60 + event.startMinute;
    const calendarStartMinutes = CALENDAR_START_HOUR * 60;
    const topMinutes = startMinutesOfDay - calendarStartMinutes;
    const top = Math.max(0, topMinutes * PIXELS_PER_MINUTE);
    const endMinutesOfDay = event.endHour * 60 + event.endMinute;
    const durationMinutes = endMinutesOfDay - startMinutesOfDay;
    const height = durationMinutes * PIXELS_PER_MINUTE;

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="h-full relative overflow-hidden">
      {/* Event container (absolute positioning) */}
      <div className="absolute inset-0 pt-0">
        {events.map((event, index) => (
          <div
            key={index}
            className="absolute px-1"
            style={{
              ...getEventPositionStyles(event),
              left: '5%',
              width: '95%',
            }}
          >
            <EventItem
              title={event.title}
              subtitle={event.subtitle}
              color={event.color}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarDayColumn;
