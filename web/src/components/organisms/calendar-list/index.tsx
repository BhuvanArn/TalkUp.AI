
import ListEventBlock from '@/components/atoms/list-event-block';
import {
  CalendarEvent,
  useCalendarStore,
} from '@/components/molecules/calendar-option-bar/useCalendarStore';
import { addDays, isSameDay } from 'date-fns';
import { useMemo } from 'react';

/**
 * @interface ListEventItem
 * Defines the structure for a single event to be displayed in the list view.
 */
interface ListEventItem {
  /** The main title of the event. */
  title: string;
  /** A descriptive subtitle or location. */
  subtitle: string;
  /** The color indicator for the event. */
  color: 'green' | 'blue' | 'red';
  /** The start time string (e.g., '8:30'). */
  startTime: string; 
  /** The end time string (e.g., '9:30'). */
  endTime: string; 
}

/**
 * @interface CalendarListDayData
 * Defines the aggregated data structure for a single day in the list view.
 */
interface CalendarListDayData {
  /** Short name of the day (e.g., 'Mon'). */
  dayName: string; 
  /** Numeric date of the month (e.g., 10). */
  date: number; 
  /** Indicates if the day is today. */
  isToday: boolean;
  /** List of events scheduled for this day. */
  events: ListEventItem[];
}

/**
 * @interface CalendarListProps
 * Properties for the CalendarList component.
 */
interface CalendarListProps {
  /** * Optional callback function to navigate to a specific date, 
   * typically used for modal opening or view change.
   * @param {Date} date The target date.
   */
  onGoToDate?: (date: Date) => void;
}

/**
 * Converts raw events from the store into a formatted array of days for the list view.
 * It processes events for a fixed seven-day interval starting from `startDate`.
 * * @param {Date} startDate - The first day of the week to process.
 * @param {CalendarEvent[]} allEvents - All events available in the calendar store.
 * @returns {CalendarListDayData[]} An array containing data for each of the seven days.
 */
const getListWeekDaysData = (startDate: Date, allEvents: CalendarEvent[]): CalendarListDayData[] => {
  const days: CalendarListDayData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(startDate.getTime())) return [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const isToday = isSameDay(date, today);

    const eventsForDay = allEvents
      .filter((e) => e.fullDate && isSameDay(e.fullDate, date))
      .map((e) => ({
        title: e.title,
        subtitle: e.subtitle,
        color: e.color || 'blue', 
        startTime: (e as any).startTime || '', 
        endTime: (e as any).endTime || '',
      }) as ListEventItem);

    days.push({
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      isToday,
      events: eventsForDay,
    });
  }
  return days;
};


/**
 * @function CalendarList
 * @param {CalendarListProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered calendar list view component.
 * * The CalendarList component displays scheduled events in a vertical list format. 
 * It dynamically fetches its data (current week start date and events) from the 
 * global `useCalendarStore` to ensure synchronization with navigation changes.
 */
const CalendarList = ({ onGoToDate }: CalendarListProps) => { 
  const { weekStart, events } = useCalendarStore();
  const daysData = useMemo(
    () => getListWeekDaysData(weekStart, events),
    [weekStart, events],
  );

  /**
   * Generates the full date string (e.g., "Monday, November 21") for the day header.
   * @param {number} dayIndex - The zero-based index of the day within the week (0-6).
   * @returns {string} The formatted full date string.
   */
  const getFullDate = (dayIndex: number): string => {
    const targetDate = new Date(weekStart); 
    targetDate.setDate(targetDate.getDate() + dayIndex);
    return targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  /**
   * Simulates opening a modal for the clicked event.
   * @param {number} dayIndex - The index of the day within the week.
   * @param {ListEventItem} event - The clicked event object.
   */
  const handleEventClick = (dayIndex: number, event: ListEventItem): void => {
    const targetDate = new Date(weekStart); 
    targetDate.setDate(targetDate.getDate() + dayIndex);
    const [hour, minute] = event.startTime.split(':').map(Number);
    targetDate.setHours(hour, minute, 0, 0);

    console.log(
      `Open Modal for event: ${event.title} at ${targetDate.toLocaleString()}`,
    );
  };

  const daysWithEvents = daysData.filter((day) => day.events.length > 0);

  return (
    <div className="p-4 space-y-6">
      {daysWithEvents.map((day, dayIndex) => (
        <div key={day.dayName + day.date} className="flex flex-col space-y-3">
          {/* Day Header and Date */}
          <div className="flex items-center space-x-3 pb-1 border-b border-gray-200">
            <div
              className={`flex flex-col items-center justify-center h-10 w-10 rounded-lg text-sm font-semibold 
                        ${day.isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
            >
              <span>{day.dayName}</span>
              <span>{day.date}</span>
            </div>

            <h3 className="text-lg font-semibold text-gray-800">
              {getFullDate(dayIndex)}
            </h3>
          </div>

          {/* List of Events for the Day */}
          <div className="flex flex-col space-y-2">
            {day.events.map((event, eventIndex) => (
              <div
                key={eventIndex}
                onClick={() => handleEventClick(dayIndex, event)}
              >
                <ListEventBlock
                  title={event.title}
                  subtitle={event.subtitle}
                  color={event.color}
                  startTime={event.startTime}
                  endTime={event.endTime}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {daysWithEvents.length === 0 && (
        <div className="text-center p-10 text-gray-500">
          No events scheduled for this week in List view.
        </div>
      )}
    </div>
  );
};

export default CalendarList;
