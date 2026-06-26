import { useEffect, useRef, useState } from 'react';

import { ProgressBar } from '../../atoms/cv-import-progress-bar';
import { AnalysisStatus } from '../../molecules/cv-import-analysis-status';

/**
 * @interface AIProcessingOverlayProps
 * @description Properties for the AIProcessingOverlay component.
 */
interface AIProcessingOverlayProps {
  /** Callback function triggered once the progress bar reaches 100% */
  onFinished: () => void;
}

/** Static rotation of simulated status messages shown during processing. */
const PROCESSING_MESSAGES = [
  'Reading CV structure...',
  'Extracting key skills...',
  'Analyzing job requirements...',
  'Comparing experiences with job keywords...',
  'Calculating matching score...',
  'Generating final report...',
];

/**
 * AIProcessingOverlay Organism
 *
 * @description Renders the "Step 2: Analysis" UI.
 *
 * NOTE: This is currently a UI-first stub. There is no backend CV-analysis
 * pipeline yet, so the progress here is *simulated* — it cycles through status
 * messages and increments a progress bar on a timer rather than reflecting real
 * work. Once the analysis API exists, drive `progress`/`currentMessage` from the
 * request lifecycle instead of the interval below.
 *
 * @param {AIProcessingOverlayProps} props - Component props.
 * @returns {JSX.Element} A full-screen fixed overlay with a progress indicator.
 */
export const AIProcessingOverlay = ({
  onFinished,
}: AIProcessingOverlayProps) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(
    'Initializing AI Engine...',
  );
  const dialogRef = useRef<HTMLDivElement>(null);

  // Simulated progress timer — replace with real request lifecycle once the
  // backend analysis endpoint exists.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          timeoutId = setTimeout(onFinished, 500);
          return 100;
        }

        const nextProgress = Math.min(prev + 2, 100);

        const msgIndex = Math.floor(
          (nextProgress / 100) * PROCESSING_MESSAGES.length,
        );
        setCurrentMessage(
          PROCESSING_MESSAGES[msgIndex] ||
            PROCESSING_MESSAGES[PROCESSING_MESSAGES.length - 1],
        );

        return nextProgress;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [onFinished]);

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
          <AnalysisStatus message={currentMessage} />
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
