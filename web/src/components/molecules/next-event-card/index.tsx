import Badge from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { format } from 'date-fns';



/**
 * NextEventCard component.
 * Displays details about the next scheduled event, typically used in a sidebar.
 *
 * @param props - The component props.
 * @returns The rendered component.
 */
const NextEventCard = () => {
  const { getNextUpcomingEvent, setCurrentDate } = useCalendarStore();
  const nextEvent = getNextUpcomingEvent();

  if (!nextEvent) {
    return (
      <div className="p-4 bg-white rounded-[10px] text-center text-body-m text-gray-500">
        No events this month.
      </div>
    );
  }

  const { title, description, start: eventDate } = nextEvent;

  const displayDate =
    eventDate instanceof Date && !isNaN(eventDate.getTime())
      ? format(eventDate, 'd MMM yyyy')
      : 'Date inconnue';

  const handleGoToEventWeek = () => {
    if (eventDate && !isNaN(eventDate.getTime())) {
      setCurrentDate(eventDate);
    }
  };

  return (
    <div className="p-4 bg-white rounded-[10px] flex flex-col gap-3">
      <h3 className="text-h5 text-idle">Next Event</h3>

      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <p className="text-body-m text-active">{title}</p>
          <p className="text-body-s text-idle italic">{displayDate}</p>
        </div>
        <p className="text-body-s text-idle">{description || ''}</p>
      </div>

      <div className="flex gap-3">
        <Badge color="accent">TalkUp</Badge>

        <Button
          size="xs"
          color="sidebar"
          variant="outlined"
          onClick={handleGoToEventWeek}
        >
          Go to week
          <Icon icon="arrow-right-up" size="xs" className="ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default NextEventCard;
