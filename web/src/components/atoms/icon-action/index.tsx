import { cn } from '@/utils/cn';
import React from 'react';

import { Icon } from '../icon';
import { IconActionProps } from './types';
import { iconActionVariants } from './variants';

/**
 * IconAction atom component
 *
 * A minimal button component that displays only an icon with subtle hover effects.
 * Designed for use in cards, toolbars, and compact UIs where space is limited.
 *
 * Features:
 * - Icon-only display with no background or border
 * - Simple color transition on hover
 * - Accessible with proper ARIA labels
 * - Compact and unobtrusive
 *
 * @component
 * @example
 * ```tsx
 * // Close button
 * <IconAction
 *   icon="times"
 *   ariaLabel="Close notification"
 *   onClick={handleClose}
 * />
 *
 * // Edit button with custom color
 * <IconAction
 *   icon="edit"
 *   color="primary"
 *   size="sm"
 *   ariaLabel="Edit item"
 * />
 *
 * // Delete button
 * <IconAction
 *   icon="trash"
 *   color="error"
 *   ariaLabel="Delete"
 * />
 * ```
 *
 * @param {Object} props - The component props
 * @param {IconName | React.ComponentType} props.icon - The icon to display
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] - The size of the icon
 * @param {IconActionColor} [props.color='text-idle'] - The color scheme
 * @param {string} [props.ariaLabel] - Accessibility label (important for screen readers)
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} The icon button component
 */
export const IconAction = React.forwardRef<HTMLButtonElement, IconActionProps>(
  (
    {
      icon,
      size = 'md',
      color,
      ariaLabel,
      className,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(iconActionVariants({ color }), className)}
        aria-label={ariaLabel}
        disabled={disabled}
        {...props}
      >
        <Icon icon={icon} size={size} />
      </button>
    );
  },
);

IconAction.displayName = 'IconAction';

export default IconAction;
