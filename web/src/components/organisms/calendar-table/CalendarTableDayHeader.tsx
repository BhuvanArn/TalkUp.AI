import { CalendarTableDayHeaderProps } from './types';

/**
 * CalendarTableDayHeader component to display the header for each day in the calendar.
 *
 * @param param0 Props for the CalendarTableDayHeader component.
 * @returns A styled header for a calendar day.
 */
const CalendarTableDayHeader = ({
  dayName,
  date,
  isToday = false,
}: CalendarTableDayHeaderProps) => {
  return (
    <div className="flex flex-col items-center gap-1 py-3">
      <span className="text-body-m text-idle">{dayName}</span>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-body-xl-strong
          ${isToday ? 'bg-accent text-white' : 'text-idle'}`}
      >
        {date}
      </div>
    </div>
  );
};

export default CalendarTableDayHeader;
