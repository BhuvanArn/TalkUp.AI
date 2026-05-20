import { useEffect, useMemo, useState } from 'react';

import { ProgressBar } from '../../atoms/cv-import/ProgressBar';
import { AnalysisStatus } from '../../molecules/cv-import/AnalysisStatus';

/**
 * @interface AIProcessingOverlayProps
 * @description Properties for the AIProcessingOverlay component.
 */
interface AIProcessingOverlayProps {
  /** Callback function triggered once the progress bar reaches 100% */
  onFinished: () => void;
}

/**
 * AIProcessingOverlay Organism
 * @description Manages the "Step 2: Analysis" UI logic. It simulates an AI processing
 * phase by cycling through status messages and incrementing a progress bar.
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

  const messages = useMemo(
    () => [
      'Reading CV structure...',
      'Extracting key skills...',
      'Analyzing job requirements...',
      'Comparing experiences with job keywords...',
      'Calculating matching score...',
      'Generating final report...',
    ],
    [],
  );

  useEffect(() => {
    // Initialisé à undefined pour satisfaire la vérification stricte de TypeScript
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          timeoutId = setTimeout(onFinished, 500);
          return 100;
        }

        const nextProgress = Math.min(prev + 2, 100);

        const msgIndex = Math.floor((nextProgress / 100) * messages.length);
        setCurrentMessage(messages[msgIndex] || messages[messages.length - 1]);

        return nextProgress;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [onFinished, messages]);

  return (
    <div style={overlayStyle}>
      <div style={contentBox}>
        {/* Titre corrigé sans fautes d'orthographe */}
        <h2 style={{ marginBottom: '24px' }}>TalkUp.AI analysis in progress</h2>

        <AnalysisStatus message={currentMessage} />

        <div style={{ marginTop: '24px' }}>
          <ProgressBar progress={progress} />
          <p
            style={{
              textAlign: 'right',
              fontSize: '12px',
              marginTop: '8px',
              color: '#64748B',
            }}
          >
            {progress}%
          </p>
        </div>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const contentBox: React.CSSProperties = {
  width: '100%',
  maxWidth: '500px',
  padding: '40px',
  backgroundColor: 'white',
  borderRadius: '24px',
  textAlign: 'center',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};
