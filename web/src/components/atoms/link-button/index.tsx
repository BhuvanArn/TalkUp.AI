import { cn } from '@/utils/cn';
import React from 'react';

import { Icon } from '../icon';
import { LinkButtonProps } from './types';
import { linkButtonVariants } from './variants';

/**
 * A link-styled button component with icon support
 *
 * @component
 * @param {Object} props - The component props
 * @param {'idle' | 'hover' | 'light' | 'lighter'} [props.variant='idle'] - The visual variant
 * @param {React.ReactNode} props.children - Button content (text)
 * @param {React.ReactNode} [props.icon] - Optional icon element to display
 * @param {string} [props.className] - Additional CSS classes
 * @param {Function} [props.onClick] - Click handler
 *
 * @returns {JSX.Element} The link button component
 *
 * @example
 * // Basic usage
 * <LinkButton variant="idle" onClick={() => console.log('clicked')}>
 *   Try it out
 * </LinkButton>
 *
 * @example
 * // With icon
 * <LinkButton variant="hover" icon={<Icon icon="arrow-right" size="xs" />}>
 *   Learn more
 * </LinkButton>
 */
export const LinkButton = React.forwardRef<HTMLButtonElement, LinkButtonProps>(
  ({ variant = 'idle', children, icon, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(linkButtonVariants({ variant }), className)}
        {...props}
      >
        <span className="text-button-s font-display text-idle">{children}</span>
        {icon && <Icon icon={icon} size="sm" />}
      </button>
    );
  },
);

LinkButton.displayName = 'LinkButton';

export default LinkButton;
