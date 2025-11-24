import { useCalendarStore } from '@/components/molecules/calendar-option-bar/useCalendarStore';
import { addHours, addMinutes } from 'date-fns';
import React, { useCallback, useRef } from 'react';

/**
 * @interface InteractionProps
 * @description Props required for the event addition interaction hook.
 */
interface InteractionProps {
  /** The index of the day in the week (0 for Monday, 6 for Sunday). */
  dayIndex: number;
  /** The date marking the start of the current week (typically Monday). */
  startOfWeek: Date;
}

/**
 * @constant PIXELS_PER_HOUR
 * @description The height in pixels representing one hour of time in the calendar grid.
 */
const PIXELS_PER_HOUR = 60;

/**
 * @constant CALENDAR_START_HOUR
 * @description The hour the calendar grid starts displaying (e.g., 8 for 8:00 AM).
 */
const CALENDAR_START_HOUR = 8;

/**
 * @function useAddEventInteraction
 * @description A custom hook to handle the interaction logic for adding a new event
 * by clicking on a calendar day column. It calculates the target time
 * based on the click position.
 * * @param {InteractionProps} { dayIndex, startOfWeek } The day index and the starting date of the week.
 * @returns {{ ref: React.MutableRefObject<HTMLDivElement | null>, handleClick: (e: React.MouseEvent<HTMLDivElement>) => void }}
 * An object containing a ref to attach to the day column and the click handler.
 */
export const useAddEventInteraction = ({
  dayIndex,
  startOfWeek,
}: InteractionProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { openModalForCreation } = useCalendarStore();

  /**
   * @function getTargetTime
   * @description Calculates the precise Date object corresponding to the vertical
   * click positions within the day column, snapping to 30-minute intervals.
   * * @param {number} clientY The vertical coordinate of the click relative to the viewport.
   * @returns {Date | null} The calculated date and time for the new event, or null if invalid.
   */
  const getTargetTime = (clientY: number): Date | null => {
    if (!ref.current || !(startOfWeek instanceof Date)) {
      console.warn('useAddEventInteraction: ref or startOfWeek is invalid');
      return null;
    }

    const rect = ref.current.getBoundingClientRect();
    const internalScroll = ref.current.scrollTop ?? 0;
    const yOffset = clientY - rect.top + internalScroll;

    if (yOffset < 0) return null;

    const totalMinutesSinceStart = (yOffset / PIXELS_PER_HOUR) * 60;

    const SNAP_MINUTES = 30;
    const snappedMinutes = Math.max(
      0,
      Math.round(totalMinutesSinceStart / SNAP_MINUTES) * SNAP_MINUTES,
    );

    const hoursOffset = Math.floor(snappedMinutes / 60);
    const minutes = snappedMinutes % 60;

    const dayDate = new Date(startOfWeek.getTime());
    dayDate.setDate(startOfWeek.getDate() + dayIndex);
    dayDate.setHours(0, 0, 0, 0);

    let finalDate = addHours(dayDate, CALENDAR_START_HOUR + hoursOffset);
    finalDate = addMinutes(finalDate, minutes);

    return finalDate;
  };

  /**
   * @function handleClick
   * @description Click handler attached to the day column. Prevents event propagation
   * and opens the modal for creation if a target time is successfully calculated.
   * * @param {React.MouseEvent<HTMLDivElement>} e The click event object.
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();

      const target = getTargetTime(e.clientY);
      if (target) {
        console.log(
          '[useAddEventInteraction] Creating event at',
          target.toISOString(),
        );
        openModalForCreation(target);
      } else {
        console.warn(
          "useAddEventInteraction: Unable to determine target time.",
        );
      }
    },
    [openModalForCreation, dayIndex, startOfWeek],
  );

  return {
    ref,
    handleClick,
  };
};