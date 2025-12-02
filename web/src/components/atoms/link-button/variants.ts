import { cva } from 'class-variance-authority';

/**
 * LinkButton component variants using CVA
 */
export const linkButtonVariants = cva(
  'h-6 px-2 py-0.5 w-fit rounded-md inline-flex items-center justify-center gap-2 transition-colors cursor-pointer',
  {
    variants: {
      variant: {
        // Dark variant with border
        idle: 'bg-transparent border border-border-strong text-text-weakest hover:bg-surface-raised hover:text-text-weak dark:border-border dark:text-text-weaker dark:hover:bg-surface',
        // Dark variant filled
        hover:
          'bg-neutral-weaker text-white hover:bg-neutral-weak dark:bg-neutral-weaker dark:text-text dark:hover:bg-neutral-weak',
        // Light variant with border
        light:
          'bg-accent-weaker border border-accent-weak text-idle hover:bg-accent-weak hover:text-text-active dark:bg-surface-raised dark:border-border dark:text-text-weak dark:hover:bg-surface dark:hover:text-text',
        // Light variant filled
        lighter:
          'bg-accent-weak text-text-active hover:bg-border-strong hover:text-black dark:bg-surface dark:text-text dark:hover:bg-border dark:hover:text-text-weak',
      },
    },
    defaultVariants: {
      variant: 'idle',
    },
  },
);
