
import { addDays, format, isDate } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Locale } from 'date-fns/locale';

import { useCalendarStore } from './useCalendarStore';

/**
 * Defines the possible views for the calendar display.
 * @type {'List' | 'Table'}
 */
type CalendarView = 'List' | 'Table';

/**
 * @interface CalendarOptionBarProps
 * Properties for the CalendarOptionBar component.
 */
interface CalendarOptionBarProps {
  /** The currently active view mode ('List' or 'Table'). */
  activeView: CalendarView;
  /** Callback function to change the active view mode. */
  onViewChange: (newView: CalendarView) => void;
}


/**
 * @function CalendarOptionBar
 * @param {CalendarOptionBarProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered calendar option bar component.
 * * The CalendarOptionBar displays the current week's date range and allows the user 
 * to switch between the 'Table' (Grid) and 'List' views.
 */
const CalendarOptionBar = ({ activeView, onViewChange }: CalendarOptionBarProps) => { 
  const { weekStart } = useCalendarStore();
  
  const isWeekStartValid = isDate(weekStart) && !isNaN(weekStart.getTime());
  let weekTitle = 'Loading...';
  
  type FormatWithOptions = (
    date: Date | number,
    formatStr: string,
    options: { locale?: Locale },
  ) => string;
  const formatWithLocale = format as FormatWithOptions;

  if (isWeekStartValid) {
    const weekEnd = addDays(weekStart, 6);
    const startDay = formatWithLocale(weekStart, 'd', { locale: fr });
    const endFull = formatWithLocale(weekEnd, 'd MMMM yyyy', { locale: fr });
    weekTitle = `${startDay} - ${endFull}`;
  } else {
    weekTitle = 'Invalid Date';
  }

  return (
    <div className="flex items-center justify-between p-4">
      {/* 1. Week Title (Date Range Display) */}
      <span className="text-2xl font-bold text-gray-800">{weekTitle}</span>

      {/* 2. VIEW SELECTOR */}
      <div className="flex border border-gray-300 rounded-md shadow-sm">
        {/* TABLE/GRID Button */}
        <button
          className={`px-3 py-1 text-sm font-medium transition-colors duration-150
            ${activeView === 'Table' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          onClick={() => onViewChange('Table')}
        >
          Grid
        </button>

        {/* LIST Button */}
        <button
          className={`px-3 py-1 text-sm font-medium transition-colors duration-150
            ${activeView === 'List' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
            } border-l border-gray-300`}
          onClick={() => onViewChange('List')}
        >
          List
        </button>
      </div>
    </div>
  );
};

export default CalendarOptionBar;