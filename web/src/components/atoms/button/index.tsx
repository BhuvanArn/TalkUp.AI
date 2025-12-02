import { cn } from '@/utils/cn';
import React from 'react';

import { ButtonProps } from './types';
import { buttonVariants } from './variants';

/**
 * A customizable button component that supports different variants, colors, and sizes.
 *
 * @component
 * @param {Object} props - The component props
 * @param {'contained' | 'outlined' | 'text'} [props.variant='contained'] - The visual style variant
 * @param {'primary' | 'accent' | 'black' | 'white' | 'error' | 'warning' | 'neutral' | 'success' | 'sidebar'} [props.color='primary'] - The color scheme
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - The size of the button
 * @param {boolean} [props.loading=false] - Whether to show a loading indicator
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {boolean} [props.squared=false] - Makes button square with equal padding on all sides
 * @param {boolean} [props.circled=false] - Makes button circular (implies squared with rounded-full)
 * @param {React.ReactNode} props.children - The content to be displayed inside the button
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} The button component
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      color,
      size,
      loading = false,
      disabled = false,
      squared = false,
      circled = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({
            variant,
            color,
            size,
            disabled,
            loading,
            squared,
            circled,
          }),
          className,
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
