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

/**
 * @interface CalendarContainerProps
 * Properties for the CalendarContainer component.
 */
interface CalendarContainerProps {
  /** The active view mode for the calendar ('list' or 'table'). */
  activeView: CalendarView;
}

const CalendarContainer = ({ activeView }: CalendarContainerProps) => {
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {activeView === 'table' && <CalendarTable />}
      {activeView === 'list' && <CalendarList />}
      <CalendarModal />
    </div>
  );
};

export default CalendarContainer;
