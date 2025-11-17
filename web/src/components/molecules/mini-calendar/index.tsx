import { Icon } from '@/components/atoms/icon';
import { useCalendarStore } from '@/components/molecules/calendar-option-bar/useCalendarStore';
import { MiniCalendarDay, getMiniCalendarDays } from '@/utils/calendarUtils';
import { useMemo, useState } from 'react';
import { addDays } from 'date-fns';

interface MiniCalendarViewProps {}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * MiniCalendar component.
 * Displays a small, monthly calendar view used in the sidebar.
 * It manages its own monthly navigation (displayDate) and interacts with the store (currentDate).
 * @param {MiniCalendarViewProps} props - Component properties.
 * @returns {JSX.Element} The MiniCalendar component.
 */
export const MiniCalendar = ({}: MiniCalendarViewProps) => {
  const [displayDate, setDisplayDate] = useState(new Date());

  const { setCurrentDate, currentDate } = useCalendarStore();

  const days: MiniCalendarDay[] = useMemo(
    () => getMiniCalendarDays(displayDate),
    [displayDate],
  );

  const monthYear = displayDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    setDisplayDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setDisplayDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleDayClick = (day: MiniCalendarDay) => {
    setCurrentDate(day.fullDate);

    if (day.isGray) {
      setDisplayDate(day.fullDate);
    }
  };

  const currentWeekStart = new Date(currentDate);
  currentWeekStart.setHours(0, 0, 0, 0);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-base font-semibold text-gray-800">
          {monthYear}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={handlePrevMonth}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Previous month"
          >
            <Icon icon="arrow-left" size="sm" />
          </button>
          <button
            onClick={handleNextMonth}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Next month"
          >
            <Icon icon="arrow-right" size="sm" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-2">
        {daysOfWeek.map((day) => (
          <span key={day} className="h-6 flex items-center justify-center">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center text-sm">
        {days.map((day, index) => {
          const isSelectedDayInWeek = (day: MiniCalendarDay) => {
            if (day.isGray) return false;

            const dayTime = day.fullDate.getTime();
            const weekStart = currentWeekStart.getTime();
            
            const weekEnd = addDays(currentWeekStart, 7).getTime(); 

            return dayTime >= weekStart && dayTime < weekEnd;
          };

          const isCurrentWeek = isSelectedDayInWeek(day);

          return (
            <div key={index} className="h-8 flex items-center justify-center">
              <button
                onClick={() => handleDayClick(day)}
                className={`w-8 h-6 flex items-center justify-center rounded-lg transition duration-150 ease-in-out
                  ${day.isGray ? 'text-gray-400' : 'text-gray-800 cursor-pointer hover:bg-gray-100'} 
                  ${day.isToday ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}
                  ${isCurrentWeek && !day.isToday ? 'bg-blue-100 text-blue-700 font-semibold border border-blue-300' : ''}
                `}
                disabled={
                  day.isGray &&
                  day.fullDate.getMonth() !== displayDate.getMonth()
                }
              >
                {day.date}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;