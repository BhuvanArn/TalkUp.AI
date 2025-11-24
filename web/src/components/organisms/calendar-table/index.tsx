import CurrentTimeCursor from '@/components/atoms/current-time-cursor';
import DayHeader from '@/components/atoms/day-header';
import TimeSlot from '@/components/atoms/time-slot';
import {
  CalendarEvent,
  useCalendarStore,
} from '@/components/molecules/calendar-option-bar/useCalendarStore';
import CalendarDayColumn, {
  EventData,
} from '@/components/organisms/calendar-day-column';
import { addDays, getDay, isSameDay, startOfWeek } from 'date-fns';
import { useMemo } from 'react';

/**
 * Array of time slot labels (8:00 to 18:00).
 * @type {string[]}
 */
const timeSlots = Array.from({ length: 11 }, (_, i) => `${8 + i}:00`);
/**
 * Height of a single time slot in pixels.
 * @type {number}
 */
const slotHeight = 60;

/**
 * Generates the data for the 7 days of the week and filters corresponding events.
 * REQUIRES that CalendarEvent has a 'fullDate: Date' property.
 * @param {Date} startDate The Monday of the week (weekStart from the store).
 * @param {CalendarEvent[]} allEvents All available events from the store.
 * @returns {Array<{
 * dayName: string,
 * date: number,
 * isToday: boolean,
 * events: EventData[]
 * }>} The data for 7 days (dayName, date, isToday, events).
 */
const getWeekDaysData = (startDate: Date, allEvents: CalendarEvent[]) => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(startDate.getTime())) {
    console.error('Invalid startDate provided to getWeekDaysData:', startDate);
    return [];
  }

  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);

    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayDate = date.getDate();

    const isToday = isSameDay(date, today);
    const events = allEvents.filter((e) => {
      return e.fullDate && isSameDay(e.fullDate, date);
    }).map((event) => ({
      dayName,
      date: dayDate,
      isToday,
      ...event,
    }));

    days.push({
      dayName,
      date: dayDate,
      isToday,
      events: events as EventData[],
    });
  }
  return days;
};

/**
 * Calculates the vertical position of the current time cursor.
 * @returns {string | null} The 'top' CSS value as a percentage string (e.g., "50%"), or null if outside time range.
 */
const getCurrentCursorPosition = () => {
  const now = new Date();
  const startHour = 8;
  const currentHour = now.getHours() + now.getMinutes() / 60;

  if (currentHour < startHour || currentHour > startHour + timeSlots.length) {
    return null;
  }

  const minutesSinceStart = (currentHour - startHour) * 60;
  const totalMinutes = timeSlots.length * slotHeight;
  return `${(minutesSinceStart / totalMinutes) * 100}%`;
};

/**
 * CalendarTable component.
 * Displays the weekly calendar grid.
 *
 * @returns {JSX.Element} The rendered calendar table.
 */
const CalendarTable = () => {
  const { weekStart, events } = useCalendarStore();

  const daysData = useMemo(
    () => getWeekDaysData(weekStart, events),
    [weekStart, events],
  );

  const totalHeight = timeSlots.length * slotHeight;
  const now = new Date();

  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const isTodayInView = isSameDay(weekStart, currentWeekStart);

  const cursorTop = getCurrentCursorPosition();
  const todayIndex = isTodayInView ? (getDay(now) + 6) % 7 : -1;

  return (
    <div className="relative">
      {/* REMOVED: 
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Agenda TalkUp</h2>
        <p className="text-lg font-medium text-gray-600 mb-4">{headerDateRange}</p>
        These elements are managed by the parent container.
      */}

      <div className="border border-gray-200 rounded-lg">
        {/* 1. Day Headers (Grid 2*1) */}
        <div className="grid grid-cols-[80px_1fr] bg-gray-50 border-b border-gray-200">
          <div className="h-16"></div> {/* Empty corner */}
          <div className="grid grid-cols-7">
            {daysData.map((day) => (
              <div
                key={day.dayName + day.date}
                className="border-r border-gray-200 last:border-r-0"
              >
                <DayHeader
                  dayName={day.dayName}
                  date={day.date}
                  isToday={day.isToday}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 2. Main Content: TimeSlots + Days */}
        <div className="grid grid-cols-[80px_1fr]">
          {/* Column 1: TimeSlots */}
          <div className="border-r border-gray-200">
            {timeSlots.map((time) => (
              <div key={time} style={{ height: `${slotHeight}px` }}>
                <TimeSlot time={time} />
              </div>
            ))}
          </div>

          {/* Column 2: 7 Day Columns */}
          <div
            className="relative grid grid-cols-7"
            style={{ minHeight: `${totalHeight}px` }}
          >
            {/* Current Time Cursor */}
            {cursorTop && todayIndex !== -1 && (
              <div
                className={`absolute inset-y-0 w-1/7`}
                style={{
                  left: `${todayIndex * (100 / 7)}%`,
                  top: cursorTop,
                }}
              >
                <CurrentTimeCursor />
              </div>
            )}

            {/* The 7 day columns (CalendarDayColumn) */}
            {daysData.map((day) => (
              <div
                key={day.dayName + day.date}
                className="relative h-full border-r last:border-r-0"
              >
                {/* Hourly Grid Lines */}
                {timeSlots.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{
                      top: `${i * slotHeight + slotHeight}px`,
                      height: `${slotHeight}px`,
                    }}
                  />
                ))}
                <CalendarDayColumn 
                  events={day.events} 
                  dayName={day.dayName} 
                  date={day.date} 
                  isToday={day.isToday} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTable;