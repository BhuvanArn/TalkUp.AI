import CalendarOptionBar from '@/components/molecules/calendar-option-bar';
import { useState } from 'react';

import CalendarList from '../calendar-list';
import CalendarTable from '../calendar-table';

/**
 * Defines the possible views for the calendar display.
 * @type {'List' | 'Table'}
 */
type CalendarView = 'List' | 'Table';

/**
 * @interface CalendarContainerProps
 * Properties for the CalendarContainer component.
 */
interface CalendarContainerProps {
  /** The initial view mode for the calendar ('List' or 'Table'). */
  initialView: CalendarView;
}

/**
 * @function CalendarContainer
 * @param {CalendarContainerProps} props - The properties object.
 * @returns {JSX.Element} The rendered calendar view container.
 * * The CalendarContainer acts as a controller, managing the state of the
 * calendar view (List or Table) and conditionally rendering the appropriate
 * view component (CalendarTable or CalendarList).
 */
const CalendarContainer = ({ initialView }: CalendarContainerProps) => {
  const [activeView, setActiveView] = useState<CalendarView>(initialView);

  return (
    <div>
      {/* 1. Option Bar (Molecule) - Provides navigation and view switch buttons */}
      <CalendarOptionBar activeView={activeView} onViewChange={setActiveView} />

      {/* 2. Calendar Display based on the active state */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {activeView === 'Table' && <CalendarTable />}
        {activeView === 'List' && <CalendarList />}
      </div>
    </div>
  );
};

export default CalendarContainer;
