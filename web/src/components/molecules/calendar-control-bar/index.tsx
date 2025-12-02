import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { SwitchButton } from '@/components/atoms/switch-button';
import { useCalendarStore } from '@/stores/useCalendarStore';

/**
 * CalendarControlBar component.
 *
 * @returns JSX.Element representing the calendar control bar.
 */
const CalendarControlBar = () => {
  const {
    calendarViewMode,
    setCalendarViewMode,
    calendarLayoutMode,
    setCalendarLayoutMode,
  } = useCalendarStore();

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-h5 text-idle">Calendar</h2>
      <div className="flex gap-4 items-center">
        <Button variant="outlined" color="sidebar" size="xs">
          Filters
          <Icon icon="settings" />
        </Button>
        <SwitchButton
          leftLabel="Week"
          rightLabel="Day"
          activeView={calendarViewMode === 'week' ? 'left' : 'right'}
          onSwitch={(view) => {
            setCalendarViewMode(view === 'left' ? 'week' : 'day');
          }}
        />
        <SwitchButton
          leftLabel="Table"
          rightLabel="List"
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
