import React from 'react';

import { StepIndicator } from '../../atoms/cv-import/StepIndicator';

/**
 * @interface StepperProps
 * @description Properties for the Stepper molecule.
 */
interface StepperProps {
  /** The current active step index (1-based) */
  currentStep: number;
}

/**
 * Stepper Molecule
 * @description Displays the progression of the CV import flow.
 * @param {StepperProps} props - Component properties.
 */
export const Stepper = ({ currentStep }: StepperProps) => (
  <div style={stepperContainerStyle}>
    <StepIndicator number={1} label="Upload" active={currentStep === 1} />
    <StepIndicator number={2} label="Analyse" active={currentStep === 2} />
    <StepIndicator number={3} label="Confirmation" active={currentStep === 3} />
  </div>
);

const stepperContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '40px',
  padding: '24px 40px 0',
  borderBottom: '1px solid #F1F5F9',
  backgroundColor: '#FFF',
};
