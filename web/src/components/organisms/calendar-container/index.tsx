import CalendarOptionBar from '@/components/molecules/calendar-option-bar';
import { useState } from 'react';

import CalendarList from '../calendar-list';
import CalendarTable from '../calendar-table';

/**
 * Defines the possible views for the calendar display.
 * @type {'list' | 'table'}
 */
export type CalendarView = 'list' | 'table';

/**
 * @interface CalendarContainerProps
 * Properties for the CalendarContainer component.
 */
interface CalendarContainerProps {
  /** The active view mode for the calendar ('list' or 'table'). */
  activeView: CalendarView;
}

/**
 * @function CalendarContainer
 * @param {CalendarContainerProps} props - The properties object.
 * @returns {JSX.Element} The rendered calendar view container.
 * * The CalendarContainer acts as a controller, managing the state of the
 * calendar view (List or Table) and conditionally rendering the appropriate
 * view component (CalendarTable or CalendarList).
 */
const CalendarContainer = ({ activeView }: CalendarContainerProps) => {
  return (
    <div className="h-full flex flex-col">
      {activeView === 'table' && <CalendarTable />}
      {activeView === 'list' && <CalendarList />}
    </div>
  );
};

export default CalendarContainer;
