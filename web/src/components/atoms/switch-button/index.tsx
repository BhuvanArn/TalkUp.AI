import { useState } from 'react';
import { SwitchButtonProps } from './types';

/**
 * Switch Button component
 *
 * @param param0 Props for the SwitchButton component.
 * @returns the atomic component Switch Button
 */
export const SwitchButton = ({
  leftLabel,
  rightLabel,
  onSwitch,
  defaultActive = 'left',
  activeView,
}: SwitchButtonProps) => {
  const [internalActive, setInternalActive] = useState<'left' | 'right'>(
    defaultActive,
  );

  const active = activeView ?? internalActive;

  const handleSwitch = (view: 'left' | 'right') => {
    if (activeView === undefined) {
      setInternalActive(view);
    }
    onSwitch(view);
  };

  return (
    <div className="flex items-center bg-surface border border-surface-raised rounded-[20px] transition-colors h-6">
      <button
        onClick={() => handleSwitch('left')}
        className={`px-3 py-0.5 h-6 text-button-s cursor-pointer rounded-[20px] transition-colors ${
          active === 'left'
            ? 'text-active bg-surface-raised hover:bg-surface-raised-hover'
            : 'text-idle'
        }`}
      >
        {leftLabel}
      </button>
      <button
        onClick={() => handleSwitch('right')}
        className={`px-3 py-0.5 h-6 text-button-s cursor-pointer rounded-[20px] transition-colors ${
          active === 'right'
            ? 'text-active bg-surface-raised hover:bg-surface-raised-hover'
            : 'text-idle'
        }`}
      >
        {rightLabel}
      </button>
    </div>
  );
};
