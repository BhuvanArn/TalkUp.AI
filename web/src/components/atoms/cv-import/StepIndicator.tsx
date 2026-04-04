import React from 'react';

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
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 12,
      borderBottom: active ? '3px solid #2B70C9' : '3px solid transparent',
      opacity: active ? 1 : 0.4,
      transition: 'all 0.3s ease',
    }}
  >
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: active ? '#2B70C9' : '#E5E7EB',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {number}
    </div>
    <span
      style={{
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        color: active ? '#2B70C9' : '#64748B',
      }}
    >
      {label}
    </span>
  </div>
);
