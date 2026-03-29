import { Icon } from '@/components/atoms/icon';

import { CalendarListAddButtonProps } from './types';

/**
 * CalendarListAddButton component.
 * Displays a button to add a new event to the calendar list.
 *
 * @param props - The properties for the component.
 * @returns The rendered add event button.
 */
const CalendarListAddButton = ({ onClick }: CalendarListAddButtonProps) => {
  return (
    <div className="flex justify-start w-full py-1">
      <button
        onClick={onClick}
        className="group flex items-center gap-2 px-3 py-2 rounded-[5px] border border-dashed border-border bg-transparent hover:bg-surface hover:border-idle/50 text-idle/70 hover:text-idle transition-colors cursor-pointer"
      >
        <Icon icon="plus" />
        <span className="text-body-s-strong">Add Event</span>
      </button>
    </div>
  );
};

export default CalendarListAddButton;
