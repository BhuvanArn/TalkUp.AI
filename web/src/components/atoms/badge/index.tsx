import { cn } from '@/utils/cn';
import React from 'react';

import { BadgeProps } from './types';
import { badgeVariants } from './variants';

/**
 * Badge atom component
 *
 * A compact, inline component for displaying text labels with color-coded backgrounds.
 * Perfect for status indicators, tags, and labels.
 *
 * @component
 * @example
 * ```tsx
 * // Default badge (accent color)
 * <Badge>New</Badge>
 *
 * // With custom color
 * <Badge color="success">Active</Badge>
 * <Badge color="error">Error</Badge>
 * ```
 *
 * @param {Object} props - The component props
 * @param {'accent' | 'primary' | 'success' | 'warning' | 'error' | 'neutral'} [props.color='accent'] - The color scheme
 * @param {string} props.children - The text to be displayed inside the badge
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} The badge component
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ color, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({
            color,
          }),
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Badge.displayName = 'Badge';

export default Badge;
