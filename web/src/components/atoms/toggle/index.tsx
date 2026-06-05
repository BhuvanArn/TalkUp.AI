import { cn } from '@/utils/cn';
import type { CSSProperties } from 'react';

import type { ToggleProps } from './types';

export type { ToggleProps };

const toggleAccentVar = '--toggle-accent';

export const Toggle = ({
  enabled,
  onToggle,
  accentColor = '#2B70C9',
  disabled = false,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
}: ToggleProps) => {
  const accentStyle = {
    [toggleAccentVar]: accentColor,
  } as CSSProperties;

  return (
    <button
      id={id}
      type="button"
      onClick={() => {
        if (!disabled) {
          onToggle();
        }
      }}
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      style={accentStyle}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full border-[0.5px] transition-[background-color,border-color] duration-200 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        enabled
          ? 'border-[color:var(--toggle-accent)] bg-[color:var(--toggle-accent)]'
          : 'border-border-strong bg-surface-raised',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-0.5 size-3.5 rounded-full bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)] transition-[left] duration-200 ease-out',
          enabled ? 'left-[18px]' : 'left-0.5',
        )}
      />
    </button>
  );
};
