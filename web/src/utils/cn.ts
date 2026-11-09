import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Custom tailwind-merge instance configured to preserve custom utility classes.
 * This prevents tailwind-merge from removing custom classes defined in @layer utilities.
 */
const twMerge = extendTailwindMerge({
  extend: {
    // Radius role tokens from tailwind.css (`--radius-button`, `--radius-card`).
    theme: {
      radius: ['button', 'card'],
    },
    classGroups: {
      'font-size': [
        'text-h1',
        'text-h2',
        'text-h3',
        'text-h4',
        'text-h5',
        'text-h6',
        'text-body-xl-strong',
        'text-body-l',
        'text-body-l-strong',
        'text-body-m',
        'text-body-s',
        'text-body-s-strong',
        'text-label-m',
        'text-label-s',
        'text-button-l',
        'text-button-m',
        'text-button-s',
      ],
    },
  },
});

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 * Preserves custom utility classes defined in @layer utilities.
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
