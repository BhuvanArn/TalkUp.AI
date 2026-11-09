import { type VariantProps, cva } from 'class-variance-authority';

/**
 * IconAction component variants using class-variance-authority
 *
 * Defines minimal styling for icon-only buttons with color transitions on hover.
 * These buttons are designed for subtle interactions in cards and compact UIs.
 *
 * Features:
 * - No background or border
 * - Only icon color changes on hover
 * - Smooth transitions
 * - Accessible focus states
 *
 * @example
 * ```tsx
 * <IconAction icon="times" color="text-idle" ariaLabel="Close" />
 * <IconAction icon="edit" color="primary" size="sm" ariaLabel="Edit" />
 * ```
 */
export const iconActionVariants = cva(
  [
    // 24px minimum target (WCAG 2.5.8), whatever the icon size.
    'inline-flex items-center justify-center min-h-6 min-w-6',
    'bg-transparent border-none',
    'cursor-pointer',
    'transition-colors duration-200 ease-in-out',
    'rounded-button',
    'focus-ring',
    'disabled:text-text-disabled disabled:cursor-not-allowed',
  ],
  {
    variants: {
      color: {
        primary:
          'text-primary hover:text-primary-hover active:text-primary-active',
        accent: 'text-accent hover:text-accent-hover active:text-accent-active',
        text: 'text-text hover:text-text-idle active:text-text-weak',
        'text-idle': 'text-text-idle hover:text-text active:text-text',
        'text-weak': 'text-text-weak hover:text-text-idle active:text-text',
        'text-weakest':
          'text-text-weakest hover:text-text-weak active:text-text-idle',
        error: 'text-error hover:text-error-hover active:text-error-active',
        success:
          'text-success hover:text-success-hover active:text-success-active',
        warning:
          'text-warning hover:text-warning-hover active:text-warning-active',
      },
    },
    defaultVariants: {
      color: 'text-idle',
    },
  },
);

/**
 * Type for icon button variant props extracted from the iconActionVariants definition
 */
export type IconActionVariants = VariantProps<typeof iconActionVariants>;
