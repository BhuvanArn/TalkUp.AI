import React from 'react';

import { IconName } from '../icon/icon-map';

/**
 * Props for LinkButton component
 */
export interface LinkButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: 'idle' | 'hover' | 'light' | 'lighter';

  /** Button text content */
  children: React.ReactNode;

  /** Optional icon element */
  icon?: IconName;

  /** Additional CSS classes */
  className?: string;
}
