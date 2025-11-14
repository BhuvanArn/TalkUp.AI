/**
 * ListEventBlock component props.
 */
interface ListEventBlockProps {
  /** The primary label of the event (e.g., "Interview Amazon Web"). */
  title: string;
  /** The secondary information (e.g., "Google Cloud France"). */
  subtitle: string;
  /** The color scheme for the event (tailwind classes for bg-color). */
  color: 'green' | 'blue' | 'red';
  /** Start time (e.g., "8:30"). */
  startTime: string;
  /** End time (e.g., "9:30"). */
  endTime: string;
}

const colorMap = {
  green: 'bg-green-50 border-green-500 text-green-800',
  blue: 'bg-blue-50 border-blue-500 text-blue-800',
  red: 'bg-red-50 border-red-500 text-red-800',
};

/**
 * ListEventBlock component.
 * Displays a single, color-coded calendar event block for the vertical list view.
 * It combines the time range and the event details.
 *
 * @param {ListEventBlockProps} props The properties object.
 * @returns {JSX.Element} The rendered event block for the list view.
 */
const ListEventBlock = ({
  title,
  subtitle,
  color,
  startTime,
  endTime,
}: ListEventBlockProps) => {
  return (
    <div className="flex flex-row items-start space-x-3 p-2 border border-gray-100 rounded-lg bg-white shadow-sm">
      {/* Colonne de l'heure (Atome interne) */}
      <div className="flex flex-col text-right w-16 text-xs text-gray-500 font-medium pt-1">
        <span>{startTime}</span>
        <span className="text-gray-400">- {endTime}</span>
      </div>

      {/* Contenu de l'événement */}
      <div
        className={`flex-grow p-2 text-xs rounded-md border-l-4 
                      ${colorMap[color]}`}
      >
        <p className="font-semibold leading-none">{title}</p>
        <p className="leading-none mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

export default ListEventBlock;
