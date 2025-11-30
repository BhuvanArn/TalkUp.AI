/**
 * @fileoverview A component that displays the main calendar table view, typically showing a week.
 * It includes day headers, time slots, and columns for displaying calendar events.
 */
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

import CalendarModal from '../event-modal/CalendarModal';

/**
 * An array of time strings representing the start of each hour slot displayed in the calendar.
 * Starts at 8:00 and includes 11 slots (up to 18:00).
 */
const timeSlots = Array.from({ length: 11 }, (_, i) => `${8 + i}:00`);

/**
 * The fixed height in pixels for each time slot (e.g., one hour).
 */
const slotHeight = 60;

/**
 * Generates an array of data for each day of the week, starting from a given date.
 * It calculates the day name, date, if it's today, and filters the relevant events for that day.
 *
 * @param {Date} startDate The date representing the start of the week (e.g., Monday).
 * @param {CalendarEvent[]} allEvents A list of all calendar events.
 * @returns {{ dayName: string; date: number; isToday: boolean; events: EventData[] }[]} An array of objects, one for each day of the week.
 */
const getWeekDaysData = (startDate: Date, allEvents: CalendarEvent[]) => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayDate = date.getDate();
    const isToday = isSameDay(date, today);
    const events = allEvents
      .filter((e) => e.fullDate && isSameDay(e.fullDate, date))
      .map((event) => ({ dayName, date: dayDate, isToday, ...event }));
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
 * Calculates the vertical position of the current time cursor based on the current time.
 * The position is returned as a percentage string relative to the total height of the time slots.
 *
 * @returns {string | null} The 'top' CSS value as a percentage string (e.g., "50%"), or `null` if the current time is outside the visible range (8:00 to 19:00).
 */
const getCurrentCursorPosition = () => {
  const now = new Date();
  const startHour = 8;
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const endHour = startHour + timeSlots.length;
  if (currentHour < startHour || currentHour > endHour) return null;
  const minutesSinceStart = (currentHour - startHour) * 60;
  const totalMinutesInView = timeSlots.length * 60;
  return `${(minutesSinceStart / totalMinutesInView) * 100}%`;
};

/**
 * @component
 * @description The main component for displaying the calendar in a weekly table view.
 * It fetches calendar data from the store, calculates day and event positions, and renders
 * the grid structure, day headers, time slots, and calendar events.
 */
const CalendarTable = () => {
  const { weekStart, events, openModalForCreation } = useCalendarStore();
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
      <div className="border border-gray-200 rounded-lg">
        {/* Headers */}
        <div className="grid grid-cols-[80px_1fr] bg-gray-50 border-b border-gray-200">
          <div className="h-16"></div> {/* Empty cell above time slots */}
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

        {/* Main Grid */}
        <div className="grid grid-cols-[80px_1fr]">
          {/* Time Slots Column */}
          <div className="border-r border-gray-200">
            {timeSlots.map((time) => (
              <div key={time} style={{ height: `${slotHeight}px` }}>
                <TimeSlot time={time} />
              </div>
            ))}
          </div>

          {/* Day Columns Area (Events) */}
          <div
            className="relative grid grid-cols-7"
            style={{ minHeight: `${totalHeight}px` }}
          >
            {/* Current Time Cursor */}
            {cursorTop && todayIndex !== -1 && (
              <div
                className="absolute inset-y-0 w-1/7"
                style={{
                  left: `${todayIndex * (100 / 7)}%`,
                  top: cursorTop,
                }}
              >
                <CurrentTimeCursor />
              </div>
            )}

            {/* Individual Day Columns with Events */}
            {daysData.map((day) => (
              <div
                key={day.dayName + day.date}
                className="relative h-full border-r last:border-r-0 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relativeY = e.clientY - rect.top;
                  const slotIndex = Math.floor(relativeY / slotHeight);
                  const startHour = 8 + slotIndex;
                  const initialDate = new Date(
                    weekStart.getFullYear(),
                    weekStart.getMonth(),
                    day.date,
                    startHour,
                  );
                  openModalForCreation(initialDate);
                }}
              >
                {/* Horizontal time slot separators */}
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
        <CalendarModal />
      </div>
    </div>
  );
};

export default CalendarTable;
