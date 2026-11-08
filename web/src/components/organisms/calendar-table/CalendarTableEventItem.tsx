import { useLocale } from '@/hooks/i18n/useLocale';
import { getEventColorData } from '@/utils/eventColors';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { CalendarTableEventItemProps } from './types';

/**
 * CalendarTableEventItem component to display a single event in the calendar.
 *
 * @param param0 Props for the CalendarTableEventItem component.
 * @returns A styled event item for the calendar.
 */
const CalendarTableEventItem = ({
  title,
  subtitle,
  color,
  startHour,
  startMinute,
  endHour,
  endMinute,
}: CalendarTableEventItemProps) => {
  const { t } = useTranslation('app');
  const { dateFnsLocale } = useLocale();
  const colors = getEventColorData(color);

  const timeRange =
    startHour !== undefined &&
    startMinute !== undefined &&
    endHour !== undefined &&
    endMinute !== undefined
      ? (() => {
          const startDate = new Date();
          startDate.setHours(startHour, startMinute);
          const endDate = new Date();
          endDate.setHours(endHour, endMinute);
          return t('agenda.timeRange', {
            start: format(startDate, 'H:mm', { locale: dateFnsLocale }),
            end: format(endDate, 'H:mm', { locale: dateFnsLocale }),
          });
        })()
      : null;

  return (
    <div
      className="w-full h-full p-2 overflow-hidden box-border rounded-b-[5px]"
      style={{
        background: colors.background,
        borderTop: `2px solid ${colors.border}`,
      }}
    >
      <div className="overflow-scroll flex flex-col gap-2 custom-scrollbar h-full">
        <span className="text-body-s text-idle">{title}</span>
        {subtitle && (
          <span className="text-body-s italic text-idle/50">{subtitle}</span>
        )}

        {timeRange && (
          <div className="w-full text-center text-idle text-body-s">
            {timeRange}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarTableEventItem;
