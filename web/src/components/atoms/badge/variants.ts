import { type VariantProps, cva } from 'class-variance-authority';

/**
 * Badge component variants using class-variance-authority
 *
 * Defines the styling for different badge colors.
 * All badges have a solid background with 10% opacity and matching text color.
 *
 * @example
 * ```tsx
 * <Badge color="accent">New</Badge>
 * <Badge color="success">Active</Badge>
 * ```
 */
export const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'px-2 py-1',
    'rounded-md',
    'text-label-s font-medium',
    'w-fit',
  ],
  {
    variants: {
      color: {
        accent: 'bg-accent/10 text-accent',
        primary: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        neutral: 'bg-neutral/10 text-neutral',
      },
    },
    defaultVariants: {
      color: 'accent',
    },
  },
);

/**
 * Type for badge variant props extracted from the badgeVariants definition
 */
export type BadgeVariants = VariantProps<typeof badgeVariants>;
