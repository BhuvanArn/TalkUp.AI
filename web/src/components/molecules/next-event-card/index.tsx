import { Icon } from '@/components/atoms/icon';
import { useCalendarStore } from '@/components/molecules/calendar-option-bar/useCalendarStore';

/**
 * NextEventCard component props.
 */
interface NextEventCardProps {
  title: string;
  subtitle: string;
  date: string;
  tagLabel: string;
  detailsUrl: string;
  // NOUVEAU: La date complète pour la navigation
  eventDate: Date;
}

/**
 * NextEventCard component.
 * Displays details about the next scheduled event, typically used in a sidebar.
 *
 * @param {NextEventCardProps} props The properties object.
 * @returns {JSX.Element} The rendered event card.
 */
const NextEventCard = ({
  title,
  subtitle,
  date,
  tagLabel,
  detailsUrl,
  eventDate,
}: NextEventCardProps) => {
  const { setCurrentDate } = useCalendarStore();

  // Handler pour naviguer vers la semaine de l'événement
  const handleGoToEventWeek = () => {
    setCurrentDate(eventDate);
    console.log(`Navigating to the week of: ${eventDate.toISOString()}`);
    // Vous pouvez également ouvrir la modale ou sélectionner le jour ici si nécessaire
  };

  return (
    // Rendre l'ensemble de la carte cliquable pour la navigation
    <div
      className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition duration-150 ease-in-out"
      onClick={handleGoToEventWeek} // Ajout du gestionnaire de clic
    >
      <h3 className="text-base font-semibold text-gray-800 mb-3">Next Event</h3>

      {/* Event Content */}
      <div className="space-y-2">
        <p className="font-semibold text-gray-900 leading-tight">{title}</p>
        <p className="text-sm text-gray-600 leading-tight">{subtitle}</p>
        <p className="text-xs text-gray-400 leading-tight">{date}</p>
      </div>

      {/* Tags and See More Link */}
      <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-3">
          {tagLabel}
        </span>
        {/* J'ai supprimé le 'detailsUrl' pour le remplacer par l'action du clic sur la carte, 
            mais vous pouvez le laisser si vous avez un lien externe à côté. */}
        <span className="text-xs text-blue-500 flex items-center">
          Go to week
          <Icon icon="arrow-right" size="xs" className="ml-1" />
        </span>
      </div>
    </div>
  );
};

export default NextEventCard;
