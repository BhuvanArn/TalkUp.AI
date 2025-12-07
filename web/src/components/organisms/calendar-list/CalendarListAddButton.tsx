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
    <button
      onClick={onClick}
      className="mt-3 overflow-hidden rounded-[5px] group/add-btn cursor-pointer transition-colors"
    >
      <div className="p-3 flex gap-2 items-center justify-center border border-border rounded-[5px] h-12 text-idle hover:text-active bg-surface hover:bg-surface-raised">
        <Icon icon="plus" />
        <span className="text-button-m">Add Event</span>
      </div>
    </button>
  );
};

export default CalendarListAddButton;
