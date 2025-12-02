import { Icon } from '@/components/atoms/icon';

import { NavSelectorProps } from './types';

/**
 * Generic navigation selector component
 *
 * Displays a selectable item with a colored indicator and toggle functionality.
 * Used for switching between contexts like applications.
 *
 * @component
 */
export const NavSelector = ({
  label,
  color,
  isExpanded,
  onToggle,
  isCollapsed,
}: NavSelectorProps) => {
  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="w-8 h-4 my-2 rounded-[5px] flex items-center justify-center transition-all cursor-pointer mx-auto"
        style={{ backgroundColor: `${color}CC` }}
        title={label}
      >
        <Icon
          icon={isExpanded ? 'caret-down' : 'caret-right'}
          size="xs"
          className="text-surface-sidebar"
        />
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      className={`w-full px-3 py-2 rounded-[5px] h-8 flex justify-between items-center transition-colors cursor-pointer ${
        isExpanded
          ? 'bg-surface-sidebar-active'
          : 'hover:bg-surface-sidebar-hover'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 relative">
          <div
            className="w-4 h-4 rounded-full"
            style={{
              background: `${color}CC`,
            }}
          />
        </div>
        <span className="text-button-s text-idle">{label}</span>
      </div>
      <div className="w-4 h-4 relative">
        <Icon
          icon={isExpanded ? 'caret-down' : 'caret-right'}
          size="sm"
          color="neutral"
        />
      </div>
    </button>
  );
};
