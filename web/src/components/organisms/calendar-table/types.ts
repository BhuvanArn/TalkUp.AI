export interface CalendarTableDayHeaderProps {
  /** The name of the day (e.g., "Monday"). */
  dayName: string;
  /** The date number (e.g., 10). */
  date: number;
  /** Whether the day is today (for styling). */
  isToday?: boolean;
  /** The current calendar view mode. */
  view?: 'week' | 'day';
  /** Callback to switch back to week view. */
  onBackToWeek?: () => void;
}

export interface CalendarTableEventItemProps {
  /** The primary label of the event (e.g., "Interview"). */
  title: string;
  /** The secondary information (e.g., "Amazon Web"). */
  subtitle: string;
  /** The color scheme for the event. Can be a name ('blue') or a hex code. */
  color: string;
  /** Start hour (0-23) */
  startHour?: number;
  /** Start minute (0-59) */
  startMinute?: number;
  /** End hour (0-23) */
  endHour?: number;
  /** End minute (0-59) */
  endMinute?: number;
}
