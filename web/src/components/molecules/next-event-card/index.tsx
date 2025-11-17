import { Icon } from '@/components/atoms/icon';
import { useCalendarStore } from '../calendar-option-bar/useCalendarStore';
import { format } from 'date-fns'; 

/**
 * NextEventCard component props.
 * @interface NextEventCardProps
 */
interface NextEventCardProps {
  /** The main title of the event. */
  title: string;
  /** The secondary subtitle or location of the event. */
  subtitle: string;
  /** The label for the event tag (e.g., 'TalkUp'). */
  tagLabel: string;
  /** The URL for viewing event details. */
  detailsUrl: string; 
  /** The complete Date object of the event. */
  eventDate: Date; 
}

/**
 * NextEventCard component.
 * Displays details about the next scheduled event, typically used in a sidebar.
 * @function NextEventCard
 */
const NextEventCard = ({
  title,
  subtitle,
  tagLabel,
  eventDate, 
}: NextEventCardProps) => {
  const { setCurrentDate } = useCalendarStore();

  /** Formatted date string for display (e.g., "18 November 2025"). */
  const displayDate = eventDate instanceof Date && !isNaN(eventDate.getTime())
    ? format(eventDate, 'dd MMMM yyyy')
    : 'Date inconnue';
    
  /** Handler to navigate the calendar view to the event's week. */
  const handleGoToEventWeek = () => {
    try {
      if (!eventDate || isNaN(eventDate.getTime())) {
        console.error("[NextEventCard] Invalid eventDate.", eventDate);
        return;
      }
  
      console.log(`[NextEventCard] Navigating to week of: ${eventDate.toISOString()}`);
  
      setCurrentDate(eventDate);
    } catch (err) {
      console.error("[NextEventCard] Error in handleGoToEventWeek:", err);
    }
  };
  
  return (
    <div
      className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
    >
      <h3 className="text-base font-semibold text-gray-800 mb-3">Next Event</h3>

      {/* Event Content */}
      <div className="space-y-2">
        <p className="font-semibold text-gray-900 leading-tight">{title}</p>
        <p className="text-sm text-gray-600 leading-tight">{subtitle}</p>
        <p className="text-xs text-gray-400 leading-tight">{displayDate}</p>
      </div>

      {/* Actions and Tags */}
      <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
        
        {/* Tag (TalkUp) */}
        <button 
            type="button" 
            className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-3 hover:bg-blue-100 transition duration-150"
        >
            {tagLabel}
        </button>

        {/* "Go to week" button */}
        <button
            type="button"
            onClick={handleGoToEventWeek} 
            className="text-xs text-blue-500 flex items-center hover:text-blue-700 focus:outline-none transition duration-150"
        >
          Go to week
          <Icon icon="arrow-right" size="xs" className="ml-1" /> 
        </button>
      </div>
    </div>
  );
};

export default NextEventCard;