import { CalendarEvent } from '@/stores/useCalendarStore';

/**
 * Represents a single event item in the calendar list view.
 */
export interface ListEventItem {
  /** The title of the event. */
  title: string;
  /** The subtitle or description of the event. */
  subtitle: string;
  /** The color identifier for the event. */
  color: string;
  /** The start time of the event formatted as a string (e.g., "HH:mm"). */
  startTime: string;
  /** The end time of the event formatted as a string (e.g., "HH:mm"). */
  endTime: string;
  /** The original calendar event object. */
  originalEvent: CalendarEvent;
}

/**
 * Represents the data for a single day in the calendar list.
 */
export interface CalendarListDayData {
  /** The name of the day (e.g., "Monday"). */
  dayName: string;
  /** The day of the month (e.g., 15). */
  date: number;
  /** The full date object for the day. */
  fullDate: Date;
  /** Indicates if this day is the current date. */
  isToday: boolean;
  /** An array of events scheduled for this day. */
  events: ListEventItem[];
}

/**
 * Props for the CalendarListDayHeader component.
 */
export interface CalendarListDayHeaderProps {
  /** The name of the day to display. */
  dayName: string;
  /** The day of the month to display. */
  date: number;
  /** Indicates if the day is today, used for styling. */
  isToday: boolean;
  /** The full date object for the day. */
  fullDate: Date;
  /** The current view mode of the calendar. */
  calendarViewMode: 'month' | 'week' | 'day';
  /** Callback function triggered when the day header is clicked. */
  onDayClick: (date: Date) => void;
  /** Callback function triggered when the add event button is clicked. */
  onCreateEvent: (date: Date) => void;
}

/**
 * Props for the CalendarListAddButton component.
 */
export interface CalendarListAddButtonProps {
  /** Callback function triggered when the button is clicked. */
  onClick: () => void;
}

/**
 * Props for the CalendarListDayGroup component.
 */
export interface CalendarListDayGroupProps {
  /** The data for the day to display. */
  day: CalendarListDayData;
  /** The current view mode of the calendar. */
  calendarViewMode: 'month' | 'week' | 'day';
  /** Callback function triggered when an event is clicked. */
  onEventClick: (event: ListEventItem) => void;
  /** Callback function triggered when the add event button is clicked. */
  onCreateEvent: (date: Date) => void;
  /** Callback function triggered when the day header is clicked. */
  onDayClick: (date: Date) => void;
}

/**
 * ListEventBlock component props.
 */
export interface ListEventBlockProps {
  /** The primary label of the event (e.g., "Interview Amazon Web"). */
  title: string;
  /** The secondary information (e.g., "Google Cloud France"). */
  subtitle: string;
  /** The color scheme for the event. */
  color: string;
  /** Start time (e.g., "8:30"). */
  startTime: string;
  /** End time (e.g., "9:30"). */
  endTime: string;
}
