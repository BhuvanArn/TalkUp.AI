import IconAction from '@/components/atoms/icon-action';
import { useMiniCalendar } from '@/hooks/calendar/useMiniCalendar';
import { isSameDay } from 'date-fns';

/**
 * MiniCalendar component.
 * Displays a compact calendar view for month navigation and day selection.
 * 
 * @returns The MiniCalendar component.
 */
export const MiniCalendar = () => {
  const {
    days,
    monthYear,
    handlePrevMonth,
    handleNextMonth,
    handleDayClick,
    selectedWeekStart,
    selectedWeekEnd,
    daysOfWeek,
  } = useMiniCalendar();

  return (
    <div className="p-4 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <span className="text-h5 text-idle">{monthYear}</span>
        <div className="flex space-x-2">
          <IconAction
            icon="caret-left"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          />
          <IconAction
            icon="caret-right"
            onClick={handleNextMonth}
            aria-label="Next month"
          />
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((day) => (
          <span key={day} className="text-center text-body-s text-idle">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, index) => {
          const isSelectedWeek =
            day.fullDate >= selectedWeekStart &&
            day.fullDate <= selectedWeekEnd;

          const isStartOfWeek = isSameDay(day.fullDate, selectedWeekStart);
          const isEndOfWeek = isSameDay(day.fullDate, selectedWeekEnd);
          const isToday = isSameDay(day.fullDate, new Date());

          return (
            <button
              key={index}
              className={`h-8 flex items-center justify-center cursor-pointer relative
                ${isSelectedWeek ? 'bg-accent/10' : ''}
                ${isSelectedWeek && isStartOfWeek ? 'rounded-l-full' : ''}
                ${isSelectedWeek && isEndOfWeek ? 'rounded-r-full' : ''}
              `}
              onClick={() => handleDayClick(day)}
            >
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-body-s z-10
                  ${day.isNotCurrentMonth ? 'text-idle/50' : 'text-idle'} 
                  ${isToday ? 'bg-accent text-white font-bold' : ''}
                  ${isSelectedWeek && !isToday ? 'text-accent font-medium' : ''}
                `}
              >
                {day.date}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
