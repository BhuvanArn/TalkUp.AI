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
    <div className="grid grid-cols-[100px_1fr] overflow-hidden rounded-[5px] hover:bg-surface">
      <div className="flex flex-col justify-center items-center py-2 text-center w-16 shrink-0">
        <span className="text-body-s-strong text-idle">{startTime}</span>
        <span className="text-body-s text-idle/50">{endTime}</span>
      </div>

      <div
        className="p-3 flex flex-col justify-center border-l-2"
        style={{
          backgroundColor: colors.background,
          borderLeftColor: colors.border,
        }}
      >
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
