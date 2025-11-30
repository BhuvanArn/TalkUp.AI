import EventItem, { EventItemProps } from '@/components/atoms/event-item';
import { useCalendarStore } from '@/components/molecules/calendar-option-bar/useCalendarStore';

/**
 * Extended event data including time and positioning info for the calendar column.
 */
export interface EventData extends EventItemProps {
  id: string;
  fullDate: Date;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  dayName: string;
  date: number;
  isToday: boolean;
}

/**
 * Props for the CalendarDayColumn component.
 */
interface CalendarDayColumnProps {
  dayName: string;
  date: number;
  isToday: boolean;
  events: EventData[];
}

/**
 * CalendarDayColumn renders all events in a single day column.
 * It positions events vertically based on their start/end time and
 * handles clicks to open the edit modal for each event.
 *
 * @param {CalendarDayColumnProps} props - Properties for the day column
 * @returns {JSX.Element} Rendered day column with events
 */
const CalendarDayColumn = ({ events }: CalendarDayColumnProps) => {
  const CALENDAR_START_HOUR = 8;
  const PIXELS_PER_MINUTE = 1;
  const openModalForEdit = useCalendarStore((state) => state.openModalForEdit);

  /**
   * Computes the top and height CSS values for an event based on its time.
   *
   * @param {EventData} event - The event data
   * @returns {{top: string; height: string}} CSS styles
   */
  const getEventPositionStyles = (event: EventData) => {
    const startMinutes = event.startHour * 60 + event.startMinute;
    const calendarStartMinutes = CALENDAR_START_HOUR * 60;
    const top = Math.max(
      0,
      (startMinutes - calendarStartMinutes) * PIXELS_PER_MINUTE,
    );
    const height =
      (event.endHour * 60 + event.endMinute - startMinutes) * PIXELS_PER_MINUTE;
    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <div className="h-full relative overflow-hidden">
      {events.map((event, idx) => (
        <div
          key={idx}
          className="absolute px-1 cursor-pointer"
          style={{
            ...getEventPositionStyles(event),
            left: '5%',
            width: '95%',
          }}
          onClick={(e) => {
            e.stopPropagation();
            openModalForEdit(event);
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
  );
};

export default CalendarDayColumn;
