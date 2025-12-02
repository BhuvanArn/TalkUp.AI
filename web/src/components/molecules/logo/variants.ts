import { type VariantProps, cva } from 'class-variance-authority';

export const logoVariants = cva(
  // Base styles
  ['flex items-center justify-start'],
  {
    variants: {
      variant: {
        line: 'flex-row gap-3 h-8',
        column: 'flex-col gap-2 h-20',
        'no-text': 'h-10',
      },
      color: {
        primary: '',
        accent: '',
      },
    },
    defaultVariants: {
      variant: 'line',
      color: 'primary',
    },
  },
);

export type LogoVariants = VariantProps<typeof logoVariants>;

// Logo size mapping based on variant
export const logoSizeMap = {
  line: 32,
  column: 32,
  'no-text': 32,
} as const;

/**
 * Determines whether the logo text should be displayed based on the given variant.
 *
 * @param variant - The display variant of the logo. Can be 'line', 'column', or 'no-text'.
 * @returns `true` if the variant is 'line' or 'column', indicating that the text should be shown; `false` if the variant is 'no-text'.
 */
export const shouldShowText = (variant: 'line' | 'column' | 'no-text') => {
  return variant !== 'no-text';
};
