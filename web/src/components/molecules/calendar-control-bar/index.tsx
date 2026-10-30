import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { SwitchButton } from '@/components/atoms/switch-button';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useTranslation } from 'react-i18next';

/**
 * CalendarControlBar component.
 *
 * @returns JSX.Element representing the calendar control bar.
 */
const CalendarControlBar = () => {
  const { t } = useTranslation('app');
  const {
    currentDate,
    calendarViewMode,
    setCalendarViewMode,
    calendarLayoutMode,
    setCalendarLayoutMode,
    openModalForCreation,
  } = useCalendarStore();

  const handleCreateEvent = () => {
    const start = new Date(currentDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);
    openModalForCreation(start, end);
  };

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-h5 text-idle">{t('agenda.controlBar.title')}</h2>
      <div className="flex gap-4 items-center">
        <Button color="accent" size="xs" onClick={handleCreateEvent}>
          {t('agenda.controlBar.createEvent')}
          <Icon icon="plus" />
        </Button>
        <Button variant="outlined" color="sidebar" size="xs">
          {t('agenda.controlBar.filters')}
          <Icon icon="settings" />
        </Button>
        <SwitchButton
          leftLabel={t('agenda.controlBar.week')}
          rightLabel={t('agenda.controlBar.day')}
          activeView={calendarViewMode === 'week' ? 'left' : 'right'}
          onSwitch={(view) => {
            setCalendarViewMode(view === 'left' ? 'week' : 'day');
          }}
        />
        <SwitchButton
          leftLabel={t('agenda.controlBar.table')}
          rightLabel={t('agenda.controlBar.list')}
          activeView={calendarLayoutMode === 'table' ? 'left' : 'right'}
          onSwitch={(view) => {
            setCalendarLayoutMode(view === 'left' ? 'table' : 'list');
          }}
        />
      </div>
    </div>
  );
};

export default CalendarControlBar;
