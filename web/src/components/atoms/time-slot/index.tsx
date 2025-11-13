/**
 * TimeSlot component.
 * Displays a specific hour in the left column of the calendar view.
 */
interface TimeSlotProps {
  /** The hour to display (e.g., "8:00", "12:00"). */
  time: string;
}

const TimeSlot = ({ time }: TimeSlotProps) => {
  return (
    <div className="h-12 flex items-start justify-end pr-4 text-xs text-gray-400 -mt-2">
      {time}
    </div>
  );
};

export default TimeSlot;
