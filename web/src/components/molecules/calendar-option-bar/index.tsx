import { addDays, format, isDate } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Locale } from 'date-fns/locale';

import { useCalendarStore } from './useCalendarStore';

type CalendarView = 'List' | 'Table';

interface CalendarOptionBarProps {
  activeView: CalendarView;
  onViewChange: (newView: CalendarView) => void;
}

/**
 * Calendar option bar component displaying the date range AND view selector.
 * @returns {JSX.Element} The calendar option bar component.
 */
const CalendarOptionBar = ({
  activeView,
  onViewChange,
}: CalendarOptionBarProps) => {
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
      {/* 1. Week Title (Date Range) */}
      <span className="text-2xl font-bold text-gray-800">{weekTitle}</span>

      {/* 2. views selection*/}
      <div className="flex border border-gray-300 rounded-md shadow-sm">
        {/* buttons TABLE/GRILLE */}
        <button
          className={`px-3 py-1 text-sm font-medium transition-colors duration-150
            ${
              activeView === 'Table'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          onClick={() => onViewChange('Table')}
        >
          Grille
        </button>

        {/* Buton LIST */}
        <button
          className={`px-3 py-1 text-sm font-medium transition-colors duration-150
            ${
              activeView === 'List'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border-l border-gray-300`}
          onClick={() => onViewChange('List')}
        >
          Liste
        </button>
      </div>
    </div>
  );
};

export default CalendarOptionBar;
