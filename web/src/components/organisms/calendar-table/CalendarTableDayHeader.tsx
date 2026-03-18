import IconAction from '@/components/atoms/icon-action';

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
  view = 'week',
  onBackToWeek,
}: CalendarTableDayHeaderProps) => {
  if (view === 'day') {
    return (
      <div className="pl-2 grid grid-cols-[100px_100px_1fr] items-center justify-center pt-3 pb-6">
        <span className="text-body-m text-idle">{dayName}</span>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-body-xl-strong 
            ${isToday ? 'bg-accent text-white' : 'text-idle'}`}
        >
          <span>{date}</span>
        </div>
        <div className="w-full flex justify-end">
          <IconAction
            onClick={(e) => {
              e.stopPropagation();
              onBackToWeek?.();
            }}
            className="hover:bg-surface-raised z-10 mr-1 rounded-full p-1 text-idle"
            title="Go back to Week"
            icon="arrow-left"
          />
        </div>
      </div>
    );
  }

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
