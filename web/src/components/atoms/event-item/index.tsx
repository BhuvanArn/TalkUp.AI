/**
 * EventItem component.
 * Displays a single, color-coded calendar event.
 * Note: The height and top position will be controlled by the parent component (CalendarDayColumn)
 * using inline styles (or utility classes) based on start/end time.
 */
interface EventItemProps {
  /** The primary label of the event (e.g., "Interview Amazon Web"). */
  title: string;
  /** The secondary information (e.g., "Amazon Web"). */
  subtitle: string;
  /** The color scheme for the event (tailwind classes for bg-color). */
  color: 'green' | 'blue' | 'red';
}

const colorMap = {
  green: 'bg-green-100 border-l-4 border-green-500 text-green-800',
  blue: 'bg-blue-100 border-l-4 border-blue-500 text-blue-800',
  red: 'bg-red-100 border-l-4 border-red-500 text-red-800',
};

const EventItem = ({ title, subtitle, color }: EventItemProps) => {
  return (
    <div
      className={`absolute w-full p-2 text-xs rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow 
                    ${colorMap[color]}`}
      style={{
        minHeight: '40px',
      }}
    >
      <p className="font-semibold leading-none">{title}</p>
      <p className="leading-none mt-0.5">{subtitle}</p>
    </div>
  );
};

export default EventItem;
