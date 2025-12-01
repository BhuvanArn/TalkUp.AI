import { useState } from 'react';

export interface SwitchButtonProps {
  leftLabel: string;
  rightLabel: string;
  onSwitch: (view: 'left' | 'right' ) => void;
  defaultActive?: 'left' | 'right';
}

export const SwitchButton = ({
  leftLabel, rightLabel, onSwitch, defaultActive = 'left'
}: SwitchButtonProps) => {
  const [active, setActive] = useState<'left' | 'right'>(defaultActive);

  const handleSwitch = (view: 'left' | 'right') => {
    setActive(view);
    onSwitch(view);
  };

  return (
    <div className="flex items-center bg-surface border border-surface-raised rounded-[20px] transition-colors h-8">
      <button
        onClick={() => handleSwitch('left')}
        className={`px-3 py-0.5 h-8 text-button-s cursor-pointer rounded-[20px] transition-colors ${
          active === 'left' ? 'text-active bg-surface-raised hover:bg-surface-raised-hover' : 'text-idle'
        }`}
      >
        {leftLabel}
      </button>
      <button
        onClick={() => handleSwitch('right')}
        className={`px-3 py-0.5 h-8 text-button-s cursor-pointer rounded-[20px] transition-colors ${
          active === 'right' ? 'text-active bg-surface-raised hover:bg-surface-raised-hover' : 'text-idle'
        }`}
      >
        {rightLabel}
      </button>
    </div>
  );
}
