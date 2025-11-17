import { format, addDays, isDate } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Locale } from 'date-fns/locale';
import { useCalendarStore } from './useCalendarStore'; 

/**
 * Calendar option bar component displaying the date range.
 * Navigation arrows are removed for this component.
 * @returns {JSX.Element} The calendar option bar component.
 */
const CalendarOptionBar = () => {
    const { weekStart } = useCalendarStore(); 
    const isWeekStartValid = isDate(weekStart) && !isNaN(weekStart.getTime());
    let weekTitle = "Loading...";
    type FormatWithOptions = (date: Date | number, formatStr: string, options: { locale?: Locale }) => string;
    const formatWithLocale = format as FormatWithOptions;
   
    if (isWeekStartValid) {
        const weekEnd = addDays(weekStart, 6);
        const startDay = formatWithLocale(weekStart, 'd', { locale: fr });
        const endFull = formatWithLocale(weekEnd, 'd MMMM yyyy', { locale: fr });
        weekTitle = `${startDay} - ${endFull}`;
       
    } else {
        weekTitle = "Invalid Date"; 
    }

    return (
        <div className="flex items-center text-2xl font-bold text-gray-800">
             
            {/* Week Title (Date Range) */}
            <span className="mx-4">
                {weekTitle}
            </span>
             
        </div>
    );
};

export default CalendarOptionBar;