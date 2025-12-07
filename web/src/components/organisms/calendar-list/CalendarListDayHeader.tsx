import IconAction from '@/components/atoms/icon-action';

import { CalendarListDayHeaderProps } from './types';

/**
 * CalendarListDayHeader component.
 * Displays the header for a day in the calendar list view, including the day name, date, and an add event button.
 *
 * @param props - The properties for the component.
 * @returns The rendered day header component.
 */
const CalendarListDayHeader = ({
  dayName,
  date,
  isToday,
  fullDate,
  calendarViewMode,
  onDayClick,
  onCreateEvent,
}: CalendarListDayHeaderProps) => {
  return (
    <div
      className={`relative flex items-center ${calendarViewMode === 'week' && 'hover:bg-surface'} rounded-[5px] justify-between`}
    >
      {calendarViewMode === 'week' && (
        <button
          className="w-full h-full absolute cursor-pointer z-10"
          onClick={() => onDayClick(fullDate)}
        />
      )}
      <div className="pl-2 grid grid-cols-[100px_100px_1fr] items-center justify-center">
        <span className="text-body-m text-idle">{dayName}</span>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-body-xl-strong 
            ${isToday ? 'bg-accent text-white' : 'text-idle'}`}
        >
          <span>{date}</span>
        </div>
      </div>

      <IconAction
        onClick={() => onCreateEvent(fullDate)}
        className={`opacity-0 hover:bg-surface-raised z-10 mr-1 rounded-full p-1 ${
          calendarViewMode === 'day'
            ? 'opacity-100'
            : 'group-hover:opacity-100 focus:opacity-100'
        }`}
        title="Add event"
        icon="plus"
      />
    </div>
  );
};

export default CalendarListDayHeader;
