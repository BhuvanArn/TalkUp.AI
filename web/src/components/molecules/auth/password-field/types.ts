import type { BaseInputProps } from '@/components/atoms/base-input';

/**
 * Props for PasswordField.
 * Extends BaseInput (minus `type`, which the toggle owns) with an optional
 * external label, a show/hide toggle, and an advisory strength meter.
 */
export type PasswordFieldProps = Omit<BaseInputProps, 'type'> & {
  /** Optional external label rendered above the input, bound via htmlFor. */
  label?: string;
  /**
   * Rule shown under the input and announced with it (`aria-describedby`).
   * Use it instead of the placeholder: a placeholder disappears on typing and
   * gets cut off when the rule is longer than the field.
   */
  hint?: string;
  /** Render the show/hide eye toggle. Default true. */
  showToggle?: boolean;
  /** Render the advisory 4-segment strength meter. Default false. */
  showStrength?: boolean;
};
