import { useCalendarStore } from '@/stores/useCalendarStore';

import CalendarList from '../calendar-list';
import CalendarTable from '../calendar-table';
/**
 * @function CalendarContainer
 * @param {CalendarContainerProps} props - The properties object.
 * @returns {JSX.Element} The rendered calendar view container.
 * * The CalendarContainer acts as a controller, managing the state of the
 * calendar view (List or Table) and conditionally rendering the appropriate
 * view component (CalendarTable or CalendarList).
 */
import CalendarModal from '../event-modal';

/**
 * Defines the possible views for the calendar display.
 * @type {'list' | 'table'}
 */
export type CalendarView = 'list' | 'table';

const CalendarContainer = () => {
  const { calendarLayoutMode } = useCalendarStore();
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {calendarLayoutMode === 'table' && <CalendarTable />}
      {calendarLayoutMode === 'list' && <CalendarList />}
      <CalendarModal />
    </div>
  );
};

export default CalendarContainer;
