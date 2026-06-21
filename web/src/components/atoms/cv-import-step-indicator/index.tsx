import { cn } from '@/utils/cn';

/**
 * @interface StepIndicatorProps
 * @description Properties for an individual step in the stepper.
 */
interface StepIndicatorProps {
  /** The step number (1, 2, or 3) */
  number: number;
  /** Whether this step is currently active */
  active: boolean;
  /** The descriptive text for the step */
  label: string;
}

/**
 * StepIndicator Atom
 * @description Visual representation of a single step in a multi-step process.
 * @param {StepIndicatorProps} props - Component properties.
 */
export const StepIndicator = ({
  number,
  active,
  label,
}: StepIndicatorProps) => (
  <div
    className={cn(
      'flex items-center gap-2 border-b-[3px] pb-3 transition-all',
      active ? 'border-accent' : 'border-transparent',
    )}
  >
    <div
      className={cn(
        'text-body-s-strong flex h-6 w-6 items-center justify-center rounded-full',
        active ? 'bg-accent text-white' : 'bg-surface-raised text-text-weaker',
      )}
    >
      {number}
    </div>
    <span
      className={cn(
        'text-body-m',
        active ? 'text-accent font-semibold' : 'text-text-weaker',
      )}
    >
      {label}
    </span>
  </div>
);
