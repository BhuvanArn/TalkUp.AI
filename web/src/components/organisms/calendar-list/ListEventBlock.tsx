import { getEventColorData } from '@/utils/eventColors';

import { ListEventBlockProps } from './types';

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
  const colors = getEventColorData(color);

  return (
    <div className="relative -full overflow-hidden rounded-[5px] hover:bg-surface">
      <span
        className="absolute left-0 top-3 bottom-3 w-[3px]"
        style={{ backgroundColor: colors.border }}
        aria-hidden="true"
      />
      <div className="py-3 pr-3 pl-6 flex flex-col justify-center">
        <p className="text-body-s text-idle/70 mb-1">
          {startTime} to {endTime}
        </p>
        <h4 className="text-body-s-strong text-idle">{title}</h4>
        {subtitle && (
          <p className="text-body-s text-idle/50 leading-snug line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default ListEventBlock;
