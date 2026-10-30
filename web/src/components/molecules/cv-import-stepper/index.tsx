import { useTranslation } from 'react-i18next';

import { StepIndicator } from '../../atoms/cv-import-step-indicator';

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
export const Stepper = ({ currentStep }: StepperProps) => {
  const { t } = useTranslation('app');

  return (
    <div className="border-border bg-background flex gap-10 border-b px-10 pt-6">
      <StepIndicator
        number={1}
        label={t('cv.stepper.upload')}
        active={currentStep === 1}
      />
      <StepIndicator
        number={2}
        label={t('cv.stepper.analysis')}
        active={currentStep === 2}
      />
      <StepIndicator
        number={3}
        label={t('cv.stepper.confirmation')}
        active={currentStep === 3}
      />
    </div>
  );
};
