/**
 * DayHeader component.
 * Displays the name of the day and the date number.
 */
interface DayHeaderProps {
  /** The name of the day (e.g., "Monday"). */
  dayName: string;
  /** The date number (e.g., 10). */
  date: number;
  /** Whether the day is today (for styling). */
  isToday?: boolean;
}

const DayHeader = ({ dayName, date, isToday = false }: DayHeaderProps) => {
  return (
    <div className="flex flex-col items-center pt-4 pb-2">
      {/* Nom du jour */}
      <span className="text-sm font-medium text-gray-500">{dayName}</span>
      {/* Date */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center mt-1 font-bold text-sm 
          ${isToday ? 'bg-blue-600 text-white' : 'text-gray-900'}`}
      >
        {date}
      </div>
    </div>
  );
};

export default DayHeader;
