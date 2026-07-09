import { useEffect, useRef } from 'react';

import { ProgressBar } from '../../atoms/cv-import-progress-bar';
import { AnalysisStatus } from '../../molecules/cv-import-analysis-status';

/**
 * @interface AIProcessingOverlayProps
 * @description Properties for the AIProcessingOverlay component.
 */
interface AIProcessingOverlayProps {
  /** Current real request step — drives the displayed message and progress. */
  step: 'cv' | 'offer';
}

/** Message + progress shown for each real pipeline step. */
const STEP_DISPLAY: Record<
  AIProcessingOverlayProps['step'],
  { message: string; progress: number }
> = {
  cv: { message: 'Analyzing your CV...', progress: 35 },
  offer: { message: 'Extracting the job offer...', progress: 75 },
};

/**
 * AIProcessingOverlay Organism
 *
 * @description Renders the "Step 2: Analysis" UI, driven by the real
 * upload/creation request lifecycle (no simulated timer). The parent owns
 * the current `step` and advances it as each request resolves.
 *
 * @param {AIProcessingOverlayProps} props - Component props.
 * @returns {JSX.Element} A full-screen fixed overlay with a progress indicator.
 */
export const AIProcessingOverlay = ({ step }: AIProcessingOverlayProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { message, progress } = STEP_DISPLAY[step];

  // Move focus into the dialog on mount so keyboard / screen-reader users are
  // anchored to the processing state rather than the now-inert page behind it.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-background/90">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-processing-title"
        tabIndex={-1}
        className="bg-background w-full max-w-[500px] rounded-3xl p-10 text-center shadow-xl outline-none"
      >
        <h2 id="ai-processing-title" className="text-h5 text-text mb-6">
          TalkUp.AI analysis in progress
        </h2>

        <div aria-live="polite">
          <AnalysisStatus message={message} />
        </div>

        <div className="mt-6">
          <ProgressBar progress={progress} />
          <p className="text-body-s text-text-weaker mt-2 text-right">
            {progress}%
          </p>
        </div>
      </div>
    </div>
  );
};
