import { useEffect, useState } from 'react';

import { ProgressBar } from '../../atoms/cv-import/ProgressBar';
import { AnalysisStatus } from '../../molecules/cv-import/AnalysisStatus';

/**
 * @interface AIProcessingOverlayProps
 * @property {() => void} onFinished - Callback triggered when the simulation reaches 100%.
 */
interface AIProcessingOverlayProps {
  onFinished: () => void;
}

/**
 * AIProcessingOverlay Organism
 * @description Manages the "Step 2: Analyse" logic by cycling through AI processing messages
 * and updating the progress bar.
 */
export const AIProcessingOverlay = ({
  onFinished,
}: AIProcessingOverlayProps) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(
    'Initializing AI Engine...',
  );

  const messages = [
    'Reading CV structure...',
    'Extracting key skills...',
    'Analyzing job requirements...',
    'Comparing experiences with job keywords...',
    'Calculating matching score...',
    'Generating final report...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinished, 500);
          return 100;
        }

        const msgIndex = Math.floor((prev / 100) * messages.length);
        setCurrentMessage(messages[msgIndex] || messages[messages.length - 1]);

        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={overlayStyle}>
      <div style={contentBox}>
        <h2 style={{ marginBottom: '24px' }}>Analyse TalkUp.AI en cours</h2>
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
