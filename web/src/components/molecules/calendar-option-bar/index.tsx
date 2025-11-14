import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';

type CalendarView = 'List' | 'Table';

// CORRECTION : AJOUT DES PROPS DE NAVIGATION DE LA SEMAINE
interface CalendarOptionBarProps {
  activeView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  startDate: string; // Ex: 'Nov 10'
  endDate: string; // Ex: 'Nov 16'
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const CalendarOptionBar = ({
  activeView,
  onViewChange,
  startDate,
  endDate,
  onPrevWeek,
  onNextWeek,
}: CalendarOptionBarProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      {/* 1. Navigation Semaine */}
      <div className="flex items-center space-x-3">
        <h3 className="text-xl font-semibold text-gray-800">
          {startDate} - {endDate} {/* Affichage de la semaine */}
        </h3>
        <div className="flex space-x-1">
          {/* Boutons de navigation */}
          <Button variant="text" size="sm" onClick={onPrevWeek}>
            <Icon icon="arrow-left" size="sm" />
          </Button>
          <Button variant="text" size="sm" onClick={onNextWeek}>
            <Icon icon="arrow-right" size="sm" />
          </Button>
        </div>
      </div>

      {/* 2. Options (Filters et View Toggle) */}
      <div className="flex items-center space-x-3">
        {/* Bouton Filters (Stub) */}
        <Button variant="outlined" size="sm">
          <Icon icon="cog" className="mr-1" />
          Filters
        </Button>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <Button
            size="sm"
            onClick={() => onViewChange('Table')}
            variant={activeView === 'Table' ? 'outlined' : 'text'}
            className={activeView === 'Table' ? '' : 'border-r'}
          >
            Table
          </Button>
          <Button
            size="sm"
            onClick={() => onViewChange('List')}
            variant={activeView === 'List' ? 'outlined' : 'text'}
          >
            List
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalendarOptionBar;
